import type { Deal } from "../types";
import { effectiveProposalDue, localDay, proposalOutstanding } from "./proposal";
import { dealFlags } from "./workflow";
export interface DealFilters {owner:string;division:string;stage:string;segment:string;attention:string;closeFrom:string;closeTo:string;sort:string;query:string;}
export const emptyFilters:DealFilters={owner:"",division:"",stage:"",segment:"",attention:"",closeFrom:"",closeTo:"",sort:"updated-desc",query:""};
export function filterDeals(deals:Deal[],f:DealFilters,companyName:(id:string)=>string=()=>"",now=new Date()){
 const today=localDay(now.toISOString());
 const result=deals.filter(d=>{
  if(f.owner&&d.ownerId!==f.owner||f.division&&d.division!==f.division||f.stage&&d.stage!==f.stage||f.segment&&d.segment!==f.segment)return false;
  if(f.closeFrom&&(!d.closeDate||d.closeDate<f.closeFrom)||f.closeTo&&(!d.closeDate||d.closeDate>f.closeTo))return false;
  if(f.query&&![d.title,d.site,companyName(d.companyId),d.primaryContactName].some(s=>s?.toLowerCase().includes(f.query.toLowerCase().trim())))return false;
  if(f.attention==="proposal-overdue"&&(!proposalOutstanding(d)||!effectiveProposalDue(d)||effectiveProposalDue(d)!>=today))return false;
  if(f.attention==="no-action"&&!dealFlags(d,now).includes("No next action"))return false;
  if(f.attention==="stale"&&!dealFlags(d,now).includes("Inactive 14+ days"))return false;
  if(f.attention==="action-overdue"&&!dealFlags(d,now).includes("Next action overdue"))return false;
  if(f.attention==="awaiting-model"&&(d.division!=="energy"||d.financingDetails?.bankModelStatus==="Modelled"||["won","lost"].includes(d.stage)))return false;
  return true;
 });
 return result.sort((a,b)=>f.sort==="title"?a.title.localeCompare(b.title):f.sort==="value-desc"?(b.onceOff+b.mrr*12)-(a.onceOff+a.mrr*12):f.sort==="close-asc"?(a.closeDate??"9999").localeCompare(b.closeDate??"9999"):f.sort==="received-desc"?(b.receivedAt??b.createdAt).localeCompare(a.receivedAt??a.createdAt):b.updatedAt.localeCompare(a.updatedAt));
}
