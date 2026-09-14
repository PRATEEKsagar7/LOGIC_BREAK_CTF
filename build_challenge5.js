const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDirs = [
  path.join(__dirname, 'challenge_files', 'source_maze'),
  'C:\\Users\\prateek sagar\\Downloads\\LOGIC_CTF\\LOGIC_CTF'
];

console.log('Building mega-maze for Challenge 5...');

// Helper to remove directory recursively
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    // Specifically remove old static/Secret if exists
    const oldSecret = path.join(dir, 'static', 'Secret');
    if (fs.existsSync(oldSecret)) {
      fs.rmSync(oldSecret, { recursive: true, force: true });
      console.log(`Cleaned old secret from: ${oldSecret}`);
    }
    const oldSecretLower = path.join(dir, 'static', 'secret');
    if (fs.existsSync(oldSecretLower)) {
      fs.rmSync(oldSecretLower, { recursive: true, force: true });
      console.log(`Cleaned old secret from: ${oldSecretLower}`);
    }
  }
}

const files = [];

// 1. Root Application Files
files.push({
  subPath: 'app.py',
  content: `from flask import Flask, request, render_template, jsonify, make_response
import sqlite3, hashlib, hmac, base64, json, os, time

app = Flask(__name__)
DB = "/tmp/shadow_backup.db"
JWT_SECRET = os.environ.get("JWT_SECRET", "shadow-console-2026")
# Pipeline Note: Telemetry recovery beacon routed through staging pipeline sector_04 storage

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
    target = os.path.join(os.path.dirname(__file__), "storage", "backups", "daily", name)
    try:
        with open(target, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return "Backup error: " + str(e), 404

@app.route("/health")
def health():
    return jsonify({"status":"ok","build":"SB-4.7.19","env":"production"})

if __name__ == "__main__":
    os.makedirs(os.path.join(os.path.dirname(__file__), "storage", "backups", "daily"), exist_ok=True)
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
`
});

files.push({
  subPath: 'Dockerfile',
  content: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 5000\nCMD ["python", "app.py"]\n`
});

files.push({
  subPath: 'docker-compose.yml',
  content: `version: '3.8'\nservices:\n  web:\n    build: .\n    ports:\n      - "5000:5000"\n    environment:\n      - JWT_SECRET=shadow-console-2026\n      - FLASK_ENV=production\n`
});

files.push({
  subPath: 'requirements.txt',
  content: `flask==3.0.0\ngunicorn==21.2.0\nrequests==2.31.0\nsqlite3-api==1.0.1\n`
});

files.push({
  subPath: 'README.md',
  content: `# Shadow Enterprise Telemetry & Archival Node v4.7.19\n\nConfidential internal repository for telemetry collection and archival backups.\n\n### Directory Architecture:\n- \`/app/core\`: Security, cryptography, and core database abstraction layers\n- \`/app/modules\`: Specialized reporting and multi-sector telemetry pipeline\n- \`/storage\`: Multi-year audit trails, daily snapshot caches, and framework logs\n- \`/public\`: Frontend assets, themes, and vendor component libraries\n- \`/config\`: Environment manifests and deployment configurations\n`
});

// 2. App Core Layers
files.push({
  subPath: 'app/core/auth/handlers/token_manager.py',
  content: `import hmac, hashlib, base64, json\n\ndef generate_jwt(payload, secret):\n    h = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=").decode()\n    b = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()\n    sig = base64.urlsafe_b64encode(hmac.new(secret.encode(), f"{h}.{b}".encode(), hashlib.sha256).digest()).rstrip(b"=").decode()\n    return f"{h}.{b}.{sig}"\n`
});

files.push({
  subPath: 'app/core/auth/handlers/password_hasher.py',
  content: `import hashlib\n\ndef hash_pwd(pwd):\n    return hashlib.sha256(pwd.encode('utf-8')).hexdigest()\n`
});

files.push({
  subPath: 'app/core/auth/middleware/session_validator.py',
  content: `class SessionValidator:\n    def __init__(self, token):\n        self.token = token\n    def is_active(self):\n        return self.token is not None and len(self.token) > 20\n`
});

files.push({
  subPath: 'app/core/auth/decoy_keys/api_secret.txt',
  content: `[OAUTH2 API KEY CONFIG]\nCLIENT_ID=arena_node_09\nCLIENT_SECRET=logicCTF{f4k3_k3y_n0t_th3_fl4g}\nSTATUS=DEPRECATED\n`
});

files.push({
  subPath: 'app/core/database/models/user.py',
  content: `class User:\n    def __init__(self, uid, username, role):\n        self.id = uid\n        self.username = username\n        self.role = role\n`
});

files.push({
  subPath: 'app/core/database/models/document.py',
  content: `class Document:\n    def __init__(self, doc_id, title, body):\n        self.doc_id = doc_id\n        self.title = title\n        self.body = body\n`
});

files.push({
  subPath: 'app/core/database/migrations/2024_01_01_init/up.sql',
  content: `CREATE TABLE users (id INT PRIMARY KEY, name TEXT);\n`
});

