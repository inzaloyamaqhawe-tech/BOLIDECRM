export const hosted = import.meta.env.BASE_URL === "/crm/";
let csrf="";
export class CrmApiError extends Error { constructor(message:string,public status:number,public details:any){super(message);} }
export async function api(file: string, body?: unknown) {
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 let response:Response,data:any;
 try{response=await fetch(`${import.meta.env.BASE_URL}api/${file}.php`, {signal:controller.signal,credentials:"same-origin", ...(body===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},body:JSON.stringify(body)})});data=await response.json();}
 catch(e){throw new Error((e as Error).name==='AbortError'?'The server took too long to respond. Your draft is kept. Retry the same save to check whether it completed.':'The connection failed. Your draft is kept; retry when connected.');}finally{clearTimeout(timer);}
 if(!response.ok || !data.ok) throw new CrmApiError(data.error ?? "Unable to connect to the CRM database.",response.status,data);
 if(data.csrf) csrf=data.csrf;
 return data;
}
