import {
  getLeadAnalytics,
  bestSellers,
  leadsDaily,
  salesByCategory,
  listProducts,
  getPublicSettings,
} from "@/lib/models";

export const dynamic = "force-dynamic";

const INK = "#0a0a0a";
const LINE = "#e4e4e7";
const TRACK = "#f4f4f5";
const ASH = "#a1a1aa";

function money(n, cur) {
  return `${cur} ${Math.round(Number(n) || 0).toLocaleString()}`;
}

export default function AnalyticsPage() {
  const cur = getPublicSettings().currency || "Rs.";
  const a = getLeadAnalytics();
  const daily = leadsDaily(14);
  const top = bestSellers({ limit: 6 });
  const cats = salesByCategory();
  const products = listProducts();
  const inStock = products.filter((p) => p.inStock).length;
  const outStock = products.length - inStock;

  const kpis = [
    { label: "Total leads", value: a.totalLeads, sub: `${a.leadsToday} today` },
    { label: "Intended revenue", value: money(a.intendedRevenue, cur), sub: `${a.unitsSold} units sold` },
    { label: "Leads · 7 days", value: a.leads7d, sub: money(a.revenue7d, cur) },
    { label: "Avg. order value", value: money(a.avgOrderValue, cur), sub: "per lead" },
  ];

  const noData = a.totalLeads === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-ash">WhatsApp leads, revenue intent and product performance.</p>
      </div>

      {/* KPI tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ash">{k.label}</p>
            <p className="mt-1 text-2xl font-bold">{k.value}</p>
            <p className="mt-0.5 text-[11px] text-ash">{k.sub}</p>
          </div>
        ))}
      </div>

      {noData && (
        <div className="mb-6 rounded-2xl border border-line bg-smoke px-4 py-3 text-sm text-ash">
          No leads yet — charts populate automatically once customers check out to WhatsApp.
        </div>
      )}

      {/* Time series */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Leads — last 14 days" note="Completed checkouts per day">
          <BarChart data={daily} valueKey="leads" />
        </Card>
        <Card title="Revenue intent — last 14 days" note={`Order value per day (${cur})`}>
          <AreaChart data={daily} valueKey="revenue" cur={cur} />
        </Card>
      </div>

      {/* Rankings + donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Best sellers" note="By units ordered" className="lg:col-span-1">
          <HBars rows={top.map((t) => ({ label: t.name, value: t.units, meta: money(t.revenue, cur) }))} unit="units" />
        </Card>
        <Card title="Sales by category" note="Units per category" className="lg:col-span-1">
          <HBars rows={cats.map((c) => ({ label: c.category, value: c.units, meta: money(c.revenue, cur) }))} unit="units" />
        </Card>
        <Card title="Stock status" note="Live inventory" className="lg:col-span-1">
          <Donut inStock={inStock} outStock={outStock} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, note, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-[11px] text-ash">{note}</span>
      </div>
      {children}
    </div>
  );
}

/* ── Vertical bar chart (time series) ── */
function BarChart({ data, valueKey }) {
  const W = 700, H = 220, pad = { l: 34, r: 10, t: 18, b: 26 };
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const slot = cw / n;
  const barW = Math.max(4, slot - 6);
  const yOf = (v) => pad.t + ch * (1 - v / max);
  const ticks = niceTicks(max, 3);
  const peak = data.reduce((m, d, i) => (d[valueKey] > data[m][valueKey] ? i : m), 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Leads per day for the last 14 days" className="overflow-visible">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={yOf(t)} y2={yOf(t)} stroke={LINE} strokeWidth="1" />
          <text x={pad.l - 6} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill={ASH} fontFamily="var(--font-mono)">{t}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const v = d[valueKey];
        const bh = ch * (v / max);
        const x = pad.l + i * slot + (slot - barW) / 2;
        const y = pad.t + ch - bh;
        return (
          <g key={i}>
            {v > 0 && (
              <rect
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx="3"
                fill={INK}
                aria-label={`${d.label}: ${v} lead${v !== 1 ? "s" : ""}`}
              />
            )}
            {i === peak && v > 0 && <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill={INK}>{v}</text>}
            {i % 3 === 0 && <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill={ASH} fontFamily="var(--font-mono)">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Area + line chart (revenue) ── */
function AreaChart({ data, valueKey, cur }) {
  const W = 700, H = 220, pad = { l: 46, r: 10, t: 18, b: 26 };
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const xOf = (i) => pad.l + (n === 1 ? cw / 2 : (cw * i) / (n - 1));
  const yOf = (v) => pad.t + ch * (1 - v / max);
  const pts = data.map((d, i) => [xOf(i), yOf(d[valueKey])]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pad.l + cw} ${pad.t + ch} L${pad.l} ${pad.t + ch} Z`;
  const ticks = niceTicks(max, 3);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Revenue intent per day for the last 14 days" className="overflow-visible">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={yOf(t)} y2={yOf(t)} stroke={LINE} strokeWidth="1" />
          <text x={pad.l - 6} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill={ASH} fontFamily="var(--font-mono)">{shortNum(t)}</text>
        </g>
      ))}
      <path d={area} fill={INK} fillOpacity="0.07" />
      <path d={line} fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={pts[i][0]} cy={pts[i][1]} r="2.5" fill={INK} />
          <rect
            x={xOf(i) - (cw / n) / 2}
            y={pad.t}
            width={cw / n}
            height={ch}
            fill="transparent"
            aria-label={`${d.label}: ${money(d[valueKey], cur)}`}
          />
          {i % 3 === 0 && <text x={pts[i][0]} y={H - 8} textAnchor="middle" fontSize="9" fill={ASH} fontFamily="var(--font-mono)">{d.label}</text>}
        </g>
      ))}
    </svg>
  );
}

/* ── Horizontal bars (rankings) ── */
function HBars({ rows, unit }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-ash">No data yet.</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label + i}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{r.label}</span>
            <span className="whitespace-nowrap text-sm font-semibold">{r.value} <span className="text-xs font-normal text-ash">{unit}</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: TRACK }} title={`${r.label}: ${r.value} ${unit}`}>
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: INK }} />
          </div>
          {r.meta && <p className="mt-1 text-[11px] text-ash">{r.meta}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ── Donut (stock status, 2 states) ── */
function Donut({ inStock, outStock }) {
  const total = inStock + outStock;
  const r = 52, sw = 20, C = 2 * Math.PI * r;
  const frac = total ? inStock / total : 0;
  const items = [
    { label: "In stock", value: inStock, color: INK },
    { label: "Sold out", value: outStock, color: "#d4d4d8" },
  ];
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" width="128" height="128" role="img" aria-label={`In stock ${inStock}, sold out ${outStock}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#d4d4d8" strokeWidth={sw} />
        {total > 0 && (
          <circle
            cx="70" cy="70" r={r} fill="none" stroke={INK} strokeWidth={sw}
            strokeDasharray={`${(C * frac).toFixed(2)} ${C.toFixed(2)}`}
            strokeDashoffset={C / 4} transform="rotate(-90 70 70)" strokeLinecap="butt"
            aria-label={`In stock: ${inStock} of ${total}`}
          />
        )}
        <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="700" fill={INK}>{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fill={ASH} fontFamily="var(--font-mono)" letterSpacing="1">PRODUCTS</text>
      </svg>
      <ul className="space-y-2 text-sm">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: it.color, outline: `1px solid ${LINE}` }} />
            <span className="text-ash">{it.label}</span>
            <span className="font-semibold">{it.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── helpers ── */
function niceTicks(max, count) {
  const step = Math.max(1, Math.ceil(max / count));
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

function shortNum(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
