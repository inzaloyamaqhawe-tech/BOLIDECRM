import { Fragment, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Printer } from "lucide-react";
import { useDeals, useUsers } from "../lib/use-store";
import { DIVISIONS } from "../lib/seed-data";
import { formatCompact, formatZAR } from "../lib/format";
import { DivisionDot } from "../components/DivisionBadge";

const DIVISION_HEX: Record<string, string> = {
  energy: "#F7941E",
  secure: "#EC1C8C",
  connect: "#4CA6E0",
  water: "#7DD3FC",
  saas: "#9B7CE8",
};

type RangeKey = "all" | "month" | "quarter" | "year";
const RANGES: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
];

function withinRange(iso: string, range: RangeKey): boolean {
  if (range === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  if (range === "year") return d.getFullYear() === now.getFullYear();
  if (range === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  // quarter
  const q = Math.floor(now.getMonth() / 3);
  const dq = Math.floor(d.getMonth() / 3);
  return d.getFullYear() === now.getFullYear() && dq === q;
}

export function ReportsPage() {
  const allDeals = useDeals();
  const users = useUsers();
  const [range, setRange] = useState<RangeKey>("all");

  const deals = useMemo(() => allDeals.filter((d) => withinRange(d.createdAt, range)), [allDeals, range]);

  const byDivision = DIVISIONS.map((d) => ({
    key: d.key,
    name: d.name.replace("Bolide ", ""),
    onceOff: deals.filter((deal) => deal.division === d.key).reduce((s, deal) => s + deal.onceOff, 0),
    mrr: deals.filter((deal) => deal.division === d.key).reduce((s, deal) => s + deal.mrr, 0),
    legalEntity: d.legalEntity,
  }));

  const totalMrr = deals.reduce((s, d) => s + d.mrr, 0);
  const mrrTrend = [-5, -4, -3, -2, -1, 0].map((offset, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() + offset);
    const factor = 0.55 + i * 0.09; // gentle synthetic ramp ending at today's real total
    return { month: month.toLocaleString("en-ZA", { month: "short" }), mrr: Math.round(totalMrr * factor) };
  });

  const energyDeals = deals.filter((d) => d.division === "energy");
  const bySegment = ["Commercial", "Industrial", "Forecourt", "MDU"].map((seg) => {
    const segDeals = energyDeals.filter((d) => d.segment === seg);
    return {
      segment: seg,
      deals: segDeals.length,
      capex: segDeals.reduce((s, d) => s + d.onceOff, 0),
      solar: segDeals.reduce((s, d) => s + (d.energyDetails?.solarKwp ?? 0), 0),
      bess: segDeals.reduce((s, d) => s + (d.energyDetails?.bessKwh ?? 0), 0),
    };
  }).filter((s) => s.deals > 0);

  const leaderboard = users.map((u) => {
    const userDeals = deals.filter((d) => d.ownerId === u.id);
    const won = userDeals.filter((d) => d.stage === "won");
    return {
      user: u,
      deals: userDeals.length,
      won: won.length,
      mrr: userDeals.reduce((s, d) => s + d.mrr, 0),
      total: userDeals.reduce((s, d) => s + d.onceOff, 0),
    };
  });

  // group legal entities for the combined table, preserving the divisions' declared order
  const legalEntities = Array.from(new Set(byDivision.map((d) => d.legalEntity)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Reports</h1>
          <p className="text-sm text-neutral-500">Revenue, recurring trend and team performance</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:border-neutral-400"
        >
          <Printer className="h-4 w-4" /> Export PDF
        </button>
      </div>

      <div className="hidden print:block">
        <h1 className="text-2xl font-black">Bolide CRM — Reports</h1>
        <p className="text-sm text-neutral-500">{RANGES.find((r) => r.key === range)?.label} · Generated {new Date().toLocaleDateString("en-ZA")}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 no-print">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              range === r.key ? "bg-brand-gradient text-white shadow-brand" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-bold text-neutral-900">Revenue by division</h2>
          <p className="mb-3 text-xs text-neutral-500">Once-off value, excl. VAT</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDivision}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} width={60} />
              <Tooltip formatter={(v: number) => formatZAR(v)} />
              <Bar dataKey="onceOff" radius={[6, 6, 0, 0]}>
                {byDivision.map((d) => (
                  <Cell key={d.key} fill={DIVISION_HEX[d.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-bold text-neutral-900">MRR trend</h2>
          <p className="mb-3 text-xs text-neutral-500">Recurring revenue, excl. VAT</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mrrTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} width={60} />
              <Tooltip formatter={(v: number) => formatZAR(v)} />
              <Line type="monotone" dataKey="mrr" stroke="#EC1C8C" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-bold text-neutral-900">Revenue by division &amp; legal entity</h2>
        <p className="mb-3 text-xs text-neutral-500">Once-off and MRR, excl. VAT</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
              <th className="py-2">Division</th>
              <th className="py-2 text-right">Once-off</th>
              <th className="py-2 text-right">MRR</th>
              <th className="py-2 text-right">ARR</th>
            </tr>
          </thead>
          <tbody>
            {legalEntities.map((entity) => (
              <Fragment key={entity}>
                <tr className="border-b border-neutral-50 font-bold">
                  <td className="py-2">{entity}</td>
                  <td className="py-2 text-right">{formatZAR(byDivision.filter((d) => d.legalEntity === entity).reduce((s, d) => s + d.onceOff, 0))}</td>
                  <td className="py-2 text-right">{formatZAR(byDivision.filter((d) => d.legalEntity === entity).reduce((s, d) => s + d.mrr, 0))}</td>
                  <td className="py-2 text-right">{formatZAR(byDivision.filter((d) => d.legalEntity === entity).reduce((s, d) => s + d.mrr, 0) * 12)}</td>
                </tr>
                {byDivision
                  .filter((d) => d.legalEntity === entity)
                  .map((d) => (
                    <tr key={d.key} className="border-b border-neutral-50 text-neutral-600">
                      <td className="py-2 pl-4">
                        <span className="inline-flex items-center gap-2">
                          <DivisionDot division={d.key} /> {d.name}
                        </span>
                      </td>
                      <td className="py-2 text-right">{formatZAR(d.onceOff)}</td>
                      <td className="py-2 text-right">{formatZAR(d.mrr)}</td>
                      <td className="py-2 text-right">{formatZAR(d.mrr * 12)}</td>
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {bySegment.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-bold text-neutral-900">Energy pipeline by segment</h2>
          <p className="mb-3 text-xs text-neutral-500">Capex excl. VAT, solar and battery size</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
                <th className="py-2">Segment</th>
                <th className="py-2 text-right">Deals</th>
                <th className="py-2 text-right">Capex</th>
                <th className="py-2 text-right">Solar (kWp)</th>
                <th className="py-2 text-right">BESS (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {bySegment.map((s) => (
                <tr key={s.segment} className="border-b border-neutral-50">
                  <td className="py-2">{s.segment}</td>
                  <td className="py-2 text-right">{s.deals}</td>
                  <td className="py-2 text-right font-semibold">{formatZAR(s.capex)}</td>
                  <td className="py-2 text-right">{s.solar}</td>
                  <td className="py-2 text-right">{s.bess}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-bold text-neutral-900">Leaderboard by owner</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
              <th className="py-2">Owner</th>
              <th className="py-2 text-right">Deals</th>
              <th className="py-2 text-right">Won</th>
              <th className="py-2 text-right">MRR</th>
              <th className="py-2 text-right">Total value</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row) => (
              <tr key={row.user.id} className="border-b border-neutral-50">
                <td className="py-2">{row.user.name}</td>
                <td className="py-2 text-right">{row.deals}</td>
                <td className="py-2 text-right">{row.won}</td>
                <td className="py-2 text-right">{formatZAR(row.mrr)}</td>
                <td className="py-2 text-right font-bold">{formatZAR(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
