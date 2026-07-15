/* Klein Jobs — service worker for push notifications */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(clients.claim()); });

var API = 'https://bpnpeospivgdvgalbpng.supabase.co/functions/v1/app/api/';
function token(){ return new URLSearchParams(self.location.search).get('t') || ''; }
function appUrl(){ return self.location.origin + self.location.pathname.replace('sw.js','') + '?t=' + token(); }

self.addEventListener('push', function(e){
  e.waitUntil((async function(){
    var body = 'You have a new or updated job. Tap to see it.';
    try {
      var r = await fetch(API + 'worker?t=' + encodeURIComponent(token()), {cache:'no-store'});
      var d = await r.json();
      var today = new Date().toISOString().slice(0,10);
      var up = (d.jobs || []).filter(function(j){ return j.job_date >= today && j.status !== 'done'; });
      if (up.length) {
        var j = up[0];
        body = 'Next: ' + j.job_date + ' ' + String(j.start_time||'').slice(0,5) + ' — ' + j.customer_name + ' (' + up.length + ' open job' + (up.length>1?'s':'') + ')';
      }
    } catch(err){}
    return self.registration.showNotification('🚚 Klein Jobs — new job for you', {
      body: body,
      tag: 'klein-jobs',
      renotify: true,
      data: { url: appUrl() }
    });
  })());
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || appUrl();
  e.waitUntil((async function(){
    var list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.location.origin) === 0 && 'focus' in list[i]) return list[i].focus();
    }
    return clients.openWindow(url);
  })());
});
