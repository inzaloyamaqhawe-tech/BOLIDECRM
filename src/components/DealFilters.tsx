import { useState } from "react";
import { useAuth } from "../lib/auth";
import { getStagesLive, updateUser } from "../lib/store";
import { useCrm, useUsers } from "../lib/use-store";
import { emptyFilters, type DealFilters as Filters } from "../lib/deal-filters";
export function DealFilters({value,onChange}:{value:Filters;onChange:(f:Filters)=>void}){
 const users=useUsers(),stages=useCrm(getStagesLive),{user}=useAuth(),[name,setName]=useState("");
 const views=users.find(u=>u.id===user?.id)?.savedViews??[];
 function patch(key:keyof Filters,v:string){onChange({...value,[key]:v});}
 const select=(label:string,key:keyof Filters,options:{value:string;label:string}[])=><label className="text-xs font-semibold">{label}<select className="input mt-1" value={value[key]} onChange={e=>patch(key,e.target.value)}><option value="">All</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
 return <details className="rounded-xl border bg-white p-3"><summary className="cursor-pointer text-sm font-bold">Filters, sorting & saved views</summary><div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
  <label className="text-xs font-semibold">Search<input className="input mt-1" value={value.query} onChange={e=>patch("query",e.target.value)} placeholder="Deal, company, contact or site"/></label>
  {select("Owner","owner",users.map(u=>({value:u.id,label:u.name})))}
  {select("Division","division",["energy","secure","connect","water","saas"].map(v=>({value:v,label:v})))}
  {select("Stage","stage",stages.map(s=>({value:s.key,label:s.label})))}
  {select("Segment","segment",["Commercial","Industrial","Forecourt","MDU"].map(v=>({value:v,label:v})))}
  {select("Attention","attention",[{value:"proposal-overdue",label:"Overdue proposals"},{value:"stale",label:"Inactive 14+ days"},{value:"awaiting-model",label:"Energy not yet modelled"}])}
  <label className="text-xs font-semibold">Close from<input className="input mt-1" type="date" value={value.closeFrom} onChange={e=>patch("closeFrom",e.target.value)}/></label>
  <label className="text-xs font-semibold">Close to<input className="input mt-1" type="date" value={value.closeTo} onChange={e=>patch("closeTo",e.target.value)}/></label>
  <label className="text-xs font-semibold">Sort<select className="input mt-1" value={value.sort} onChange={e=>patch("sort",e.target.value)}>{[{value:"updated-desc",label:"Recently updated"},{value:"received-desc",label:"Newest received"},{value:"title",label:"Title A–Z"},{value:"close-asc",label:"Earliest close"},{value:"value-desc",label:"Highest value"}].map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
 </div><div className="mt-3 flex flex-wrap gap-2 text-xs">
  <button className="rounded-full border px-3 py-2" onClick={()=>onChange({...emptyFilters,owner:user?.id??"",attention:"proposal-overdue"})}>My overdue proposals</button>
  <button className="rounded-full border px-3 py-2" onClick={()=>{const now=new Date(),y=now.getFullYear(),m=now.getMonth();onChange({...emptyFilters,closeFrom:new Date(Date.UTC(y,m,1)).toISOString().slice(0,10),closeTo:new Date(Date.UTC(y,m+1,0)).toISOString().slice(0,10)});}}>Closing this month</button>
  <button className="rounded-full border px-3 py-2" onClick={()=>onChange({...emptyFilters,division:"energy",attention:"awaiting-model"})}>Energy not yet modelled</button>
  <button className="rounded-full border px-3 py-2" onClick={()=>onChange({...emptyFilters})}>Reset</button>
 </div><div className="mt-3 flex flex-wrap items-center gap-2"><input className="input max-w-xs" placeholder="Name this view" value={name} onChange={e=>setName(e.target.value)}/><button className="text-sm font-bold" onClick={()=>{if(user&&name.trim()){updateUser(user.id,{savedViews:[...views.filter(v=>v.name!==name.trim()),{id:crypto.randomUUID(),name:name.trim(),filters:value}]});setName("");}}}>Save view</button>{views.map(v=><span key={v.id} className="rounded-full border px-3 py-1 text-xs"><button onClick={()=>onChange({...emptyFilters,...v.filters})}>{v.name}</button><button aria-label={"Delete view "+v.name} className="ml-2" onClick={()=>user&&updateUser(user.id,{savedViews:views.filter(view=>view.id!==v.id)})}>×</button></span>)}</div></details>;
}
