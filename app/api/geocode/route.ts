export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json({ results: [] });
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q); url.searchParams.set("format", "jsonv2"); url.searchParams.set("limit", "6"); url.searchParams.set("addressdetails", "1"); url.searchParams.set("accept-language", "zh-TW,zh,en");
  const response = await fetch(url, { headers: { "User-Agent": "ASTRA-natal-chart/1.0", Accept: "application/json" } });
  if (!response.ok) return Response.json({ error: "目前無法搜尋地點，請稍後再試。" }, { status: 502 });
  const data = await response.json() as Array<{display_name:string;lat:string;lon:string;place_id:number}>;
  return Response.json({ results: data.map(x => ({ id:x.place_id, label:x.display_name, latitude:Number(x.lat), longitude:Number(x.lon) })) });
}
