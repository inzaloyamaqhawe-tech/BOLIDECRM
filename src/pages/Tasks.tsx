import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { useCrm, useDeals } from "../lib/use-store";
import { createTask, deleteTask, getTasks, setTaskDone } from "../lib/store";
import { formatDate } from "../lib/format";
import type { Task } from "../types";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function TasksPage() {
  const tasks = useCrm(getTasks);
  const deals = useDeals();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dealId, setDealId] = useState("");

  function addTask() {
    if (!title.trim()) return;
    createTask({ title: title.trim(), dueDate: dueDate || undefined, dealId: dealId || undefined });
    setTitle("");
    setDueDate("");
    setDealId("");
  }

  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.dueDate && t.dueDate < todayIso()).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
  const upcoming = open.filter((t) => !t.dueDate || t.dueDate >= todayIso()).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const done = tasks.filter((t) => t.done).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function dealTitle(id?: string) {
    if (!id) return null;
    return deals.find((d) => d.id === id)?.title;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Tasks &amp; follow-ups</h1>
        <p className="text-sm text-neutral-500">Reminders to chase, optionally tied to a deal</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Follow up with BP Kew about pricing…"
            className="input flex-1 min-w-[220px]"
          />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input w-auto" />
          <select value={dealId} onChange={(e) => setDealId(e.target.value)} className="input w-auto">
            <option value="">No linked deal</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <button onClick={addTask} className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-brand">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {overdue.length > 0 && (
        <TaskGroup title="Overdue" tone="text-red-600" tasks={overdue} dealTitle={dealTitle} />
      )}
      <TaskGroup title="Upcoming" tone="text-neutral-900" tasks={upcoming} dealTitle={dealTitle} />
      {done.length > 0 && <TaskGroup title="Done" tone="text-neutral-400" tasks={done} dealTitle={dealTitle} muted />}
    </div>
  );
}

function TaskGroup({
  title,
  tone,
  tasks,
  dealTitle,
  muted,
}: {
  title: string;
  tone: string;
  tasks: Task[];
  dealTitle: (id?: string) => string | null | undefined;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className={`mb-2 text-sm font-bold uppercase tracking-widest ${tone}`}>{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className={`flex items-center gap-3 rounded-xl border border-neutral-100 bg-white px-4 py-3 ${muted ? "opacity-60" : ""}`}>
              <button onClick={() => setTaskDone(t.id, !t.done)} className="shrink-0 text-neutral-400 hover:text-emerald-600">
                {t.done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold ${t.done ? "text-neutral-400 line-through" : "text-neutral-900"}`}>{t.title}</div>
                <div className="text-xs text-neutral-400">
                  {t.dueDate ? formatDate(t.dueDate) : "No due date"}
                  {dealTitle(t.dealId) ? ` · ${dealTitle(t.dealId)}` : ""}
                </div>
              </div>
              <button onClick={() => deleteTask(t.id)} className="shrink-0 text-neutral-300 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
