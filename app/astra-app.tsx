"use client";
import { useEffect, useMemo, useState } from "react";
import * as OpenCC from "opencc-js";
import tzlookup from "tz-lookup";
const Icon = ({ children, className = "" }: { children: string; className?: string }) => <span className={`text-icon ${className}`} aria-hidden="true">{children}</span>;
const CalendarDays = () => <Icon>□</Icon>;
const Clock3 = () => <Icon>◷</Icon>;
const MapPin = () => <Icon>⌖</Icon>;
const ShieldCheck = () => <Icon>✓</Icon>;
const Sparkles = () => <Icon>✦</Icon>;
const ChevronDown = () => <Icon>⌄</Icon>;
const LoaderCircle = ({className=""}:{className?:string}) => <Icon className={className}>◌</Icon>;
import {
  calculateChart,
  localToUtc,
  zodiacAt,
  type ChartData,
} from "../lib/astrology";
type Place = { id: number; label: string; latitude: number; longitude: number };
const houseThemes = [
  "自我與外在形象",
  "金錢與價值觀",
  "溝通與學習",
  "家庭與內在根基",
  "創造力與戀愛",
  "日常工作與健康習慣",
  "伴侶與一對一關係",
  "共享資源與心理轉化",
  "遠行、進修與世界觀",
  "事業與社會角色",
  "朋友、社群與願景",
  "潛意識、休養與療癒",
];
const focusOptions = ["整體", "副業方向", "財運", "工作", "事業", "感情與姻緣"],
  glyphs = [
    "♈",
    "♉",
    "♊",
    "♋",
    "♌",
    "♍",
    "♎",
    "♏",
    "♐",
    "♑",
    "♒",
    "♓",
  ];
