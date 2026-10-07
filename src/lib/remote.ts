export const hosted = import.meta.env.BASE_URL === "/crm/";
let csrf="";
export async function api(file: string, body?: unknown) {
 const response=await fetch(`${import.meta.env.BASE_URL}api/${file}.php`, {credentials:"same-origin", ...(body===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},body:JSON.stringify(body)})});
 const data=await response.json();
 if(!response.ok || !data.ok) throw new Error(data.error ?? "Unable to connect to the CRM database.");
 if(data.csrf) csrf=data.csrf;
 return data;
}
