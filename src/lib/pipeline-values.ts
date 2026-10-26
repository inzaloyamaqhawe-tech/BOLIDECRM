import type {Deal,Stage} from '../types';
export const firstYearValue=(deal:Pick<Deal,'onceOff'|'mrr'>)=>deal.onceOff+12*deal.mrr;
export function pipelineValues(deals:Deal[],stages:Stage[]){const open=deals.filter(d=>d.stage!=='won'&&d.stage!=='lost');return {open,total:open.reduce((sum,d)=>sum+firstYearValue(d),0),weighted:open.reduce((sum,d)=>sum+firstYearValue(d)*(stages.find(s=>s.key===d.stage)?.probability??0)/100,0),mrr:open.reduce((sum,d)=>sum+d.mrr,0)};}
