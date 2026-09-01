import { useSyncExternalStore } from "react";
import { subscribe, getCompanies, getContacts, getDeals, getUsers, getAllActivities } from "./store";

/** Subscribes a component to any CRM data change and re-runs `selector`.
 * Keeps pages simple: `const deals = useCrm(getDeals)`. */
export function useCrm<T>(selector: () => T): T {
  return useSyncExternalStore(subscribe, selector, selector);
}

export const useCompanies = () => useCrm(getCompanies);
export const useContacts = () => useCrm(getContacts);
export const useDeals = () => useCrm(getDeals);
export const useUsers = () => useCrm(getUsers);
export const useActivities = () => useCrm(getAllActivities);
