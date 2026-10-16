import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getTasks } from "../lib/store";
import { useCrm, useDeals } from "../lib/use-store";
import { effectiveProposalDue, localDay, proposalOutstanding } from "../lib/proposal";

export function ReminderCenter(){
 const {user}=useAuth(),tasks=useCrm(getTasks),deals=useDeals();
 const [tick,setTick]=useState(Date.now()),[dismissed,setDismissed]=useState<string[]>([]),[permission,setPermission]=useState(typeof Notification==="undefined"?"unsupported":Notification.permission),[error,setError]=useState("");
 useEffect(()=>{const timer=setInterval(()=>setTick(Date.now()),15000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const owner=user?.id;
  return()=>{if(owner&&"serviceWorker" in navigator)void navigator.serviceWorker.getRegistration?.(import.meta.env.BASE_URL).then(async registration=>{for(const notification of await registration?.getNotifications()??[])if(notification.tag.startsWith(owner+":"))notification.close();}).catch(()=>{});};
 },[user?.id]);
 const today=localDay(new Date(tick).toISOString());
 const reminders=user?[
  ...tasks.filter(t=>!t.done&&t.assigneeId===user.id&&t.reminderAt&&new Date(t.reminderAt).getTime()<=tick).map(t=>({id:"task:"+t.id+":"+t.reminderAt,title:t.title,body:"Your "+(t.priority??"normal")+" priority task"+(t.dueDate?" · due "+t.dueDate:""),url:"tasks"})),
  ...deals.filter(d=>proposalOutstanding(d)&&(d.ownerId===user.id||d.workflow?.escalationUserId===user.id)&&!!effectiveProposalDue(d)&&effectiveProposalDue(d)!<today).map(d=>({id:"proposal:"+d.id+":"+effectiveProposalDue(d)+":"+today,title:"Overdue proposal: "+d.title,body:(d.ownerId===user.id?"Your proposal is overdue":"Proposal escalated to you")+" · due "+effectiveProposalDue(d),url:"deals?open="+encodeURIComponent(d.id)})),
 ]:[];
 useEffect(()=>{
  if(!user||permission!=="granted")return;
  let cancelled=false;
  async function deliver(){
   for(const reminder of reminders){
    const key="crm:delivered:"+user!.id+":"+reminder.id;
    if(localStorage.getItem(key)||cancelled)continue;
    // A lock prevents two open CRM tabs from notifying the same Windows user twice.
    const send=async()=>{if(localStorage.getItem(key)||cancelled)return;try{
     const title="Bolide CRM · "+reminder.title,options={body:reminder.body,tag:user!.id+":"+reminder.id,icon:import.meta.env.BASE_URL+"faviconbolide.png",data:{url:import.meta.env.BASE_URL+reminder.url}};
     if("serviceWorker" in navigator){const registration=await navigator.serviceWorker.register(import.meta.env.BASE_URL+"reminders-sw.js",{scope:import.meta.env.BASE_URL});await navigator.serviceWorker.ready;if(cancelled)return;await registration.showNotification(title,options);}
     else {const notification=new Notification(title,options);notification.onclick=()=>{window.focus();window.location.assign(import.meta.env.BASE_URL+reminder.url);};}
     localStorage.setItem(key,new Date().toISOString());
    }catch(e){setError("Desktop notification could not be shown. Your reminders are listed here.");}};
    if(navigator.locks)await navigator.locks.request(key,send);else await send();
   }
  }
  void deliver();return()=>{cancelled=true;};
 },[user?.id,permission,JSON.stringify(reminders)]);
 async function enable(){if(!window.isSecureContext){setError("Desktop notifications require valid HTTPS.");return;}try{setPermission(await Notification.requestPermission());}catch{setError("Allow notifications in your browser's site settings.");}}
 if(!user)return null;
 const visible=reminders.filter(r=>!dismissed.includes(r.id));
 return <div className="no-print border-b bg-white px-4 py-2 text-xs">
  <div className="flex flex-wrap items-center gap-3"><Link to="/tasks" className="font-bold">My reminders ({visible.length})</Link>{permission!=="granted"&&permission!=="unsupported"&&<button onClick={enable} className="font-bold text-pink-600">{permission==="denied"?"Notifications blocked — check browser settings":"Enable Windows notifications"}</button>}<span className="text-neutral-500">Reminders are personal. Keep the CRM open or minimised for alerts.</span>{error&&<span className="text-amber-700">{error}</span>}</div>
  {!!visible.length&&<div role="status" className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{visible.map(r=><div key={r.id} className="rounded-lg bg-amber-50 p-2"><Link className="font-semibold" to={"/"+r.url}>{r.title}</Link><span className="ml-2">{r.body}</span><button aria-label="Dismiss reminder" className="ml-3 font-bold" onClick={()=>setDismissed([...dismissed,r.id])}>×</button></div>)}</div>}
 </div>;
}
