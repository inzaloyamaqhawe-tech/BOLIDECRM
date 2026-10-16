import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useCrm, useDeals, useUsers } from "../lib/use-store";
import { deleteTask,getTasks,setTaskDone } from "../lib/store";
import { localDay } from "../lib/proposal";
import { TaskEditor } from "../components/TaskEditor";
export function TasksPage(){
 const tasks=useCrm(getTasks),deals=useDeals(),users=useUsers(),{user}=useAuth();
 const [mine,setMine]=useState(true),[editing,setEditing]=useState<string>();
 const today=localDay(new Date().toISOString());
 const visible=tasks.filter(t=>!mine||t.assigneeId===user?.id).sort((a,b)=>Number(a.done)-Number(b.done)||(a.dueDate??"9999").localeCompare(b.dueDate??"9999"));
 return <div className="space-y-5"><h1 className="text-3xl font-black">Tasks & follow-ups</h1><p className="text-sm text-neutral-500">View team tasks here. Only the assignee receives reminders.</p><TaskEditor/>
 <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" checked={mine} onChange={e=>setMine(e.target.checked)}/>Show only my tasks</label>
 {visible.map(task=><div key={task.id} className="rounded-xl border bg-white p-4">
 <div className="flex items-start gap-3"><input aria-label={"Complete "+task.title} type="checkbox" checked={task.done} onChange={e=>setTaskDone(task.id,e.target.checked)}/><div className="flex-1"><div className={task.done?"line-through text-neutral-400":"font-bold"}>{task.title}</div><div className="text-xs text-neutral-500">{users.find(u=>u.id===task.assigneeId)?.name??"Unassigned — edit to assign"} · {task.priority??"normal"} · {task.dueDate??"No due date"} · {task.recurrence??"none"}{task.dealId?" · "+(deals.find(d=>d.id===task.dealId)?.title??""):""}</div>{!task.done&&task.dueDate&&task.dueDate<today&&<span className="text-xs font-bold text-red-600">Overdue</span>}{task.reminderAt&&<div className="text-xs text-neutral-500">Reminder: {new Date(task.reminderAt).toLocaleString("en-ZA",{timeZone:"Africa/Johannesburg"})} SAST</div>}</div><button className="text-sm font-semibold" onClick={()=>setEditing(editing===task.id?undefined:task.id)}>Edit</button><button className="text-sm text-red-600" onClick={()=>{if(confirm("Delete this task?"))deleteTask(task.id);}}>Delete</button></div>
 {editing===task.id&&<div className="mt-3"><TaskEditor task={task} onSaved={()=>setEditing(undefined)}/></div>}
 </div>)}{!visible.length&&<p className="text-sm text-neutral-500">No tasks in this view.</p>}
 </div>;
}
