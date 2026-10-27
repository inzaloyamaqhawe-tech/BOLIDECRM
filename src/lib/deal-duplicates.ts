import type { Company, Contact, Deal, User } from "../types";
export interface DealDraft {companyName:string;contact:{name:string;phone?:string;email:string};deal:Partial<Deal>;}
export interface DuplicateMatch {deal:Deal;companyName:string;ownerName:string;creatorName?:string;contact?:Contact;version:string;potential:boolean;reason:string;}
export class DealFieldConflict extends Error {constructor(public field:string,public current:unknown,public incoming:unknown){super('Another person changed '+field+'. Review both values before saving.');}}
export interface DealWriteOptions {action:"create"|"update"|"merge";baseDraft?:DealDraft;sourceId?:string;sourceVersion?:string;targetId?:string;targetVersion?:string;choices?:string[];separate?:{reason:string;matches:{id:string;version:string}[]};}
export const normaliseDealText=(s?:string)=> (s??"").toLowerCase().replace(/[^a-z0-9]/g,"");
const knownLocation=(value?:string)=>{const site=normaliseDealText(value);return ["","tbc","tbd","sitetbc","unknown","na","notsupplied","tobeconfirmed"].includes(site)?"":site;};
function sameOpportunity(fresh:Partial<Deal>,existing:Deal):boolean {
 if(fresh.division!==existing.division)return false;
 const product=normaliseDealText(fresh.productLine),oldProduct=normaliseDealText(existing.productLine);if(product&&oldProduct&&product!==oldProduct)return false;
 const site=knownLocation(fresh.site),oldSite=knownLocation(existing.site);if(site&&oldSite&&site===oldSite)return true;
 const title=normaliseDealText(fresh.title),oldTitle=normaliseDealText(existing.title);
 return !!title&&!!oldTitle&&(title===oldTitle||(Math.min(title.length,oldTitle.length)>=10&&(title.includes(oldTitle)||oldTitle.includes(title))));
}
export function duplicateKind(draft:DealDraft,existing:Deal,companyName:string):"potential"|"related"|null {
 const a=normaliseDealText(draft.companyName),b=normaliseDealText(companyName);if(!a||!b)return null;
 if(!sameOpportunity(draft.deal,existing))return null;
 if(a===b)return "potential";
 return a.length>=3&&(b.includes(a)||a.includes(b))?"related":null;
}
export function canonical(value:unknown):string {if(value===undefined||value===null)return "null";if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";if(typeof value==="object")return "{"+Object.keys(value).sort().filter(k=>(value as any)[k]!==undefined).map(k=>JSON.stringify(k)+":"+canonical((value as any)[k])).join(",")+"}";return JSON.stringify(value);}
export async function dealVersion(deal:Deal,contact?:Contact){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical([deal,contact??null])));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");}
export async function localDuplicateMatches(draft:DealDraft,deals:Deal[],companies:Company[],users:User[],contacts:Contact[],exclude?:string):Promise<DuplicateMatch[]> {
 const names=new Map(companies.map(c=>[c.id,c.name]));const matches=await Promise.all(deals.filter(d=>d.id!==exclude).map(async (deal):Promise<DuplicateMatch|null>=>{const companyName=names.get(deal.companyId)??"",kind=duplicateKind(draft,deal,companyName);if(!kind)return null;return {deal,companyName,ownerName:users.find(u=>u.id===deal.ownerId)?.name??"Unknown owner",creatorName:users.find(u=>u.id===deal.createdById)?.name,contact:contacts.find(c=>c.id===deal.primaryContactId),version:await dealVersion(deal,contacts.find(c=>c.id===deal.primaryContactId)),potential:kind==="potential",reason:kind==="potential"?"Same company, solution and project location or title":"Similar company name with the same project identity"};}));
 return matches.filter((m):m is DuplicateMatch=>m!==null).sort((a,b)=>Number(b.potential)-Number(a.potential));
}
export const mergeRoots=["title","site","segment","productLine","stage","onceOff","mrr","ownerId","closeDate","receivedAt","lostReason","secureDetails","energyDetails","waterDetails","connectDetails","financingDetails","workflow","contact"];
export interface MergeField {path:string;before:unknown;after:unknown;fill:boolean;}
const missing=(v:unknown)=>v===null||v===undefined||v===""||(Array.isArray(v)&&!v.length)||(typeof v==="object"&&v!==null&&!Object.keys(v).length);
export function mergeFields(target:DealDraft,incoming:DealDraft):MergeField[]{
 const old:any={...target.deal,contact:target.contact},fresh:any={...incoming.deal,contact:incoming.contact};const rows:MergeField[]=[];
 function compare(a:any,b:any,path:string){if(canonical(a)===canonical(b)||missing(b))return;if(path==="contact"&&a?.name&&b?.name&&normaliseDealText(a.name)!==normaliseDealText(b.name)){rows.push({path,before:a,after:b,fill:false});return;}if(b&&typeof b==="object"&&!Array.isArray(b)){for(const k of Object.keys(b)){if(path==="workflow"&&k==="nextAction")continue;compare(a?.[k],b[k],path+"."+k);}}else rows.push({path,before:a,after:b,fill:missing(a)});}
 for(const root of mergeRoots)compare(old[root],fresh[root],root);return rows;
}
export function mergeDraft(target:DealDraft,incoming:DealDraft,choices:string[]):DealDraft {
 const result=JSON.parse(JSON.stringify(target)) as DealDraft;const view:any={...result.deal,contact:result.contact};
 for(const field of mergeFields(target,incoming))if(choices.includes(field.path)){const keys=field.path.split(".");let node=view;for(const key of keys.slice(0,-1))node=node[key]??=( {} );node[keys[keys.length-1]]=field.after;}
 const {contact,...deal}=view;result.deal=deal;result.contact=contact;
 if(incoming.deal.notes?.trim()&&incoming.deal.notes.trim()!==target.deal.notes?.trim())result.deal.notes=[target.deal.notes,"Merged information:\n"+incoming.deal.notes.trim()].filter(Boolean).join("\n\n");
 return result;
}
export function rebaseDraft(base:DealDraft,input:DealDraft,current:DealDraft):DealDraft {
 function walk(a:any,b:any,c:any,path:string):any{
  if(canonical(a)===canonical(b))return c;
  if((a&&typeof a==='object'&&!Array.isArray(a))||(b&&typeof b==='object'&&!Array.isArray(b))){const result={...c};for(const key of new Set([...Object.keys(a??{}),...Object.keys(b??{})])){if(path==='workflow'&&key==='nextAction')continue;const value=walk(a?.[key],b?.[key],c?.[key],path+'.'+key);if(value===undefined||value===null)delete result[key];else result[key]=value;}return result;}
  if(canonical(a)!==canonical(c)&&canonical(b)!==canonical(c))throw new DealFieldConflict(path,c,b);return b;
 }
 const result:DealDraft={companyName:walk(base.companyName,input.companyName,current.companyName,'company'),contact:walk(base.contact,input.contact,current.contact,'contact'),deal:{...current.deal}};
 for(const key of [...mergeRoots.filter(k=>k!=='contact'),'division','notes']){const value=walk((base.deal as any)[key],(input.deal as any)[key],(current.deal as any)[key],key);if(value===undefined||value===null)delete (result.deal as any)[key];else(result.deal as any)[key]=value;}return result;
}
