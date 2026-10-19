import { after, NextResponse } from "next/server";
import { z } from "zod";
import { staffIdentity } from "@/lib/staff-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { webPushReady } from "@/lib/notifications/web-push";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
const subscriptionSchema = z.object({
 endpoint:z.string().url().max(2048).refine(value=>{ const url=new URL(value); return url.protocol==='https:' && !url.username && !url.password && (url.hostname==='fcm.googleapis.com'||url.hostname==='updates.push.services.mozilla.com'||url.hostname.endsWith('.push.services.mozilla.com')||url.hostname==='web.push.apple.com'||url.hostname.endsWith('.notify.windows.com')); }),
 keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]+$/).min(80).max(100),auth:z.string().regex(/^[A-Za-z0-9_-]+$/).min(20).max(30)})
});
export async function GET(req:Request) {
 if ((await staffIdentity(req))?.role!=="admin") return NextResponse.json({error:"غير مصرح"},{status:403});
 return NextResponse.json({publicKey:webPushReady()?process.env.WEB_PUSH_PUBLIC_KEY:null},{headers:{"Cache-Control":"no-store"}});
}
export const maxDuration=60;
export async function POST(req:Request) {
 const identity=await staffIdentity(req);
 if(identity?.role!=="admin") return NextResponse.json({error:"غير مصرح"},{status:403});
 const input=subscriptionSchema.safeParse(await req.json().catch(()=>null));
 if(!input.success) return NextResponse.json({error:"اشتراك غير صالح"},{status:400});
 if(!webPushReady()) return NextResponse.json({error:"خدمة إشعارات الخلفية قيد الإعداد"},{status:503});
 const db=createServiceRoleClient();
 const {error}=await db.from('push_devices').upsert({user_id:identity.id,platform:'web',token:JSON.stringify(input.data),updated_at:new Date().toISOString()},{onConflict:'token'});
 if(error) return NextResponse.json({error:"تعذر تسجيل اشتراك الإشعارات"},{status:503});
 await db.from('notification_outbox').update({available_at:new Date().toISOString()}).eq('channel','push_admin').eq('status','blocked');
 after(async()=>{try{await dispatchNotifications();}catch{/* Durable queue retries. */}});
 return NextResponse.json({registered:true});
}
