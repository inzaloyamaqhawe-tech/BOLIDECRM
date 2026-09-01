import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, Target, Repeat, TrendingUp, Trophy, Percent } from "lucide-react";
import { useDeals, useActivities, useCompanies } from "../lib/use-store";
import { DIVISIONS, STAGES } from "../lib/seed-data";
import { formatCompact, formatZAR } from "../lib/format";
import { DivisionBadge } from "../components/DivisionBadge";

const DIVISION_HEX: Record<string, string> = {
  energy: "#F7941E",
  secure: "#EC1C8C",
  connect: "#4CA6E0",
  water: "#7DD3FC",
  saas: "#9B7CE8",
};

export function DashboardPage() {
  const deals = useDeals();
  const activities = useActivities();
  const companies = useCompanies();

  const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const totalPipeline = openDeals.reduce((s, d) => s + d.onceOff, 0);
  const weightedPipeline = openDeals.reduce((s, d) => {
    const stage = STAGES.find((st) => st.key === d.stage);
    return s + d.onceOff * ((stage?.probability ?? 0) / 100);
  }, 0);
  const mrrPipeline = openDeals.reduce((s, d) => s + d.mrr, 0);
  const arrPipeline = mrrPipeline * 12;

  const now = new Date();
  const wonThisMonth = deals.filter((d) => d.stage === "won" && new Date(d.updatedAt).getMonth() === now.getMonth() && new Date(d.updatedAt).getFullYear() === now.getFullYear());
  const wonThisMonthValue = wonThisMonth.reduce((s, d) => s + d.onceOff, 0);

  const wonCount = deals.filter((d) => d.stage === "won").length;
  const lostCount = deals.filter((d) => d.stage === "lost").length;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount === 0 ? 0 : Math.round((wonCount / closedCount) * 100);

  const byDivision = DIVISIONS.map((d) => ({
    name: d.name.replace("Bolide ", ""),
    value: deals.filter((deal) => deal.division === d.key).reduce((s, deal) => s + deal.onceOff, 0),
    key: d.key,
  }));

  const byStage = STAGES.filter((s) => s.key !== "won" && s.key !== "lost").map((s) => ({
    name: s.label,
    value: deals.filter((d) => d.stage === s.key).reduce((sum, d) => sum + d.onceOff, 0),
  }));

  const closingSoon = openDeals
    .filter((d) => d.closeDate)
    .sort((a, b) => (a.closeDate! < b.closeDate! ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Group performance across all Bolide divisions · ZAR, excl. VAT</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          className="bg-brand-gradient text-white"
          icon={<Wallet className="h-5 w-5" />}
          label="Total pipeline (excl. VAT)"
          value={formatZAR(totalPipeline)}
          sub={`${openDeals.length} open deals · once-off + first 12 months`}
          inverse
        />
        <KpiCard icon={<Target className="h-5 w-5" />} label="Weighted pipeline" value={formatZAR(weightedPipeline)} sub="Stage-probability adjusted" />
        <KpiCard icon={<Repeat className="h-5 w-5" />} label="ARR (pipeline)" value={formatZAR(arrPipeline)} sub={`MRR × 12 · ${formatZAR(0)} won`} />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="MRR (pipeline)" value={formatZAR(mrrPipeline)} sub={`Recurring, excl. VAT`} />
        <KpiCard icon={<Trophy className="h-5 w-5" />} label="Deals won this month" value={String(wonThisMonth.length)} sub={`${formatZAR(wonThisMonthValue)} total contract value`} />
        <KpiCard icon={<Percent className="h-5 w-5" />} label="Win rate" value={`${winRate}%`} sub={`${wonCount} won / ${closedCount} closed`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pipeline value by division" sub="Total contract value, excl. VAT">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byDivision}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 12 }} width={60} />
              <Tooltip formatter={(v: number) => formatZAR(v)} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {byDivision.map((entry) => (
                  <Cell key={entry.key} fill={DIVISION_HEX[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline value by stage" sub="Total contract value, excl. VAT">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byStage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 12 }} width={60} />
              <Tooltip formatter={(v: number) => formatZAR(v)} />
              <Bar dataKey="value" fill="#EC1C8C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-neutral-900">Recent activity</h2>
          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
              No activity logged yet. Notes, calls and tasks will appear here.
            </div>
          ) : (
            <ul className="space-y-2">
              {activities.slice(0, 8).map((a) => (
                <li key={a.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                  <span className="font-semibold text-neutral-700">{a.type}</span>{" "}
                  <span className="text-neutral-500">— {a.body}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-neutral-900">Closing soon</h2>
          <ul className="divide-y divide-neutral-100">
            {closingSoon.map((d) => {
              const company = companies.find((c) => c.id === d.companyId);
              return (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-neutral-900">{d.title}</div>
                    <div className="truncate text-xs text-neutral-500">
                      {company?.name} · {STAGES.find((s) => s.key === d.stage)?.label} · {formatZAR(d.onceOff)} once-off · {formatZAR(d.mrr)}/m
                    </div>
                  </div>
                  <DivisionBadge division={d.division} />
                </li>
              );
            })}
            {closingSoon.length === 0 && <li className="py-6 text-center text-sm text-neutral-400">Nothing with a close date yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  className = "",
  inverse = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  className?: string;
  inverse?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-neutral-200 p-5 ${className || "bg-white"}`}>
      <div className={`mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest ${inverse ? "text-white/80" : "text-neutral-400"}`}>
        {label}
        {icon}
      </div>
      <div className="text-3xl font-black">{value}</div>
      <div className={`mt-1 text-xs ${inverse ? "text-white/80" : "text-neutral-500"}`}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="font-bold text-neutral-900">{title}</h2>
      <p className="mb-3 text-xs text-neutral-500">{sub}</p>
      {children}
    </div>
  );
}
