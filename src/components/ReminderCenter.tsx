import { useEffect, useRef, useState } from "react";
import { MessageSquare, CheckCheck, X } from "lucide-react";
import { hosted, api } from "../lib/remote";
import { previewInbox, reminderCandidates, type ReminderMessage } from "../lib/notifications";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getDeals, getTasks } from "../lib/store";
import { useCrm, useDeals } from "../lib/use-store";

export function ReminderCenter(){
 const navigate=useNavigate();
 const {user}=useAuth(),tasks=useCrm(getTasks),deals=useDeals();
 const [tick,setTick]=useState(Date.now()),[messages,setMessages]=useState<ReminderMessage[]>([]),[open,setOpen]=useState(false),[unreadOnly,setUnreadOnly]=useState(false),[limit,setLimit]=useState(50),[busy,setBusy]=useState(false),[permission,setPermission]=useState(typeof Notification==="undefined"?"unsupported":Notification.permission),[error,setError]=useState("");
 useEffect(()=>{const timer=setInterval(()=>setTick(Date.now()),15000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const owner=user?.id;
  return()=>{if(owner&&"serviceWorker" in navigator)void navigator.serviceWorker.getRegistration?.(import.meta.env.BASE_URL).then(async registration=>{for(const notification of await registration?.getNotifications()??[])if(notification.tag.startsWith(owner+":"))notification.close();}).catch(()=>{});};
 },[user?.id]);
 const ref=useRef<HTMLDivElement>(null);
 const candidates=user?reminderCandidates(user.id,tasks,deals,new Date(tick)):[];
 const candidateKey=JSON.stringify(candidates);
 useEffect(()=>{if(!open)return;const close=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);};document.addEventListener("mousedown",close);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",escape);};},[open]);
 const currentUser=useRef(user?.id);currentUser.current=user?.id;
 const requestVersion=useRef(0),busyRef=useRef(false);
 useEffect(()=>{
  const owner=user?.id;if(!owner)return;let cancelled=false;
  const refresh=async()=>{if(busyRef.current)return;const version=++requestVersion.current;try{const rows=hosted?(await api("notifications")).notifications:previewInbox(owner,reminderCandidates(owner,getTasks(),getDeals()));if(!cancelled&&currentUser.current===owner&&version===requestVersion.current){setMessages(rows);setError("");}}catch(e){if(!cancelled)setError((e as Error).message);}};
  void refresh();const timer=setInterval(refresh,15000),wake=()=>void refresh();window.addEventListener("focus",wake);window.addEventListener("storage",wake);
  return()=>{cancelled=true;clearInterval(timer);window.removeEventListener("focus",wake);window.removeEventListener("storage",wake);};
 },[user?.id,candidateKey]);
 async function mark(action:"read"|"unread"|"read-all",id?:string){if(!user||busyRef.current)return;const owner=user.id,version=++requestVersion.current;busyRef.current=true;setBusy(true);try{const rows=hosted?(await api("notifications",{action,id})).notifications:previewInbox(owner,candidates,{action,id});if(currentUser.current===owner&&version===requestVersion.current)setMessages(rows);}catch(e){setError((e as Error).message);}finally{busyRef.current=false;setBusy(false);}}
 const reminders=messages.filter(n=>n.active&&!n.readAt);
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
 const unread=messages.filter(n=>n.active&&!n.readAt).length,visible=messages.filter(n=>n.active&&(!unreadOnly||!n.readAt));
 function openMessage(message:ReminderMessage){void mark("read",message.id);setOpen(false);navigate("/"+message.url);}
 return <div ref={ref} className="relative no-print">
  <button type="button" aria-label={"Reminder inbox, "+unread+" unread"} aria-expanded={open} onClick={()=>setOpen(!open)} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-pink-50 hover:text-pink-600">
   <MessageSquare className="h-5 w-5"/>{unread>0&&<span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-pink-600 px-1 text-center text-[10px] font-bold leading-5 text-white">{unread>99?"99+":unread}</span>}{error&&<span className="absolute -bottom-1 right-0 rounded-full bg-amber-500 px-1 text-[10px] text-white">!</span>}
  </button>
  {open&&<div role="dialog" aria-label="My reminder inbox" className="fixed left-3 right-3 top-20 z-40 max-h-[75vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[400px]">
   <div className="sticky top-0 z-10 space-y-3 border-b bg-white p-4">
    <div className="flex items-center justify-between"><h2 className="font-bold">My reminders <span className="text-pink-600">({unread} unread)</span></h2><button aria-label="Close reminder inbox" onClick={()=>setOpen(false)}><X className="h-4 w-4"/></button></div>
    <div className="flex items-center gap-3 text-xs"><button className={!unreadOnly?"font-bold text-pink-600":"text-neutral-500"} onClick={()=>setUnreadOnly(false)}>All</button><button className={unreadOnly?"font-bold text-pink-600":"text-neutral-500"} onClick={()=>setUnreadOnly(true)}>Unread</button><button disabled={busy||!unread} className="ml-auto inline-flex items-center gap-1 font-semibold disabled:opacity-40" onClick={()=>void mark("read-all")}><CheckCheck className="h-3 w-3"/>Mark all as read</button></div>
    {permission!=="granted"&&permission!=="unsupported"&&<button onClick={enable} className="text-xs font-bold text-pink-600">{permission==="denied"?"Notifications blocked — check browser settings":"Enable Windows notifications"}</button>}
    <p className="text-[11px] text-neutral-400">Only your reminders appear here. Read status is separate from task completion. Desktop alerts need an open or minimised CRM tab.</p>{error&&<p role="alert" className="text-xs text-amber-700">{error}</p>}
   </div>
   {visible.slice(0,limit).map(n=><div key={n.id} role="link" tabIndex={0} onClick={()=>openMessage(n)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openMessage(n);}}} className={"cursor-pointer border-b p-4 hover:bg-pink-50 "+(!n.readAt?"bg-pink-50/60":"bg-white")}>
    <div className="flex items-start gap-2">{!n.readAt&&<span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pink-600"/>}<span className="text-sm font-bold text-neutral-800">{n.title}</span></div><p className="mt-1 text-xs text-neutral-600">{n.body}</p><div className="mt-2 flex items-center justify-between gap-2 text-[11px]"><span className="text-neutral-400">{new Date(n.createdAt).toLocaleString("en-ZA",{timeZone:"Africa/Johannesburg"})}</span><button disabled={busy} className="font-semibold text-pink-600" onClick={e=>{e.stopPropagation();void mark(n.readAt?"unread":"read",n.id);}}>{n.readAt?"Mark as unread":"Mark as read"}</button></div>
   </div>)}
   {!visible.length&&<p className="p-8 text-center text-sm text-neutral-500">{unreadOnly?"No unread reminders.":"You have no reminders yet."}</p>}
   {visible.length>limit&&<button className="w-full p-3 text-sm font-bold" onClick={()=>setLimit(limit+50)}>Show more</button>}
  </div>}
 </div>;

}
