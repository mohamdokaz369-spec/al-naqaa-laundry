export function mapsPoint(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) throw new Error('إحداثيات الموقع غير صحيحة');
  return {location_lat:latitude,location_lng:longitude,google_maps_link:`https://www.google.com/maps?q=${latitude},${longitude}`};
}
export function googleMapsLocation(value: string) {
  const text=value.trim();
  if(!text)return {location_lat:null,location_lng:null,google_maps_link:''};
  let url:URL;
  try{url=new URL(text);}catch{throw new Error('الصق رابط المشاركة من Google Maps');}
  if(text.length>500 || url.protocol!=='https:' || url.username || url.password || !['google.com','www.google.com','maps.google.com','maps.app.goo.gl','goo.gl'].includes(url.hostname))throw new Error('استخدم رابط مشاركة Google Maps آمن');
  const coordinate=url.searchParams.get('query') ?? url.searchParams.get('q') ?? url.searchParams.get('ll');
  // Only explicit coordinate queries identify the destination. A map's /@ camera
  // position can be far from the selected place, so never use it as an address.
  const match=coordinate?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if(match){const point=mapsPoint(Number(match[1]),Number(match[2]));return {...point,google_maps_link:text};}
  return {location_lat:null,location_lng:null,google_maps_link:text};
}
