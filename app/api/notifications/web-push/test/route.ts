import { NextResponse } from "next/server";
import { staffIdentity } from "@/lib/staff-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { sendWebPush, webPushReady } from "@/lib/notifications/web-push";
import { isRateLimited } from "@/lib/rate-limit";
export async function POST(req:Request) {
 const identity=await staffIdentity(req);
 if(identity?.role!=="admin")return NextResponse.json({error:"غير مصرح"},{status:403});
 if(await isRateLimited(`push-test:${identity.id}`,2,60000))return NextResponse.json({error:"انتظر دقيقة قبل تجربة أخرى"},{status:429});
 if(!webPushReady())return NextResponse.json({error:"خدمة الإشعارات غير جاهزة"},{status:503});
 const {data,error}=await createServiceRoleClient().from('push_devices').select('token').eq('user_id',identity.id).eq('platform','web').limit(10);
 if(error||!data?.length)return NextResponse.json({error:"فعّل إشعارات الخلفية على جهازك أولًا"},{status:400});
 const results=await Promise.allSettled(data.map(device=>sendWebPush(JSON.parse(device.token),'',`test-${Date.now()}`,true)));
 const sent=results.filter(result=>result.status==='fulfilled').length;
 return NextResponse.json(sent?{sent}:{error:"تعذر إرسال التجربة؛ أعد تفعيل اشتراك جهازك"},{status:sent?200:503});
}
