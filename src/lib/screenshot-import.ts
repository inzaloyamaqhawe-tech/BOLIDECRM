import source from '../data/deals-20261026.json';
import tracker from '../data/lead-tracker.json';
import type {Company,Contact,Deal} from '../types';
import {canonical,normaliseDealText} from './deal-duplicates';
import {cleanBusinessNotes} from './business-notes';
export const screenshotImportVersion=source.version+'-business-notes-v1';
export function applyScreenshotImport(input:{companies:Company[];contacts:Contact[];deals:Deal[]}){
 const companies=[...input.companies],contacts=[...input.contacts],deals=input.deals.map((deal):Deal=>({...deal,notes:cleanBusinessNotes(deal.notes)}));
 for(const record of source.records){
  const existing=deals.find(d=>d.id===(record.targetId??record.deal.id))??deals.find(d=>d.division===record.deal.division&&normaliseDealText(d.title)===normaliseDealText(record.deal.title));
  if((existing?.leadTracker?.importSources as any[])?.some(r=>r.source===record.source))continue;
  let company=companies.find(c=>normaliseDealText(c.name)===normaliseDealText(record.companyName));
  if(!company){company={id:'c-screens-'+normaliseDealText(record.companyName),name:record.companyName,industry:'—',status:'Prospect',divisions:[],createdAt:'2026-10-26T08:00:00+02:00'};companies.push(company);}
  company={...company,divisions:[...new Set([...company.divisions,record.deal.division as Deal['division']])]};companies[companies.findIndex(c=>c.id===company!.id)]=company;
  const baseline=tracker.deals.find(d=>d.id===record.targetId),incoming={...record.deal,companyId:company.id} as Partial<Deal>;
  let deal:Deal=existing?{...existing}:{...incoming,id:record.deal.id,createdAt:'2026-10-26T08:00:00+02:00',updatedAt:'2026-10-26T08:00:00+02:00'} as Deal;
  if(existing){for(const [key,value] of Object.entries(incoming)){if(['id','ownerId','notes'].includes(key))continue;const old=(existing as any)[key],original=(baseline as any)?.[key];if(old===undefined||old===null||old===0||old===''||canonical(old)===canonical(original))(deal as any)[key]=value;}if(existing.companyId!==deal.companyId&&existing.primaryContactId){const person=contacts.find(c=>c.id===existing.primaryContactId);if(person){const copy={...person,id:person.id+'-screens',companyId:deal.companyId};contacts.push(copy);deal.primaryContactId=copy.id;}}}
  deal.notes=cleanBusinessNotes([existing?.notes,record.deal.notes].filter(Boolean).join('\n\n'));
  deal.leadTracker={...(existing?.leadTracker??{source:'Deals screenshots 2026-10-26',sourceRows:[]}),importSources:[...((existing?.leadTracker?.importSources as any[])??[]),{source:record.source,fields:record.deal}]};
  if(existing)deals[deals.findIndex(d=>d.id===existing.id)]=deal;else deals.push(deal);
 }
 return {companies,contacts,deals};
}