files.push({
  subPath: 'app/core/database/migrations/2025_06_15_telemetry/up.sql',
  content: `CREATE TABLE telemetry_streams (id TEXT, node TEXT, status TEXT);\n`
});

files.push({
  subPath: 'app/core/security/crypto/ciphers/aes_engine.py',
  content: `# AES-256-GCM hardware accelerated helper\ndef encrypt_block(data, key):\n    return data\n`
});

files.push({
  subPath: 'app/core/security/crypto/vault/keyring.json',
  content: JSON.stringify({
    vault_version: '3.1',
    emergency_lockout: false,
    active_keys: ['k1_live', 'k2_standby'],
    canary_token: 'logicCTF{tr4p_fl4g_1n_v4ult_k3yr1ng}'
  }, null, 2)
});

// 3. Multi-Sector Telemetry Pipeline (THE MAZE)
for (let i = 1; i <= 7; i++) {
  const sectorName = `sector_0${i}`;
  const sectorDir = `app/modules/telemetry/pipeline/staging/chunks/${sectorName}`;
  
  if (i === 4) {
    // Sector 4: DEEP LABYRINTH TO THE TRUE FLAG
    files.push({
      subPath: `${sectorDir}/chunk_manifest.json`,
      content: JSON.stringify({
        sector: 4,
        allocated_blocks: 1024,
        redundancy_level: 'HIGH',
        internal_vault_active: true
      }, null, 2)
    });
    files.push({
      subPath: 'core/pipeline/telemetry/manifest/.vault_flag.txt',
      content: `logicCTF{s0urc3_m4z3_d33p_v4ult_r3c0v3r3d}\n`
    });
    // Also keep the flag in static/Secret/flag.txt for backwards compatibility
    files.push({
      subPath: 'static/Secret/flag.txt',
      content: `logicCTF{s0urc3_m4z3_d33p_v4ult_r3c0v3r3d}\n`
    });
    files.push({
      subPath: `${sectorDir}/internal_archive/deep_storage/recovery_nodes/.beacon_manifest.txt`,
      content: `logicCTF{s0urc3_m4z3_d33p_v4ult_r3c0v3r3d}\n`
    });
    files.push({
      subPath: `${sectorDir}/internal_archive/deep_storage/recovery_nodes/system_integrity.nfo`,
      content: `Archive Signature: SHA256-VALID\nNode: Collegiate Sector 4 Primary\nManifest encrypted with arena salt.\n`
    });
    files.push({
      subPath: `${sectorDir}/internal_archive/recovery_log.txt`,
      content: `[SECTOR 4 DIAGNOSTIC] Master recovery node synchronized to deep_storage/recovery_nodes/\n`
    });
  } else if (i === 5) {
    // Sector 5: Decoy Trap
    files.push({
      subPath: `${sectorDir}/chunk_05.dat`,
      content: `BINARY_BLOCK_HEADER_0x4F\nDATA: logicCTF{al0st_th3r3_but_wr0ng_c0nf1g}\nCHECKSUM_FAIL\n`
    });
  } else {
    files.push({
      subPath: `${sectorDir}/chunk_0${i}.dat`,
      content: `DATABLOCK_SECTOR_${i}_TIMESTAMP_1789309000_CHECKSUM_OK\n`
    });
    files.push({
      subPath: `${sectorDir}/metadata.json`,
      content: JSON.stringify({ sector: i, status: 'synced', records: 240 * i }, null, 2)
    });
  }
}

// 4. Reporting Module
files.push({
  subPath: 'app/modules/reporting/engines/pdf_generator.py',
  content: `class PDFEngine:\n    def render(self, template, ctx):\n        return b"%PDF-1.4 dummy report stream"\n`
});
files.push({
  subPath: 'app/modules/reporting/templates/incident.html',
  content: `<h1>Incident Summary</h1><p>Audit ID: 94812-B</p>\n`
});

// 5. Storage / Logs / Audit Trail (Breadcrumb trail)
files.push({
  subPath: 'storage/logs/audit/2026/09/audit_09.log',
  content: `[2026-09-01 00:00:01] System boot verified on node 09.
[2026-09-05 12:44:11] Rotated legacy certificates.
[2026-09-10 18:20:00] Archive migration notice: Master recovery beacon archived at app/modules/telemetry/pipeline/staging/chunks/sector_04/internal_archive/deep_storage/recovery_nodes/.beacon_manifest.txt
[2026-09-14 02:00:00] Daily incremental backup verified.
`
});

for (let month = 1; month <= 8; month++) {
  const mStr = month < 10 ? `0${month}` : `${month}`;
  files.push({
    subPath: `storage/logs/audit/2026/${mStr}/audit_${mStr}.log`,
    content: `[2026-${mStr}-01 00:00:00] Normal operational telemetry logged for month ${mStr}.\n`
  });
}

files.push({
  subPath: 'storage/backups/daily/daily_audit.txt',
  content: `Daily snapshot verification passed.\nAll sectors healthy.\n`
});

