// Displays reminders requested by an authenticated open CRM tab.
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "./tasks", self.location.href);
  if (url.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({type:"window",includeUncontrolled:true});
    const tab = tabs.find(client => client.url.startsWith(self.registration.scope));
    if (tab) {await tab.navigate(url.href);await tab.focus();}
    else await self.clients.openWindow(url.href);
  })());
});
