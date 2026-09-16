// Telemetry ping
console.log("Shadow Portal Client v4.7.19 Initialized");
fetch('/health').then(r => r.json()).then(console.log);
