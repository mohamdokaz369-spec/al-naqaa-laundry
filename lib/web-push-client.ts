export async function subscribeAdminPush() {
 if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) throw new Error("هذا المتصفح لا يدعم إشعارات الخلفية. على آيفون افتح الموقع من أيقونته بعد إضافته إلى الشاشة الرئيسية.");
 const permission=await Notification.requestPermission();
 if(permission!=="granted") throw new Error("اسمح بالإشعارات من إعدادات الموقع في المتصفح");
 const response=await fetch('/api/notifications/web-push',{cache:'no-store'});
 const config=await response.json();
 if(!response.ok || !config.publicKey) throw new Error(config.error || "خدمة إشعارات الخلفية قيد الإعداد، تنبيهات اللوحة المفتوحة ما زالت متاحة");
 const registration=await navigator.serviceWorker.register('/admin-push-sw.js',{scope:'/'});
 await navigator.serviceWorker.ready;
 let subscription=await registration.pushManager.getSubscription();
 if(!subscription) {
  const raw=atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/'));
  const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
 }
 const saved=await fetch('/api/notifications/web-push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(subscription)});
 if(!saved.ok) throw new Error((await saved.json()).error || 'تعذر حفظ الاشتراك');
}
