import type { Contact } from "../types";
const normal = (value: string | undefined) => (value ?? "").trim().toLowerCase();
const phone = (value: string | undefined) => (value ?? "").replace(/[^\d+]/g, "");
export function matchDealContact(contacts: Contact[], input: {companyId: string; name: string; email: string; phone?: string}, linkedId?: string) {
 const candidates=contacts.filter(c=>c.companyId===input.companyId);
 const compatible=(c:Contact)=> !(normal(input.email) && normal(c.email) && normal(input.email)!==normal(c.email)) && !(phone(input.phone) && phone(c.phone) && phone(input.phone)!==phone(c.phone));
 const linked=candidates.find(c=>c.id===linkedId);
 if(linked && normal(linked.name)===normal(input.name)) return linked;
 return candidates.find(c=>normal(input.email) && normal(c.email)===normal(input.email))
   ?? candidates.find(c=>phone(input.phone) && phone(c.phone)===phone(input.phone) && !(normal(input.email) && normal(c.email) && normal(input.email)!==normal(c.email)))
   ?? candidates.find(c=>normal(c.name)===normal(input.name) && compatible(c));
}
