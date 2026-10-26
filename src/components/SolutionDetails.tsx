import type { Deal,DivisionKey } from '../types';
type Definition=[string,string,'number'|'text'];
const fields:Partial<Record<DivisionKey,{root:keyof Deal;fields:Definition[]}>>={
 secure:{root:'secureDetails',fields:[['camerasInstalled','Cameras installed','number'],['camerasMonitored','Cameras monitored','number']]},
 energy:{root:'energyDetails',fields:[['solarKwp','Solar (kWp)','number'],['bessKwh','BESS (kWh)','number'],['ratePerKwh','PPA tariff (R/kWh)','number'],['solutionType','Solution type','text'],['landlord','Landlord','text'],['anchorTenant','Anchor tenant','text'],['roofSizeM2','Roof size (m²)','number'],['roofState','Roof state','text'],['municipalTariff','Municipal tariff (R/kWh)','number'],['timeframe','Project timeframe','text']]},
 water:{root:'waterDetails',fields:[['litresPerDay','Litres / day','number'],['litresPerMonth','Litres / month','number'],['serviceModel','Service model','text'],['epcPartner','EPC partner','text'],['wulaStatus','WULA status','text']]},
 connect:{root:'connectDetails',fields:[['product','Herotel product','text'],['contractMonths','Contract term (months)','number'],['supplier','Supplier','text'],['mall','Mall / centre','text'],['tenants','Tenant(s)','text'],['wholesaleNrc','Wholesale NRC (excl. VAT)','number'],['wholesaleMrc','Wholesale MRC (excl. VAT)','number']]},
};
export function parseAmount(value:string|number):number{if(typeof value==='number')return value;const clean=value.trim().replace(/[\s\u00a0]/g,'').replace(/,/g,'.');if(!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(clean))return NaN;return Number(clean);}
export function cleanSolutionDetails(deal:Partial<Deal>):Partial<Deal>{const result={...deal};for(const def of Object.values(fields)){const values=(deal as any)[def.root];if(!values)continue;const copy={...values};for(const [key,label,type] of def.fields)if(type==='number'&&copy[key]!==undefined&&copy[key]!==null){if(copy[key]===''){delete copy[key];continue;}copy[key]=parseAmount(copy[key]);if(!Number.isFinite(copy[key])||copy[key]<0)throw new Error('Enter a valid non-negative value for '+label+'.');}(result as any)[def.root]=copy;}return result;}
export function SolutionDetails({division,value,onChange,extrasOnly=false}:{division:DivisionKey;value:Partial<Deal>;onChange:(v:Partial<Deal>)=>void;extrasOnly?:boolean}){
 const def=fields[division];if(!def)return null;const values=(value as any)[def.root]??{};
 const patch=(key:string,v:unknown)=>onChange({...value,[def.root]:{...values,[key]:v}});
 const hide=extrasOnly?(division==='energy'?['solarKwp','bessKwh','ratePerKwh']:division==='water'?['litresPerDay']:division==='secure'?['camerasInstalled','camerasMonitored']:[]):[];
 return <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">{def.fields.filter(([k])=>!hide.includes(k)).map(([key,label,type])=><label key={key} className="block text-xs font-semibold">{label}<input className="input mt-1" inputMode={type==='number'?'decimal':undefined} value={values[key]??''} onChange={e=>patch(key,e.target.value)}/></label>)}
 {division==='water'&&<><label className="text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={!!values.offBalanceSheet} onChange={e=>patch('offBalanceSheet',e.target.checked)}/> Off-balance-sheet (EPC-funded)</label><label className="text-xs font-semibold sm:col-span-2">Water solutions (comma-separated)<input className="input mt-1" value={(values.solutions??[]).join(', ')} onChange={e=>patch('solutions',e.target.value.split(',').map(x=>x.trim()))}/></label></>}
 </div>;
}
