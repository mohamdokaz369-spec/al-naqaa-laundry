import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { mapsPoint } from '../../lib/maps-location';
export async function currentPickupLocation() {
  try {
    if (Capacitor.isNativePlatform()) {
      let permission=await Geolocation.checkPermissions();
      if(permission.location!=='granted' && permission.coarseLocation!=='granted') permission=await Geolocation.requestPermissions({permissions:['location']});
      if(permission.location!=='granted' && permission.coarseLocation!=='granted')throw new Error('permission_denied');
    }
    const position=await Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:20000,maximumAge:0});
    return {...mapsPoint(position.coords.latitude,position.coords.longitude),accuracy:position.coords.accuracy};
  } catch {
    throw new Error('تعذر تحديد الموقع. فعّل خدمة الموقع واسمح للتطبيق بالوصول أثناء الاستخدام، أو الصق رابط Google Maps أو اكتب العنوان.');
  }
}
