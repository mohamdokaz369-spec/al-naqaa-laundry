import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyMetaSignature(raw:string, signature:string, secret:string):boolean {
 if(!secret)return false;
 const expected=`sha256=${createHmac("sha256",secret).update(raw).digest("hex")}`;
 return Buffer.byteLength(signature)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected));
}
export function isWhatsAppOptOut(text:unknown):boolean {
 return typeof text==="string"&&["stop","unsubscribe","إلغاء","الغاء","توقف","وقف"].includes(text.trim().toLowerCase());
}
