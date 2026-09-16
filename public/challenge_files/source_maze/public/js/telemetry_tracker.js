function trackPing() { fetch('/health'); }
setInterval(trackPing, 60000);
