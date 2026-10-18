// Run in a persistent scheduler/process, never bundle secrets into the mobile app.
const endpoint = process.env.NOTIFICATION_DISPATCH_URL;
const secret = process.env.NOTIFICATION_WORKER_SECRET;
if (!endpoint?.startsWith('https://') || !secret) throw new Error('Configure HTTPS worker endpoint and secret');
async function tick() {
 try {
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(65000) });
  console.log(response.ok ? 'Notification worker completed' : `Notification worker HTTP ${response.status}`);
 } catch { console.log('Notification worker unavailable; next tick will retry'); }
}
await tick();
setInterval(tick, 60000);
