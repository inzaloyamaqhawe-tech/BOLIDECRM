import { DealPickerDropdown } from "./DealPickerDropdown";
import { useState } from "react";
import { createTask, updateTask } from "../lib/store";
import { useDeals, useUsers } from "../lib/use-store";
import type { Task } from "../types";

export function TaskEditor({ task, dealId, onSaved }: {task?: Task;dealId?: string;onSaved?:()=>void}) {
 const users=useUsers(),deals=useDeals();
 const [title,setTitle]=useState(task?.title??""),[assigneeId,setAssignee]=useState(task?.assigneeId??""),[dueDate,setDue]=useState(task?.dueDate??""),[linked,setLinked]=useState(task?.dealId??dealId??"");
 const [priority,setPriority]=useState<NonNullable<Task["priority"]>>(task?.priority??"normal"),[recurrence,setRecurrence]=useState<NonNullable<Task["recurrence"]>>(task?.recurrence??"none");
 const [reminder,setReminder]=useState(task?.reminderAt?new Date(new Date(task.reminderAt).getTime()+2*3600000).toISOString().slice(0,16):""),[error,setError]=useState("");
 function save(){try{if(!title.trim()||!assigneeId)throw new Error("Enter a task title and select an assignee.");const input={title:title.trim(),assigneeId,dueDate:dueDate||undefined,dealId:linked||undefined,priority,recurrence,reminderAt:reminder?new Date(reminder+":00+02:00").toISOString():undefined};if(task)updateTask(task.id,input);else createTask(input);setTitle("");setError("");onSaved?.();}catch(e){setError((e as Error).message);}}
 return <div className="space-y-3 rounded-xl border bg-white p-4">
  <label className="block text-xs font-semibold">Task<input className="input mt-1" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to happen?"/></label>
  <div className="grid gap-3 sm:grid-cols-3">
   <label className="text-xs font-semibold">Assigned to<select className="input mt-1" value={assigneeId} onChange={e=>setAssignee(e.target.value)}><option value="">Choose person</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label className="text-xs font-semibold">Due date<input className="input mt-1" type="date" value={dueDate} onChange={e=>setDue(e.target.value)}/></label>
   <label className="text-xs font-semibold">Priority<select className="input mt-1" value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}>{["low","normal","high"].map(p=><option key={p}>{p}</option>)}</select></label>
   <label className="text-xs font-semibold">Reminder (South Africa time)<input className="input mt-1" type="datetime-local" value={reminder} onChange={e=>setReminder(e.target.value)}/></label>
   <label className="text-xs font-semibold">Repeat after completion<select className="input mt-1" value={recurrence} onChange={e=>setRecurrence(e.target.value as typeof recurrence)}>{["none","daily","weekly","monthly"].map(p=><option key={p}>{p}</option>)}</select></label>
   <div className="text-xs font-semibold"><span className="mb-1 block">Deal</span><DealPickerDropdown deals={deals} value={linked} onChange={setLinked}/></div>
  </div>
  <p className="text-xs text-neutral-500">Only the assigned person receives reminders. Recurring tasks create the next occurrence when completed.</p>
  {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
  <button className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-bold text-white" onClick={save}>{task?"Save task":"Add task"}</button>
 </div>;
}