function Wheel({ chart }: { chart: ChartData }) {
  const c = 260,
    r = 205,
    xy = (deg: number, rad: number) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return [c + Math.cos(a) * rad, c + Math.sin(a) * rad];
    };
  return (
    <svg
      className="wheel"
      viewBox="0 0 520 520"
      role="img"
      aria-label="本命星盤，詳細位置列於下方表格"
    >
      <circle cx={c} cy={c} r="230" className="ring outer" />
      <circle cx={c} cy={c} r={r} className="ring" />
      <circle cx={c} cy={c} r="124" className="ring inner" />
      {glyphs.map((g, i) => {
        const [x, y] = xy(i * 30 + 15, 220);
        return (
          <text key={g} x={x} y={y} className="zodiac">
            {g}
          </text>
        );
      })}
      {chart.cusps.slice(1, 13).map((d, i) => {
        const [x, y] = xy(d, r),
          [tx, ty] = xy(d + 4, 142);
        return (
          <g key={i}>
            <line x1={c} y1={c} x2={x} y2={y} className="house" />
            <text x={tx} y={ty} className="house-num">
              {i + 1}
            </text>
          </g>
        );
      })}
      {chart.aspects.slice(0, 24).map((a, i) => {
        const p1 = chart.points.find((p) => p.key === a.a)!,
          p2 = chart.points.find((p) => p.key === a.b)!,
          q1 = xy(p1.longitude, 118),
          q2 = xy(p2.longitude, 118);
        return (
          <line
            key={i}
            x1={q1[0]}
            y1={q1[1]}
            x2={q2[0]}
            y2={q2[1]}
            className={
              a.angle === 90 || a.angle === 180 ? "aspect hard" : "aspect"
            }
          />
        );
      })}
      {chart.points.map((p) => {
        const [x, y] = xy(p.longitude, 175);
        return (
          <g key={p.key}>
            <circle
              cx={x}
              cy={y}
              r="16"
              className={p.key === "sun" ? "planet sun" : "planet"}
            />
            <text x={x} y={y + 1} className="planet-glyph">
              {p.glyph}
            </text>
          </g>
        );
      })}
      <circle cx={c} cy={c} r="4" className="center" />
    </svg>
  );
}
export default function AstraApp() {
  const [language, setLanguage] = useState<"zh-Hant" | "zh-Hans">("zh-Hant");
  const [date, setDate] = useState("1993-07-21"),
    [time, setTime] = useState("14:35"),
    [gender, setGender] = useState("不透露"),
    [apiKey, setApiKey] = useState(""),
    [query, setQuery] = useState("台北市, 台灣"),
    [places, setPlaces] = useState<Place[]>([]),
    [place, setPlace] = useState<Place | null>(null),
    [chart, setChart] = useState<ChartData | null>(null),
    [question, setQuestion] = useState("找副業應該往哪個方向？"),
    [focus, setFocus] = useState("副業方向"),
    [loading, setLoading] = useState(false),
    [answer, setAnswer] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem("astra-language") === "zh-Hans" ? "zh-Hans" : "zh-Hant";
    setLanguage(saved);
    if (saved !== "zh-Hans") return;
    const convert = OpenCC.Converter({ from: "tw", to: "cn" });
    const translate = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE && root.textContent) {
        root.textContent = convert(root.textContent);
        return;
      }
      if (!(root instanceof HTMLElement) || ["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(root.tagName)) return;
      root.childNodes.forEach(translate);
      if (root.hasAttribute("placeholder")) root.setAttribute("placeholder", convert(root.getAttribute("placeholder") || ""));
      if (root.hasAttribute("aria-label")) root.setAttribute("aria-label", convert(root.getAttribute("aria-label") || ""));
    };
    translate(document.body);
    const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(translate)));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  function switchLanguage(next: "zh-Hant" | "zh-Hans") {
    localStorage.setItem("astra-language", next);
    location.reload();
  }
  useEffect(() => {
    if (query.length < 2 || place?.label === query) {
      setPlaces([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`),
          d = await r.json();
        setPlaces(d.results || []);
      } catch {}
    }, 450);
    return () => clearTimeout(t);
  }, [query, place]);
  async function generate() {
    if (!place) {
      setError("請先從搜尋結果中選擇出生地，以確認經緯度與歷史時區。");
      return;
    }
    if (!apiKey.trim()) {
      setError(
        "請先輸入自己的 DeepSeek API Key。金鑰只會用於本次解讀，不會儲存。",
      );
      return;
    }
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const timezone = tzlookup(place.latitude, place.longitude),
        utc = localToUtc(date, time, timezone),
        next = await calculateChart(
          utc,
          place.latitude,
          place.longitude,
          timezone,
        );
      setChart(next);
      const r = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chart: next,
            question,
            gender,
            focus,
            apiKey,
            language,
          }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setAnswer(d.interpretation);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "排盤時發生錯誤，請檢查資料後再試。",
      );
    } finally {
      setLoading(false);
    }
  }
  const big = useMemo(
    () =>
      chart
        ? {
            sun: chart.points[0],
            moon: chart.points[1],
            asc: zodiacAt(chart.ascendant),
          }
        : null,
    [chart],
  );
  return (
    <main>
      <header>
        <div className="brand">ASTRA</div>
        <p>專業計算在背後，白話答案在眼前。</p>
        <span className="engine">
          <ShieldCheck />
          Swiss Ephemeris · Placidus
        </span>
        <div className="language-switch" role="group" aria-label="語言選擇">
          <button type="button" className={language === "zh-Hant" ? "active" : ""} onClick={() => switchLanguage("zh-Hant")}>繁體</button>
          <button type="button" className={language === "zh-Hans" ? "active" : ""} onClick={() => switchLanguage("zh-Hans")}>简体</button>
        </div>
      </header>
      <div className="workspace">
        <section className="input-panel" aria-labelledby="birth-title">
          <h1 id="birth-title">你的出生資料</h1>
          <label>
            <span>
              <CalendarDays />
              出生日期
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            <span>
              <Clock3 />
              出生時間（精確到分鐘）
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label className="place-field">
            <span>
              <MapPin />
              出生地
            </span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPlace(null);
              }}
              autoComplete="off"
              aria-describedby="place-help"
            />
            {places.length > 0 && (
              <ul className="places">
                {places.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        setPlace(p);
                        setQuery(p.label);
                        setPlaces([]);
                      }}
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <small id="place-help">
              請從搜尋結果選擇，以套用當時的時區與夏令時間。
            </small>
            {place && (
              <div className="verified">
                <ShieldCheck />
                已確認座標：{place.latitude.toFixed(4)},{" "}
                {place.longitude.toFixed(4)}
              </div>
            )}
          </label>
          <label>
            <span>性別／稱謂（選填）</span>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option>不透露</option>
              <option>女性</option>
              <option>男性</option>
              <option>非二元／其他</option>
            </select>
          </label>
          <label>
            <span>解讀主題</span>
            <select value={focus} onChange={(e) => setFocus(e.target.value)}>
              {focusOptions.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            <span>你想問什麼？</span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
            />
            <small>{question.length} / 300</small>
          </label>
          <label className="api-key">
            <span>DeepSeek API Key（必填）</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-…"
              autoComplete="off"
            />
            <small>
              只在本次解讀時傳送給 DeepSeek；不會儲存於本站或瀏覽器。
            </small>
            <small className="ai-notice">
              解讀內容由 AI 根據星盤資料統整生成，可能有疏漏，請勿作為醫療、法律、投資或重大人生決策的唯一依據。
            </small>
          </label>
          <button className="primary" onClick={generate} disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="spin" />
                正在校準星盤…
              </>
            ) : (
              <>
                <Sparkles />
                生成星盤並解讀
              </>
            )}
          </button>
          <p className="privacy">出生資料只用於本次排盤，不會儲存。</p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="chart-panel" aria-labelledby="chart-title">
          <div className="section-head">
            <div>
              <p>熱帶黃道 · Placidus 宮位制</p>
              <h2 id="chart-title">
                {chart ? "你的本命星盤" : "等待你的出生座標"}
              </h2>
            </div>
          </div>
          {chart ? (
            <>
              <Wheel chart={chart} />
              <div className="big-three">
                <div>
                  <span>太陽</span>
                  <strong>{zodiacAt(big!.sun.longitude)}</strong>
                </div>
                <div>
                  <span>月亮</span>
                  <strong>{zodiacAt(big!.moon.longitude)}</strong>
                </div>
                <div>
                  <span>上升</span>
                  <strong>{big!.asc}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-wheel">
              <div className="orbit">
                <span>✦</span>
              </div>
              <p>選擇出生地後，ASTRA 會依歷史時區生成你的星盤。</p>
            </div>
          )}
        </section>
        <aside className="reading" aria-labelledby="reading-title">
          <p>針對問題的解讀</p>
          <h2 id="reading-title">
            {answer ? "你的星盤提示（AI 統整生成）" : "答案將從這裡展開"}
          </h2>
          {loading ? (
            <div className="reading-loading">
              <span />
              <span />
              <span />
              <p>正在比對行星、宮位與主要相位…</p>
            </div>
          ) : answer ? (
            <div className="markdown">
              {answer
                .split("\n")
                .map((line, i) =>
                  line.startsWith("#") ? (
                    <h3 key={i}>{line.replace(/^#+\s*/, "")}</h3>
                  ) : line.startsWith("-") ? (
                    <p key={i}>• {line.slice(1).trim()}</p>
                  ) : (
                    <p key={i}>{line}</p>
                  ),
                )}
            </div>
          ) : (
            <>
              <blockquote>
                先給白話結論，再讓你查看背後的星盤依據與下一步行動。
              </blockquote>
              <ul className="promises">
                <li>不以性別角色判定吉凶</li>
                <li>不使用宿命式保證</li>
                <li>清楚標示資料與解讀限制</li>
              </ul>
            </>
          )}
        </aside>
      </div>
      {chart && (
        <section className="details">
          <details open>
            <summary>
              行星位置 <ChevronDown />
            </summary>
            <div className="data-table">
              {chart.points.map((p) => (
                <div key={p.key}>
                  <b>
                    {p.glyph} {p.name}
                  </b>
                  <span>{zodiacAt(p.longitude)}</span>
                  <span>
                    第 {p.house} 宮 {p.retrograde ? "· 逆行" : ""}
                  </span>
                </div>
              ))}
            </div>
          </details>
          <details>
            <summary>
              主要相位 <ChevronDown />
            </summary>
            <div className="data-table">
              {chart.aspects.slice(0, 18).map((a, i) => (
                <div key={i}>
                  <b>
                    {chart.points.find((p) => p.key === a.a)?.name} ×{" "}
                    {chart.points.find((p) => p.key === a.b)?.name}
                  </b>
                  <span>{a.type}</span>
                  <span>容許度 {a.orb.toFixed(1)}°</span>
                </div>
              ))}
            </div>
          </details>
          <details className="empty-houses" open>
            <summary>
              空宮與人生節奏 <ChevronDown />
            </summary>
            <p className="empty-houses-intro">
              空宮不是缺少，也不代表這個領域不會發生事情。它只是顯示：你通常不必長期在這裡承載同等密度的內在拉扯，較可能在需要時自然回應，不必預先反覆內耗。
            </p>
            <div className="empty-house-list">
              {houseThemes.map((theme, index) => {
                const house = index + 1;
                if (chart.points.some((point) => point.house === house)) return null;
                return (
                  <div key={house}>
                    <b>第 {house} 宮</b>
                    <span>{theme}</span>
                  </div>
                );
              })}
            </div>
            <p className="empty-houses-note">
              更完整的判讀仍會參考宮頭星座、宮主星、相位與行運；因此空宮不是保證順利，而是一種能量分配的提示。
            </p>
          </details>
        </section>
      )}
      <footer>
        占星解讀用於自我探索，不構成醫療、法律、投資或人生決策保證。地點資料由
        OpenStreetMap Nominatim 提供。
      </footer>
    </main>
  );
}
