import { HouseSystem, Planet } from "@swisseph/core";

export type ChartPoint = {
  key: string;
  name: string;
  glyph: string;
  longitude: number;
  sign: string;
  degree: number;
  house: number;
  retrograde: boolean;
};
export type Aspect = {
  a: string;
  b: string;
  type: string;
  angle: number;
  orb: number;
};
export type ChartData = {
  utc: string;
  timezone: string;
  latitude: number;
  longitude: number;
  ascendant: number;
  mc: number;
  cusps: number[];
  points: ChartPoint[];
  aspects: Aspect[];
};

const signs = [
  "牡羊座",
  "金牛座",
  "雙子座",
  "巨蟹座",
  "獅子座",
  "處女座",
  "天秤座",
  "天蠍座",
  "射手座",
  "摩羯座",
  "水瓶座",
  "雙魚座",
];
const bodies = [
  ["sun", "太陽", "☉", Planet.Sun],
  ["moon", "月亮", "☽", Planet.Moon],
  ["mercury", "水星", "☿", Planet.Mercury],
  ["venus", "金星", "♀", Planet.Venus],
  ["mars", "火星", "♂", Planet.Mars],
  ["jupiter", "木星", "♃", Planet.Jupiter],
  ["saturn", "土星", "♄", Planet.Saturn],
  ["uranus", "天王星", "♅", Planet.Uranus],
  ["neptune", "海王星", "♆", Planet.Neptune],
  ["pluto", "冥王星", "♇", Planet.Pluto],
] as const;
const aspectDefs = [
  [0, "合相", 8],
  [60, "六分相", 5],
  [90, "四分相", 7],
  [120, "三分相", 7],
  [180, "對分相", 8],
] as const;

const norm = (n: number) => ((n % 360) + 360) % 360;
function houseOf(longitude: number, cusps: number[]) {
  for (let i = 1; i <= 12; i++) {
    const start = norm(cusps[i]);
    const end = norm(cusps[i === 12 ? 1 : i + 1]);
    if (
      start <= end
        ? longitude >= start && longitude < end
        : longitude >= start || longitude < end
    )
      return i;
  }
  return 1;
}
export async function calculateChart(
  utc: Date,
  latitude: number,
  longitude: number,
  timezone: string,
): Promise<ChartData> {
  // Load the WebAssembly engine only when a chart is requested. Keeping it out
  // of the initial client bundle prevents a WASM initialization failure from
  // taking down the entire page during hydration on hosted deployments.
  const { SwissEphemeris } = await import("@swisseph/browser");
  const swe = new SwissEphemeris();
  await swe.init();
  const jd = swe.julianDay(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
    utc.getUTCHours() +
      utc.getUTCMinutes() / 60 +
      utc.getUTCSeconds() / 3600 +
      utc.getUTCMilliseconds() / 3_600_000,
  );
  const houses = swe.calculateHouses(
    jd,
    latitude,
    longitude,
    HouseSystem.Placidus,
  );
  const points: ChartPoint[] = bodies.map(([key, name, glyph, body]) => {
    const p = swe.calculatePosition(jd, body);
    const lon = norm(p.longitude);
    return {
      key,
      name,
      glyph,
      longitude: lon,
      sign: signs[Math.floor(lon / 30)],
      degree: lon % 30,
      house: houseOf(lon, houses.cusps),
      retrograde: p.longitudeSpeed < 0,
    };
  });
  const aspects: Aspect[] = [];
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++) {
      const raw = Math.abs(points[i].longitude - points[j].longitude);
      const angle = Math.min(raw, 360 - raw);
      for (const [target, type, maxOrb] of aspectDefs) {
        const orb = Math.abs(angle - target);
        if (orb <= maxOrb) {
          aspects.push({
            a: points[i].key,
            b: points[j].key,
            type,
            angle: target,
            orb,
          });
          break;
        }
      }
    }
  swe.close();
  return {
    utc: utc.toISOString(),
    timezone,
    latitude,
    longitude,
    ascendant: houses.ascendant,
    mc: houses.mc,
    cusps: houses.cusps,
    points,
    aspects: aspects.sort((a, b) => a.orb - b.orb),
  };
}
export function zodiacAt(longitude: number) {
  const l = norm(longitude);
  return `${signs[Math.floor(l / 30)]} ${Math.floor(l % 30)}°${String(Math.round((l % 1) * 60)).padStart(2, "0")}′`;
}
export function localToUtc(date: string, time: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number),
    [hh, mm] = time.split(":").map(Number);
  let guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = (ms: number) =>
    Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(ms)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, Number(p.value)]),
    );
  for (let i = 0; i < 3; i++) {
    const p = parts(guess);
    guess +=
      Date.UTC(y, m - 1, d, hh, mm) -
      Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  }
  return new Date(guess);
}