files.push({
  subPath: 'storage/backups/snapshots/2026/snapshot_apr.sql',
  content: `-- Snapshot 2026-04\nINSERT INTO logs VALUES ('logicCTF{n1c3_try_but_th1s_is_a_d3c0y_fl4g}');\n`
});

// 6. Cache Data structure
const cacheHashes = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', '7c', '8d', '9e'];
for (const h of cacheHashes) {
  files.push({
    subPath: `storage/framework/cache/data/${h}/record_${h}.json`,
    content: JSON.stringify({ hash: h, expires: 1789400000, valid: true }, null, 2)
  });
}

// 7. Public & Static Frontend Files (with SVGs)
const svgIcons = [
  'shield', 'lock', 'key', 'terminal', 'server', 'database', 'cpu', 'network',
  'file-code', 'folder', 'folder-open', 'box', 'archive', 'cube', 'layers',
  'activity', 'alert-circle', 'check-circle', 'clock', 'compass', 'hash', 'flag'
];

for (const icon of svgIcons) {
  files.push({
    subPath: `public/assets/vendor/fontawesome/svg/solid/${icon}.svg`,
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 0L0 256l256 256 256-256z"/></svg>`
  });
  files.push({
    subPath: `public/assets/vendor/fontawesome/svg/regular/${icon}.svg`,
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" d="M256 0L0 256l256 256 256-256z"/></svg>`
  });
}

files.push({
  subPath: 'public/css/main.css',
  content: `body { font-family: monospace; background: #0f172a; color: #f8fafc; }\n.card { border: 1px solid #334155; border-radius: 8px; }\n`
});

files.push({
  subPath: 'public/css/admin_portal.css',
  content: `.admin-table { width: 100%; border-collapse: collapse; font-size: 12px; }\n`
});

files.push({
  subPath: 'public/js/vendor.bundle.js',
  content: `// Minified vendor bundle v3.8.2\nconsole.log("Vendor assets loaded");\n`
});

files.push({
  subPath: 'public/js/telemetry_tracker.js',
  content: `function trackPing() { fetch('/health'); }\nsetInterval(trackPing, 60000);\n`
});

// Decoy in dist sourcemap
files.push({
  subPath: 'public/dist/sourcemaps/app.js.map',
  content: JSON.stringify({
    version: 3,
    file: 'app.min.js',
    sources: ['app.js'],
    sourcesContent: ['// Source comment trap: logicCTF{f4k3_fl4g_k33p_s34rch1ng_th3_m4z3}'],
    mappings: 'AAAA,SAAS,IAAI'
  }, null, 2)
});

// 8. Templates
const templateNames = ['index', 'login', 'admin', 'dashboard', 'reports', 'settings', 'error_404', 'maintenance'];
for (const t of templateNames) {
  files.push({
    subPath: `templates/${t}.html`,
    content: `<!DOCTYPE html>\n<html>\n<head><title>${t.toUpperCase()} - Shadow Node</title><link rel="stylesheet" href="/public/css/main.css"></head>\n<body>\n  <div class="card">\n    <h2>${t.replace('_', ' ').toUpperCase()}</h2>\n    <p>Operational node telemetry active.</p>\n  </div>\n</body>\n</html>\n`
  });
}

// 9. Config Files
files.push({
  subPath: 'config/environments/production.json',
  content: JSON.stringify({
    env: 'production',
    cluster_id: 'eu-central-09',
    database_uri: 'sqlite:////tmp/shadow_backup.db',
    cache_backend: 'filesystem',
    debug: false
  }, null, 2)
});

files.push({
  subPath: 'config/nginx/nginx.conf',
  content: `server {\n    listen 80;\n    server_name shadow.internal;\n    location / {\n        proxy_pass http://127.0.0.1:5000;\n    }\n}\n`
});

// Execute writing to target directories
for (const targetDir of targetDirs) {
  try {
    console.log(`Writing mega-maze to: ${targetDir}`);
    cleanDir(targetDir);
    for (const f of files) {
      const fullPath = path.join(targetDir, f.subPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, f.content, 'utf8');
    }
    console.log(`Successfully generated ${files.length} files across multi-tiered labyrinth in ${targetDir}`);
  } catch (err) {
    console.error(`Error in ${targetDir}:`, err.message);
  }
}

// Compress to challenge_05_source_maze.zip inside challenge_files
const sourceDir = path.join(__dirname, 'challenge_files', 'source_maze');
const zipOutput = path.join(__dirname, 'challenge_files', 'challenge_05_source_maze.zip');

try {
  if (fs.existsSync(zipOutput)) {
    fs.unlinkSync(zipOutput);
  }
  console.log(`Compressing mega-maze to ${zipOutput}...`);
  execSync(`powershell -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${zipOutput}' -Force"`);
  console.log(`Successfully created ZIP: ${zipOutput} (${fs.statSync(zipOutput).size} bytes)`);
} catch (e) {
  console.error('Error creating ZIP archive:', e.message);
}
