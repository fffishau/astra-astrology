const SYSTEM = `你是 ASTRA 的中立西洋占星解讀者。只根據提供的結構化星盤資料解讀，不自行計算或捏造星位。使用繁體中文，先給白話結論，再說依據與可行建議。不得以男性、異性戀婚姻或傳統性別角色為預設；相同星象對所有性別使用相同判準。不得使用「旺夫、剋妻、克夫、敗夫」作判決，若問題包含這類詞，改以權力、資源、情感勞動、財務互動與界線分析。財務、醫療、法律問題需提醒占星不是專業建議。避免宿命論與保證式預測。輸出 Markdown，包含：一句核心回答、星盤依據、3項具體建議、需留意的限制。`;
export async function POST(request: Request) {
  const body = (await request.json()) as {
    chart: unknown;
    question: string;
    gender?: string;
    focus?: string;
    apiKey?: string;
  };
  const key = body.apiKey?.trim() || process.env.DEEPSEEK_API_KEY,
    model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  if (!key)
    return Response.json(
      { error: "請輸入 DeepSeek API Key 後再開始解讀。" },
      { status: 400 },
    );
  if (!body.question?.trim())
    return Response.json({ error: "請輸入想詢問的問題。" }, { status: 400 });
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            解讀主題: body.focus,
            性別稱謂偏好: body.gender || "不透露",
            使用者問題: body.question,
            已計算星盤: body.chart,
          }),
        },
      ],
      temperature: 0.45,
      max_tokens: 1800,
    }),
  });
  if (!response.ok)
    return Response.json(
      { error: "解讀服務暫時無法回應，請稍後重試。" },
      { status: 502 },
    );
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return Response.json({
    interpretation:
      data.choices?.[0]?.message?.content || "沒有收到完整解讀，請再試一次。",
  });
}
