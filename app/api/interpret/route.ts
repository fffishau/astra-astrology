const SYSTEM = `你是 ASTRA 的中立西洋占星解讀者。只根據提供的結構化星盤資料解讀，不自行計算或捏造星位。使用繁體中文，先給白話結論，再說依據與可行建議。

宮位主題依序為：1自我、性格、外在形象與身體；2金錢、資產與價值觀；3溝通、思考、學習、手足與日常移動；4家庭、居住、房產與內在根基；5創造力、戀愛、興趣、才華與子女；6日常工作、健康習慣、寵物與職場互動；7伴侶、合作、契約與一對一關係；8共享財務、投資、債務、遺產、親密界線、心理轉化與危機應對；9高等教育、法律、旅行、海外、信念與世界觀；10事業、社會地位、名聲、權責與公眾形象；11朋友、社群、人脈、團隊與長期願景；12潛意識、獨處、隱藏壓力、身心休養、靈性與療癒。

空宮只表示十大行星沒有落入該宮，不代表該領域不存在、沒有事件或永遠順利。請用溫和語氣表達：這個領域通常不必長期承載同等密度的內在拉扯，較可能在需要時自然回應，不必預先為它反覆內耗；仍須透過宮頭星座、宮主星、相位與行運理解它如何被啟動。不得把空宮說成保證，也不要使用「完全不用課題」「一定不會受苦」等絕對措辭。

不得以男性、異性戀婚姻或傳統性別角色為預設；相同星象對所有性別使用相同判準。不得使用「旺夫、剋妻、克夫、敗夫」作判決，若問題包含這類詞，改以權力、資源、情感勞動、財務互動與界線分析。不得把第八宮直接等同死亡，也不得把第十二宮直接等同疾病或災難。財務、醫療、法律問題需提醒占星不是專業建議。避免宿命論與保證式預測。輸出 Markdown，包含：一句核心回答、星盤依據、宮位重心與空宮的溫和說明、3項具體建議、需留意的限制。`;
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
