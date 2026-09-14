const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDirs = [
  path.join(__dirname, 'challenge_files', 'source_maze'),
  'C:\\Users\\prateek sagar\\Downloads\\LOGIC_CTF\\LOGIC_CTF'
];

console.log('Building upgraded challenge 5 source maze...');

const mazeFiles = [
  // Root files
  {
    subPath: 'app.py',
    content: `from flask import Flask, request, render_template, jsonify, make_response
import sqlite3, hashlib, hmac, base64, json, os, time

app = Flask(__name__)
DB = "/tmp/shadow_backup.db"
JWT_SECRET = os.environ.get("JWT_SECRET", "shadow-console-2026")
# Obscured artifact recovery path:
FLAG_PATH = os.path.join(os.path.dirname(__file__), "core", "pipeline", "telemetry", "manifest", ".vault_flag.txt")

def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        role TEXT
    );
    CREATE TABLE IF NOT EXISTS documents(
        id INTEGER PRIMARY KEY,
        owner_id INTEGER,
        title TEXT,
        body TEXT
    );
    CREATE TABLE IF NOT EXISTS config(
        name TEXT PRIMARY KEY,
        value TEXT
    );
    """)
    if not conn.execute("SELECT 1 FROM users WHERE username='admin'").fetchone():
        conn.execute("INSERT INTO users(username,password_hash,role) VALUES(?,?,?)",
                     ("admin", hashlib.sha256(b"not_the_flag").hexdigest(), "admin"))
        conn.execute("INSERT INTO users(username,password_hash,role) VALUES(?,?,?)",
                     ("guest", hashlib.sha256(b"guest123").hexdigest(), "user"))
        conn.execute("INSERT INTO documents(owner_id,title,body) VALUES(1,'Incident report','Internal recovery notes.')")
        conn.execute("INSERT INTO config(name,value) VALUES('jwt_secret',?)", (JWT_SECRET,))
        conn.execute("INSERT INTO config(name,value) VALUES('build','SB-4.7.19')")
        conn.commit()
    conn.close()

def b64e(x):
    return base64.urlsafe_b64encode(x).rstrip(b"=").decode()

def b64d(x):
    return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))

def make_token(payload):
    head = b64e(b'{"alg":"HS256","typ":"JWT"}')
    body = b64e(json.dumps(payload, separators=(",", ":")).encode())
    sig = b64e(hmac.new(JWT_SECRET.encode(), f"{head}.{body}".encode(), hashlib.sha256).digest())
    return f"{head}.{body}.{sig}"

def verify_token(token):
    try:
        head, body, sig = token.split(".")
        expected = b64e(hmac.new(JWT_SECRET.encode(), f"{head}.{body}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        return json.loads(b64d(body))
    except Exception:
        return None

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    u = request.form.get("username","")
    p = request.form.get("password","")
    row = db().execute("SELECT * FROM users WHERE username=? AND password_hash=?",
                        (u, hashlib.sha256(p.encode()).hexdigest())).fetchone()
    if not row:
        return "Invalid credentials", 401
    token = make_token({"sub": row["id"], "user": row["username"], "role": row["role"], "iat": int(time.time())})
    r = make_response(jsonify({"ok": True, "message": "authenticated"}))
    r.set_cookie("session", token, httponly=True)
    return r

@app.route("/api/search")
def search():
    q = request.args.get("q","")
    sql = f"SELECT id, username, role FROM users WHERE username LIKE '%{q}%'"
    try:
        rows = db().execute(sql).fetchall()
        return jsonify([dict(x) for x in rows])
    except Exception as e:
        return jsonify({"error":"database error","detail":str(e)}), 500

@app.route("/admin")
def admin():
    tok = verify_token(request.cookies.get("session",""))
    if not tok or tok.get("role") != "admin":
        return "Admin console: authentication required", 403
    return render_template("admin.html", user=tok.get("user"))

@app.route("/admin/backup")
def backup():
    tok = verify_token(request.cookies.get("session",""))
    if not tok or tok.get("role") != "admin":
        return "Forbidden", 403
    name = request.args.get("file","")
    if ".." in name:
        return "Blocked path", 400
    target = os.path.join(os.path.dirname(__file__), "backups", name)
    try:
        with open(target, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return "Backup error: " + str(e), 404

@app.route("/health")
def health():
    return jsonify({"status":"ok","build":"SB-4.7.19"})

if __name__ == "__main__":
    os.makedirs(os.path.join(os.path.dirname(__file__), "backups"), exist_ok=True)
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
`
  },
  {
    subPath: 'Dockerfile',
    content: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
`
  },
  {
    subPath: 'docker-compose.yml',
    content: `version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - JWT_SECRET=shadow-console-2026
      - FLASK_ENV=production
    restart: unless-stopped
`
  },
  {
    subPath: 'requirements.txt',
    content: `flask==3.0.0
gunicorn==21.2.0
requests==2.31.0
`
  },
  {
    subPath: 'README.md',
    content: `# Shadow Backup Internal Services Portal v4.7.19

Confidential internal portal for telemetry and backup staging.
All security anomalies should be filed with Collegiate Arena Ops.

Structure:
- \`/core\`: Internal cryptographic and pipeline mechanisms
- \`/src\`: Modular business logic, controllers, and utility helpers
- \`/templates\`: Portal UI layouts
- \`/static\`: Frontend scripts, styling, and static cache assets
- \`/backups\`: Snapshot archives and rotation logs
- \`/config\`: Environment configs and deployment definitions
`
  },

  // Backups section (with daily note and decoy)
  {
    subPath: 'backups/daily.txt',
    content: `Daily backup scheduled at 02:00 UTC.
Integrity verified: OK.
Note: Flag beacon moved to telemetry pipeline manifest repository for security compliance.
Legacy secret folder purged.
`
  },
  {
    subPath: 'backups/archive_2025/shadow_db.sql',
    content: `-- Shadow Database Dump v4.2.0
-- Generated on 2025-11-14
CREATE TABLE IF NOT EXISTS audit_cache (id INT PRIMARY KEY, token TEXT);
INSERT INTO audit_cache VALUES (1, 'logicCTF{n1c3_try_but_th1s_is_a_d3c0y_fl4g}');
INSERT INTO audit_cache VALUES (2, 'archive_signature_verified_2025');
`
  },
  {
    subPath: 'backups/legacy_snapshots/recovery_snapshot_v4.2.bak',
    content: `[RECOVERY SNAPSHOT HEADER]
Build: SB-4.2.11
Status: Archived
Checksum: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Log: System operational. All services green.
`
  },

  // Core modules
  {
    subPath: 'core/security/jwt_handler.py',
    content: `import hmac, hashlib, base64, json

def sign_payload(secret, payload):
    head = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=").decode()
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    sig = base64.urlsafe_b64encode(hmac.new(secret.encode(), f"{head}.{body}".encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return f"{head}.{body}.{sig}"
`
  },
  {
    subPath: 'core/security/firewall_rules.json',
    content: JSON.stringify({
      version: '2.4.0',
      allowed_inbound: ['80/tcp', '443/tcp', '5000/tcp'],
      blocked_subnets: ['10.254.0.0/16', '192.168.100.0/24'],
      telemetry_rate_limit: '120/minute',
      honeypot_trap: 'logicCTF{f4k3_fl4g_k33p_s34rch1ng_th3_m4z3}'
    }, null, 2)
  },
  {
    subPath: 'core/database/schema.sql',
    content: `CREATE TABLE IF NOT EXISTS telemetry_records (
    record_id TEXT PRIMARY KEY,
    timestamp INTEGER,
    sensor_id TEXT,
    payload_hash TEXT
);
`
  },
  {
    subPath: 'core/pipeline/worker_queue.py',
    content: `import time

class WorkerQueue:
    def __init__(self):
        self.queue = []

    def enqueue(self, task):
        self.queue.append({'task': task, 'time': time.time()})

    def process_all(self):
        while self.queue:
            item = self.queue.pop(0)
            # Process item
            pass
`
  },
  {
    subPath: 'core/pipeline/telemetry/processor.py',
    content: `import os

class TelemetryProcessor:
    def __init__(self):
        self.manifest_dir = os.path.join(os.path.dirname(__file__), "manifest")

    def load_manifest(self):
        target = os.path.join(self.manifest_dir, ".vault_flag.txt")
        if os.path.exists(target):
            with open(target, "r") as f:
                return f.read().strip()
        return None
`
  },

  // THE TRUE FLAG FILE:
  {
    subPath: 'core/pipeline/telemetry/manifest/.vault_flag.txt',
    content: `logicCTF{DPG_badmos}\n`
  },
  // Also keep the user's original flag in static/Secret/flag.txt for backwards compatibility
  {
    subPath: 'static/Secret/flag.txt',
    content: `logicCTF{DPG_badmos}\n`
  },

  // Templates
  {
    subPath: 'templates/index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shadow Backup Portal</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="container">
    <h1>Shadow Backup Node #09</h1>
    <p>Status: Online &bull; Operational Integrity Verified</p>
    <a href="/login">Operator Access &rarr;</a>
  </div>
</body>
</html>
`
  },
  {
    subPath: 'templates/login.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Operator Authentication</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <form method="POST" action="/login">
    <h2>Secure Gateway Login</h2>
    <input type="text" name="username" placeholder="Username" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit">Authenticate</button>
  </form>
</body>
</html>
`
  },
  {
    subPath: 'templates/admin.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>System Administration</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="admin-panel">
    <h1>System Administration Console</h1>
    <p>Welcome, {{ user }}</p>
    <a href="/admin/backup?file=daily.txt">Inspect Backup Ledger</a>
  </div>
</body>
</html>
`
  },
  {
    subPath: 'templates/maintenance.html',
    content: `<!DOCTYPE html>
<html>
<head><title>Maintenance</title></head>
<body>
  <!-- System Diagnostic Note: -->
  <!-- logicCTF{d3c0y_fl4g_c0mm3nt_b41t} -->
  <h1>Scheduled Maintenance Window</h1>
  <p>All archive rotations are currently locked.</p>
</body>
</html>
`
  },

  // Static Assets
  {
    subPath: 'static/style.css',
    content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0d1117;
  color: #c9d1d9;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.container {
  background: #161b22;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid #30363d;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  text-align: center;
}
a {
  color: #58a6ff;
  text-decoration: none;
}
`
  },
  {
    subPath: 'static/js/app.js',
    content: `// Telemetry ping
console.log("Shadow Portal Client v4.7.19 Initialized");
fetch('/health').then(r => r.json()).then(console.log);
`
  },
  {
    subPath: 'static/assets/cache/.metadata.json',
    content: JSON.stringify({
      cache_id: 'c94f1082ae',
      created: 1789309900,
      manifest_hash: '9a8b7c6d5e4f',
      note: 'Recovery files stored in core telemetry pipeline.'
    }, null, 2)
  },

  // Configuration files
  {
    subPath: 'config/production.json',
    content: JSON.stringify({
      app_name: 'ShadowBackup',
      environment: 'production',
      port: 5000,
      debug: false,
      telemetry: {
        enabled: true,
        endpoint: 'https://telemetry.internal.logic-ctf.local/collect',
        sample_rate: 1.0
      },
      decoy_vault: 'logicCTF{al0st_th3r3_but_wr0ng_c0nf1g}'
    }, null, 2)
  },
  {
    subPath: 'config/nginx/nginx.conf',
    content: `server {
    listen 80;
    server_name shadow.internal;

    location /static {
        alias /app/static;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
`
  },

  // Src utility modules
  {
    subPath: 'src/utils/sanitizer.py',
    content: `def sanitize_input(val):
    if not isinstance(val, str):
        return ""
    return val.replace("'", "''").strip()
`
  },
  {
    subPath: 'src/controllers/report_controller.py',
    content: `class ReportController:
    def __init__(self, db_conn):
        self.db = db_conn

    def get_summary(self):
        return {"reports_count": 12, "last_audit": "2026-09-14"}
`
  },
  {
    subPath: 'tests/test_basic.py',
    content: `import unittest

class BasicSanityTest(unittest.TestCase):
    def test_arithmetic(self):
        self.assertEqual(1 + 1, 2)

if __name__ == '__main__':
    unittest.main()
`
  }
];

// Write to each target directory
for (const targetDir of targetDirs) {
  try {
    console.log(`Writing maze files to: ${targetDir}`);
    for (const f of mazeFiles) {
      const fullPath = path.join(targetDir, f.subPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, f.content, 'utf8');
    }
    console.log(`Successfully populated ${mazeFiles.length} maze entries in ${targetDir}`);
  } catch (err) {
    console.error(`Warning writing to ${targetDir}:`, err.message);
  }
}

// Compress to challenge_05_source_maze.zip inside challenge_files
const sourceDir = path.join(__dirname, 'challenge_files', 'source_maze');
const zipOutput = path.join(__dirname, 'challenge_files', 'challenge_05_source_maze.zip');

try {
  if (fs.existsSync(zipOutput)) {
    fs.unlinkSync(zipOutput);
  }
  console.log(`Compressing ${sourceDir} to ${zipOutput}...`);
  execSync(`powershell -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${zipOutput}' -Force"`);
  console.log(`Successfully created ZIP: ${zipOutput} (${fs.statSync(zipOutput).size} bytes)`);
} catch (e) {
  console.error('Error creating ZIP archive:', e.message);
}
