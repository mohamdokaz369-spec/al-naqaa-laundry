/* Only non-sensitive order notifications are cached by the browser push service. */
self.addEventListener('push', event => {
 let data;
 try { data=event.data.json(); } catch { return; }
 event.waitUntil(self.registration.showNotification(data.title || 'طلب جديد وصل', {
  body:data.body || 'افتح لوحة الإدارة لمراجعة الطلبات',tag:data.tag || 'new-order',
  data:{url:'/admin/orders'},dir:'rtl',lang:'ar',
 }));
});
self.addEventListener('notificationclick', event => {
 event.notification.close();
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(client=>new URL(client.url).pathname==='/admin/orders');
  if(existing) return existing.focus();
  return self.clients.openWindow('/admin/orders');
 })());
});
