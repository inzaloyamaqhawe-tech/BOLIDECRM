import { useEffect, useState } from "react";
import type { DealDraft, DuplicateMatch } from "../lib/deal-duplicates";
import { mergeFields } from "../lib/deal-duplicates";
import { useUsers } from "../lib/use-store";
import { getStagesLive } from "../lib/store";

export function targetDraft(match:DuplicateMatch):DealDraft {return {deal:match.deal,companyName:match.companyName,contact:{name:match.contact?.name??match.deal.primaryContactName??"",phone:match.contact?.phone,email:match.contact?.email??""}};}
export function DealDuplicatePanel({matches,draft,loading,error,target,onTarget,onOpen,choices,onChoices,separateReason,onSeparateReason,forceReview,busy}:{matches:DuplicateMatch[];draft:DealDraft;loading:boolean;error:string;target:DuplicateMatch|null;onTarget:(m:DuplicateMatch|null)=>void;onOpen:(m:DuplicateMatch)=>void;choices:string[];onChoices:(v:string[])=>void;separateReason:string;onSeparateReason:(v:string)=>void;forceReview:boolean;busy:boolean}){
 const users=useUsers(),stages=getStagesLive(),[expanded,setExpanded]=useState<string>(),[limit,setLimit]=useState(5);
 const fields=target?mergeFields(targetDraft(target),draft):[];
 useEffect(()=>{if(!target)return;onChoices(mergeFields(targetDraft(target),draft).filter(f=>f.fill).map(f=>f.path));},[target?.deal.id,target?.version]);
 const names:Record<string,string>={title:"Deal title",site:"Location",stage:"Stage",segment:"Segment",productLine:"Product line",onceOff:"Once-off amount",mrr:"Monthly recurring amount",ownerId:"Owner",receivedAt:"Received date",closeDate:"Close date",primaryContactName:"Primary contact",contact:"Primary contact (name, phone and email)",workflow:"Workflow","workflow.kyc":"KYC checklist"};
 function value(path:string,input:unknown){
  if(input===null||input===undefined||input==="")return "Not recorded";
  if(path==="ownerId"||path==="workflow.escalationUserId")return users.find(u=>u.id===input)?.name??"Unknown person";
  if(path==="stage")return stages.find(s=>s.key===input)?.label??String(input);
  if(path==="contact"){const c=input as DealDraft['contact'];return [c.name,c.phone||"No phone",c.email||"No email"].join("\n");}
  if(path==="workflow.kyc"&&Array.isArray(input))return input.map(i=>[i.label,i.status,i.attachmentId?"Document attached":"No document",i.expiresOn?"Expires "+i.expiresOn:null].filter(Boolean).join(" · ")).join("\n");
  if(["receivedAt","closeDate","workflow.signedOn","workflow.proposalDueOverride"].includes(path)&&typeof input==="string")return new Date(input.length===10?input+"T12:00:00+02:00":input).toLocaleDateString("en-ZA",{timeZone:"Africa/Johannesburg"});
  if(["onceOff","mrr"].includes(path)&&typeof input==="number")return "R "+input.toLocaleString("en-ZA");
  return typeof input==="object"?JSON.stringify(input,null,2):String(input);
 }
 if(!matches.length&&!loading&&!error&&!forceReview)return null;
 return <section aria-label="Similar deal review" className="sm:col-span-2 space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
  <h3 className="font-bold">{target?"Review merge":"Check existing opportunities"}</h3>
  <p className="text-xs text-neutral-600">Match company, solution and location. Ownership is shown below; it does not mean the person is currently editing the deal.</p>
  {loading&&<p role="status" className="text-xs">Checking shared deals…</p>}{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
  {forceReview&&<p role="alert" className="text-sm font-semibold text-amber-800">A similar deal exists. Open it, review a merge, or give a reason for creating a separate opportunity.</p>}
  {!target&&matches.slice(0,limit).map(m=><div key={m.deal.id} className="space-y-2 rounded-lg border bg-white p-3">
   <div className="font-bold">{m.deal.title}</div><p className="text-xs">{m.companyName} · {m.deal.division} / {m.deal.productLine??"Product not specified"} · {m.deal.site??"Location not recorded"}</p>
   <p className="text-xs text-neutral-500">Owner: {m.ownerName} · {stages.find(s=>s.key===m.deal.stage)?.label??m.deal.stage}{m.creatorName?" · Created by "+m.creatorName:" · Creator not recorded (older/imported record)"}</p><p className="text-xs font-semibold text-amber-800">{m.reason}</p>
   <div className="flex flex-wrap gap-3 text-xs font-bold"><button type="button" disabled={busy} onClick={()=>onOpen(m)}>Open existing deal</button>{m.potential&&<button type="button" disabled={busy} className="text-pink-600" onClick={()=>onTarget(m)}>Review merge</button>}<button type="button" onClick={()=>setExpanded(expanded===m.deal.id?undefined:m.deal.id)}>{expanded===m.deal.id?"Hide":"View"} captured information</button></div>
   {expanded===m.deal.id&&<div className="space-y-1 break-words text-xs text-neutral-600"><p>Contact: {m.contact?.name??m.deal.primaryContactName??"Not recorded"} · {m.contact?.phone??"No phone"} · {m.contact?.email??"No email"}</p><p>Once-off: R{m.deal.onceOff.toLocaleString("en-ZA")} · MRR: R{m.deal.mrr.toLocaleString("en-ZA")}</p><p className="whitespace-pre-wrap">Notes: {m.deal.notes??"None"}</p><p>Last updated: {new Date(m.deal.updatedAt).toLocaleString("en-ZA",{timeZone:"Africa/Johannesburg"})}</p></div>}
  </div>)}
  {!target&&matches.length>limit&&<button type="button" className="text-xs font-bold" onClick={()=>setLimit(limit+5)}>Show more matching deals ({matches.length-limit} remaining)</button>}
  {target?<>
   <div className="rounded-lg bg-white p-3 text-sm"><strong>Keep record:</strong> {target.deal.title} · {target.ownerName}<p className="mt-1 text-xs text-neutral-500">Existing values are kept unless you select an incoming value. Missing values are selected for filling. Notes, tasks, attachments and history are retained. An archive preserves the incoming record.</p></div>
   <div className="max-h-80 overflow-auto rounded-lg border bg-white"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Field</th><th className="p-2">Keep existing</th><th className="p-2">Incoming information</th><th className="p-2">Use incoming</th></tr></thead><tbody>{fields.map(f=><tr key={f.path} className="border-t"><td className="p-2 font-semibold">{names[f.path]??f.path.split(".").join(" / ")}</td><td className="max-w-[160px] whitespace-pre-wrap break-words p-2">{value(f.path,f.before)}</td><td className="max-w-[160px] whitespace-pre-wrap break-words p-2">{value(f.path,f.after)}</td><td className="p-2"><input aria-label={"Use incoming "+f.path} type="checkbox" checked={choices.includes(f.path)} onChange={e=>onChoices(e.target.checked?[...choices,f.path]:choices.filter(p=>p!==f.path))}/></td></tr>)}</tbody></table>{!fields.length&&<p className="p-3">No conflicting field values; notes and related records will still be preserved.</p>}</div>
   <button type="button" disabled={busy} className="text-xs font-bold" onClick={()=>onTarget(null)}>Cancel merge review</button>
  </>:matches.some(m=>m.potential)&&<label className="block text-xs font-semibold">Create a separate opportunity instead — explain why<input className="input mt-1" value={separateReason} onChange={e=>onSeparateReason(e.target.value)} placeholder="For example: a separate project phase or renewal"/><span className="mt-1 block font-normal text-neutral-500">A reason is required only when saving a similar deal separately. Nothing is merged automatically.</span></label>}
 </section>;
}
