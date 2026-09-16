from flask import Flask, request, render_template, jsonify, make_response
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
