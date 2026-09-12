/**
 * Logic Break CTF - Collegiate Security Arena Backend Server
 * Zero-dependency Node.js HTTP Server with Real-Time SSE Leaderboard Auto-Sync
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'ctf_data.json');

// Hardcoded Admin Credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'logicbreak_admin_2026',
  backupPassword: 'admin123'
};
const ADMIN_TOKEN = 'logicbreak_admin_token_active_session_2026';

// 12 Realistic Logic Break CTF Challenges
// First 7 challenges (Tier 1): +50 pts solve, -15 pts penalty on wrong
// Challenges 8-12 (Tier 2): +100 pts solve, -25 pts penalty on wrong
const INITIAL_CHALLENGES = [
  {
    id: 'ch1',
    number: 1,
    title: 'Limit Break',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Create a new project after reaching the maximum project limit.',
    hints: [
      'The Create button is not the only way to create a project.'
    ],
    file: 'projects.html',
    codeSnippet: '// Standard creation enforces limit:\nif (projects.length >= MAX_PROJECTS) showToast("Project limit reached");\n\n// Duplication flaw: missing quota check!',
    flag: 'logicCTF{pr0j3ct_l1m1t_byp4ss_dupl1c4t3}'
  },
  {
    id: 'ch2',
    number: 2,
    title: 'Cipher Nexus',
    category: 'Cryptography',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'A critical command message was captured over radio telemetry. It was scrambled with a repeating multi-byte XOR cipher.',
    hints: [
      'The repeating key is 4 bytes ASCII: "~lnc" (0x7E 0x6C 0x6E 0x63).',
      'Use CyberChef or Python to XOR the hex bytes with the key and decode the flag.'
    ],
    file: 'challenge_02_cipher.txt',
    codeSnippet: 'key = b"~lnc"\nwith open("challenge_02_cipher.txt") as f: ...\ndecrypted = bytes([b ^ key[i % len(key)] for i, b in enumerate(ciphertext)])',
    flag: 'logicCTF{x0r_c1ph3r_b4s364_cr4ck3d}'
  },
  {
    id: 'ch3',
    number: 3,
    title: 'Packet Sniffer',
    category: 'Network Security',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'An unencrypted internal management session was intercepted. Locate the administrator credentials in the stream.',
    hints: [
      'Search for HTTP Basic Authentication header "Authorization: Basic ..."',
      'Base64 decode the authentication credentials to extract the password flag.'
    ],
    file: 'challenge_03_network.pcap.txt',
    codeSnippet: 'GET /admin/auth.php HTTP/1.1\nAuthorization: Basic YWRtaW46cDRjazN0X3NuMWZmM3JfY3IzZHNfbDM0aw==',
    flag: 'logicCTF{p4ck3t_sn1ff3r_cr3ds_l34k}'
  },
  {
    id: 'ch4',
    number: 4,
    title: 'Logic Gate Bypass',
    category: 'Reverse Engineering',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'A client-side JavaScript vault validates activation license keys. Reverse the verification algorithm.',
    hints: [
      'Open the challenge script in browser DevTools or node.js.',
      'Convert the charCode array enc into ASCII characters via String.fromCharCode(...).'
    ],
    file: 'challenge_04_vault.js',
    codeSnippet: 'function verifyKey(input) {\n  const enc = [108, 111, 103, 105, 99, 67, 84, 70, 123, ...];\n  // Convert enc to string to reveal the secret key!\n}',
    flag: 'logicCTF{cl13nt_s1d3_auth_1s_n0t_s4f3}'
  },
  {
    id: 'ch5',
    number: 5,
    title: 'Cookie Monster',
    category: 'Web Security',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'A telemetry session cookie is signed with a weak JWT HMAC secret. Forge an administrative token.',
    hints: [
      'The signature HMAC secret is a standard dictionary word: "secret123".',
      'Change "role": "guest" to "role": "admin" and re-sign the JWT payload.'
    ],
    file: 'challenge_05_jwt_token.txt',
    codeSnippet: 'JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvcGVyYXRpdmVfMDkiLCJyb2xlIjoiZ3Vlc3QifQ...',
    flag: 'logicCTF{jwt_s3cr3t_brut3f0rc3_2026}'
  },
  {
    id: 'ch6',
    number: 6,
    title: 'SQL Infiltration',
    category: 'Database Security',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Bypass collegiate database authentication using classical SQL injection and extract the secret vault record.',
    hints: [
      'Input string is concatenated directly without sanitization: SELECT * FROM users WHERE user=\'$input\'',
      'Use UNION SELECT secret_type, secret_value FROM secret_vault--'
    ],
    file: 'challenge_06_sqli_dump.sql',
    codeSnippet: 'SELECT * FROM users WHERE username=\'\' OR 1=1 UNION SELECT 1, secret_value FROM secret_vault--',
    flag: 'logicCTF{sql1_un10n_s3l3ct_4dm1n_fl4g}'
  },
  {
    id: 'ch7',
    number: 7,
    title: 'Hidden in Plain Byte',
    category: 'Forensics',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'A surveillance operative encoded an emergency beacon flag inside PNG metadata EXIF headers.',
    hints: [
      'Check PNG tEXt chunks or use exiftool / strings on the image file.',
      'Decode the hex-encoded string found in the metadata comment field.'
    ],
    file: 'challenge_07_stego_secret.txt',
    codeSnippet: '$ strings avatar_recon.png | grep logicCTF\n# or decode hex chunk: 6c6f676963435446...',
    flag: 'logicCTF{st3g0_m3t4d4t4_h1dd3n_fl4g}'
  },
  // TIER 2 CHALLENGES (HARD / ELITE: +100 PTS SOLVE, -25 PTS PENALTY)
  {
    id: 'ch8',
    number: 8,
    title: 'Kernel Panic',
    category: 'Binary Exploitation',
    difficulty: 'Advanced',
    tier: 2,
    points: 100,
    penalty: 25,
    description: 'Analyze an x86-64 ELF binary with an unsafe gets() call. Smash the stack frame to redirect execution to win().',
    hints: [
      'Buffer is 64 bytes. Find the offset to the Return Address (72 bytes on x86_64).',
      'Overwrite RIP with the address of win() to trigger the flag dump.'
    ],
    file: 'challenge_08_buffer_overflow.c',
    codeSnippet: 'char buffer[64];\ngets(buffer); // Stack buffer overflow allows RIP hijacking to win()',
    flag: 'logicCTF{b1n4ry_0v3rfl0w_r3t2l1bc_pwnd}'
  },
  {
    id: 'ch9',
    number: 9,
    title: 'Quantum RSA',
    category: 'Cryptography',
    difficulty: 'Advanced',
    tier: 2,
    points: 100,
    penalty: 25,
    description: 'An RSA public key was generated using weak, small prime factors vulnerable to Pollard rho / Fermat factorization.',
    hints: [
      'Modulus N factors into primes p and q. Calculate phi = (p-1)*(q-1).',
      'Compute private exponent d = pow(e, -1, phi) and decrypt the ciphertext payload.'
    ],
    file: 'challenge_09_rsa_keys.pem',
    codeSnippet: 'p = 104729; q = 879791\nphi = (p - 1) * (q - 1)\nd = pow(65537, -1, phi)\nm = pow(c, d, n)',
    flag: 'logicCTF{sm4ll_pr1m3_f4ct0r1z4t10n_rs4}'
  },
  {
    id: 'ch10',
    number: 10,
    title: 'Zero-Day Memory Dump',
    category: 'Forensics',
    difficulty: 'Expert',
    tier: 2,
    points: 100,
    penalty: 25,
    description: 'Inspect a physical memory crash dump to detect process hollowed malware in svchost and extract decrypted shellcode.',
    hints: [
      'Run Volatility 3: python3 vol.py -f memory.raw windows.malfind',
      'Inspect VadS memory permissions (PAGE_EXECUTE_READWRITE) on PID 4192.'
    ],
    file: 'challenge_10_memory_dump.raw.txt',
    codeSnippet: 'volatility -f memory.raw --profile=Win10x64 malfind -p 4192 -D dump_dir/',
    flag: 'logicCTF{m3m0ry_f0r3ns1cs_v0l4t1l1ty_d1sc0v3r3d}'
  },
  {
    id: 'ch11',
    number: 11,
    title: 'Decoupled Shadow API',
    category: 'Cloud Security',
    difficulty: 'Expert',
    tier: 2,
    points: 100,
    penalty: 25,
    description: 'Leverage a blind Server-Side Request Forgery (SSRF) flaw to query the link-local AWS metadata service at 169.254.169.254.',
    hints: [
      'Access /proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/',
      'Retrieve temporary STS credentials containing the token flag.'
    ],
    file: 'challenge_11_shadow_api.json',
    codeSnippet: 'GET /proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ArenaWorkerRole HTTP/1.1',
    flag: 'logicCTF{ssrf_cl0ud_m3t4d4t4_cr3ds_pwn}'
  },
  {
    id: 'ch12',
    number: 12,
    title: 'The Root of All Evil',
    category: 'Privilege Escalation',
    difficulty: 'Expert',
    tier: 2,
    points: 100,
    penalty: 25,
    description: 'A custom root backup agent has SUID bit enabled and executes tar without an absolute path. Hijack the binary search path.',
    hints: [
      'Check SUID binaries: find / -perm -u=s -type f 2>/dev/null',
      'Create a malicious executable named "tar" in /tmp and prepend /tmp to your PATH variable.'
    ],
    file: 'challenge_12_privesc_suid.sh',
    codeSnippet: 'echo "/bin/sh" > /tmp/tar && chmod +x /tmp/tar\nexport PATH=/tmp:$PATH\n/usr/local/bin/backup_agent',
    flag: 'logicCTF{su1d_pr1v1l3g3_3sc4l4t10n_r00t}'
  }
];

// Default Initial Collegiate Teams
const INITIAL_TEAMS = [
  { id: 't1', name: 'Null Vector', college: 'Technova University', score: 350, solved: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'], penalties: 0, lastSolve: Date.now() - 1200000 },
  { id: 't2', name: 'Byte Raiders', college: 'Nexus Institute', score: 285, solved: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'], penalties: 1, lastSolve: Date.now() - 1500000 },
  { id: 't3', name: 'Root Squad', college: 'National Cyber Academy', score: 250, solved: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'], penalties: 0, lastSolve: Date.now() - 1800000 },
  { id: 't4', name: 'Cyber Phantoms', college: 'Apex Polytechnic', score: 185, solved: ['ch1', 'ch2', 'ch3', 'ch4'], penalties: 1, lastSolve: Date.now() - 2400000 },
  { id: 't5', name: 'Kernel Panic', college: 'Metro Cyber College', score: 135, solved: ['ch1', 'ch2', 'ch3'], penalties: 1, lastSolve: Date.now() - 3000000 },
  { id: 't6', name: 'Bit Shifters', college: 'Vanguard Tech Institute', score: 85, solved: ['ch1', 'ch2'], penalties: 1, lastSolve: Date.now() - 3600000 },
  { id: 't7', name: 'Zero Day Cell', college: 'Pacific State University', score: 50, solved: ['ch1'], penalties: 0, lastSolve: Date.now() - 4200000 },
  { id: 't8', name: 'Logic Breakers', college: 'Host College Collective', score: 0, solved: [], penalties: 0, lastSolve: 0 }
];

// Persistent state
let ctfState = {
  teams: INITIAL_TEAMS,
  submissions: [
    { id: 's1', team: 'Null Vector', challengeId: 'ch1', challengeTitle: 'Ghost Protocol', status: 'CORRECT', delta: '+50', timestamp: Date.now() - 1200000 },
    { id: 's2', team: 'Byte Raiders', challengeId: 'ch4', challengeTitle: 'Logic Gate Bypass', status: 'CORRECT', delta: '+50', timestamp: Date.now() - 1500000 },
    { id: 's3', team: 'Kernel Panic', challengeId: 'ch4', challengeTitle: 'Logic Gate Bypass', status: 'INCORRECT', delta: '-15', timestamp: Date.now() - 1600000 }
  ]
};

// Load saved state if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (saved.teams && saved.submissions) {
      ctfState = saved;
      console.log(`[CTF Server] Loaded persisted state with ${ctfState.teams.length} teams.`);
    }
  } catch (err) {
    console.error('[CTF Server] Error reading persisted state, using defaults.', err.message);
  }
}

function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(ctfState, null, 2), 'utf8');
  } catch (err) {
    console.error('[CTF Server] Failed to save state:', err.message);
  }
}

// SSE Active Connections Set
const sseClients = new Set();

function broadcastSSE(data) {
  const payload = `event: message\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

// Heartbeat every 25s
setInterval(() => {
  for (const res of sseClients) {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      sseClients.delete(res);
    }
  }
}, 25000);

// Helper: Parse JSON Body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper: MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=UTF-8',
  '.md': 'text/markdown; charset=UTF-8',
  '.sh': 'text/plain; charset=UTF-8',
  '.c': 'text/plain; charset=UTF-8',
  '.pem': 'text/plain; charset=UTF-8',
  '.sql': 'text/plain; charset=UTF-8'
};

// Create Server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;

  // ==========================================
  // REAL-TIME AUTO-SYNC SSE STREAM
  // ==========================================
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });
    res.write(': connected\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // ==========================================
  // API: GET CHALLENGES
  // ==========================================
  if (pathname === '/api/challenges' && req.method === 'GET') {
    const teamName = parsedUrl.searchParams.get('team') || '';
    const team = ctfState.teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
    const solvedSet = new Set(team ? team.solved : []);

    const sanitizedChallenges = INITIAL_CHALLENGES.map(ch => ({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      category: ch.category,
      difficulty: ch.difficulty,
      tier: ch.tier,
      points: ch.points,
      penalty: ch.penalty,
      description: ch.description,
      hintsCount: ch.hints.length,
      file: ch.file,
      codeSnippet: ch.codeSnippet,
      isSolved: solvedSet.has(ch.id)
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, challenges: sanitizedChallenges }));
    return;
  }

  // ==========================================
  // API: GET CHALLENGE HINT
  // ==========================================
  if (pathname.startsWith('/api/hint/') && req.method === 'GET') {
    const challengeId = pathname.split('/')[3];
    const ch = INITIAL_CHALLENGES.find(c => c.id === challengeId);
    if (!ch) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Challenge not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, hints: ch.hints, title: ch.title }));
    return;
  }

  // ==========================================
  // API: SUBMIT FLAG (WITH STRICT POINT SYSTEM)
  // ==========================================
  if (pathname === '/api/submit' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const teamName = (data.team || '').trim();
      const challengeId = (data.challengeId || '').trim();
      const submittedFlag = (data.flag || '').trim();

      if (!teamName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Team identification is required.' }));
        return;
      }

      if (!challengeId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Challenge ID is required.' }));
        return;
      }

      if (!submittedFlag) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Flag cannot be empty. Example format: logicCTF{...}' }));
        return;
      }

      const challenge = INITIAL_CHALLENGES.find(c => c.id === challengeId);
      if (!challenge) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Challenge does not exist in this arena.' }));
        return;
      }

      // Find or dynamically register team
      let team = ctfState.teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
      if (!team) {
        team = {
          id: 't-' + Date.now(),
          name: teamName,
          college: data.college || 'Collegiate Collective',
          score: 0,
          solved: [],
          penalties: 0,
          lastSolve: 0
        };
        ctfState.teams.push(team);
      }

      // Check if already solved
      if (team.solved.includes(challenge.id)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          status: 'already_solved',
          message: `Challenge "${challenge.title}" was already solved by your team! No additional points awarded.`
        }));
        return;
      }

      // Check Flag (supports both new project bypass flag and legacy flag for ch1)
      const isCorrect = submittedFlag === challenge.flag ||
        (challenge.id === 'ch1' && (submittedFlag === 'logicCTF{pr0j3ct_l1m1t_byp4ss_dupl1c4t3}' || submittedFlag === 'logicCTF{gr4phql_1ntr0sp3ct10n_byp4ss}'));

      if (isCorrect) {
        // TIER 1: +50 PTS | TIER 2: +100 PTS
        team.solved.push(challenge.id);
        team.score += challenge.points;
        team.lastSolve = Date.now();

        const submissionLog = {
          id: 'sub-' + Date.now(),
          team: team.name,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          status: 'CORRECT',
          delta: `+${challenge.points}`,
          timestamp: Date.now()
        };
        ctfState.submissions.unshift(submissionLog);
        if (ctfState.submissions.length > 100) ctfState.submissions.pop();

        saveState();

        // Broadcast to all real-time connected clients
        broadcastSSE({
          type: 'FLAG_SOLVED',
          team: team.name,
          challengeTitle: challenge.title,
          pointsGained: challenge.points,
          newScore: team.score,
          timestamp: Date.now(),
          leaderboard: getSortedLeaderboard()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          status: 'correct',
          points: challenge.points,
          newScore: team.score,
          message: `🚩 FLAG CAPTURED! +${challenge.points} Points awarded for "${challenge.title}"!`
        }));
      } else {
        // TIER 1: -15 PTS PENALTY | TIER 2: -25 PTS PENALTY
        team.penalties = (team.penalties || 0) + 1;
        team.score = Math.max(0, team.score - challenge.penalty);

        const submissionLog = {
          id: 'sub-' + Date.now(),
          team: team.name,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          status: 'INCORRECT',
          delta: `-${challenge.penalty}`,
          timestamp: Date.now()
        };
        ctfState.submissions.unshift(submissionLog);
        if (ctfState.submissions.length > 100) ctfState.submissions.pop();

        saveState();

        // Broadcast penalty update
        broadcastSSE({
          type: 'FLAG_PENALTY',
          team: team.name,
          challengeTitle: challenge.title,
          penalty: challenge.penalty,
          newScore: team.score,
          timestamp: Date.now(),
          leaderboard: getSortedLeaderboard()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          status: 'incorrect',
          penalty: challenge.penalty,
          newScore: team.score,
          message: `❌ INCORRECT FLAG! -${challenge.penalty} Points penalty applied for failed attempt on "${challenge.title}".`
        }));
      }
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Server error processing flag: ' + err.message }));
      return;
    }
  }

  // ==========================================
  // API: LEADERBOARD GET
  // ==========================================
  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    const leaderboard = getSortedLeaderboard();
    const totalFlagsClaimed = ctfState.teams.reduce((acc, t) => acc + (t.solved ? t.solved.length : 0), 0);
    const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      totalTeams: ctfState.teams.length,
      totalFlagsClaimed,
      topScore,
      leaderboard,
      recentActivity: ctfState.submissions.slice(0, 15)
    }));
    return;
  }

  // ==========================================
  // API: GET / SET ACTIVE TEAMS
  // ==========================================
  if (pathname === '/api/teams' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      teams: ctfState.teams.map(t => ({
        id: t.id,
        name: t.name,
        college: t.college,
        score: t.score,
        solvedCount: t.solved ? t.solved.length : 0
      }))
    }));
    return;
  }

  // ==========================================
  // API: HARDCODED ADMIN LOGIN
  // ==========================================
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const creds = await parseJsonBody(req);
      const username = (creds.username || '').trim();
      const password = (creds.password || '').trim();

      const isValid = (username === ADMIN_CREDENTIALS.username) &&
                      (password === ADMIN_CREDENTIALS.password || password === ADMIN_CREDENTIALS.backupPassword);

      if (isValid) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token: ADMIN_TOKEN,
          adminUser: ADMIN_CREDENTIALS.username,
          message: 'Admin authorization granted. Master access active.'
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid administrative credentials. Access denied.'
        }));
      }
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Login processing error' }));
      return;
    }
  }

  // ==========================================
  // API: ADMIN SUBMISSION AUDIT LOG
  // ==========================================
  if (pathname === '/api/admin/submissions' && req.method === 'GET') {
    const authHeader = req.headers['x-admin-token'] || parsedUrl.searchParams.get('token');
    if (authHeader !== ADMIN_TOKEN) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Forbidden: Admin clearance required.' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      submissions: ctfState.submissions,
      rawFlags: INITIAL_CHALLENGES.map(c => ({ id: c.id, title: c.title, flag: c.flag, points: c.points, penalty: c.penalty }))
    }));
    return;
  }

  // ==========================================
  // API: ADMIN RESET ALL OR SINGLE TEAM
  // ==========================================
  if (pathname === '/api/admin/reset' && req.method === 'POST') {
    const authHeader = req.headers['x-admin-token'];
    if (authHeader !== ADMIN_TOKEN) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Forbidden' }));
      return;
    }
    const body = await parseJsonBody(req);
    if (body.type === 'ALL') {
      ctfState.teams.forEach(t => {
        t.score = 0;
        t.solved = [];
        t.penalties = 0;
        t.lastSolve = 0;
      });
      ctfState.submissions = [];
      saveState();
      broadcastSSE({ type: 'ARENA_RESET', leaderboard: getSortedLeaderboard() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'All scores and challenge submissions have been reset.' }));
      return;
    } else if (body.teamId) {
      const t = ctfState.teams.find(team => team.id === body.teamId);
      if (t) {
        t.score = 0;
        t.solved = [];
        t.penalties = 0;
        saveState();
        broadcastSSE({ type: 'TEAM_RESET', team: t.name, leaderboard: getSortedLeaderboard() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Reset score for team ${t.name}.` }));
        return;
      }
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Invalid reset target.' }));
    return;
  }

  // ==========================================
  // API: DOWNLOAD CHALLENGE FILES
  // ==========================================
  if (pathname.startsWith('/api/files/') || pathname.startsWith('/challenge_files/')) {
    const filename = path.basename(pathname);
    const safePath = path.join(__dirname, 'challenge_files', filename);
    if (fs.existsSync(safePath)) {
      const ext = path.extname(safePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      fs.createReadStream(safePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
  }

  // ==========================================
  // STATIC FILE SERVING & CLEAN ROUTING
  // ==========================================
  let reqPath = pathname;
  if (reqPath.toLowerCase().startsWith('/logic_ctf')) {
    reqPath = reqPath.slice('/logic_ctf'.length) || '/';
  }
  if (!reqPath || reqPath === '') reqPath = '/';

  // Convenient Route Aliases
  if (reqPath === '/overview' || reqPath === '/overview.html' || reqPath === '/index.html' || reqPath === '/') {
    reqPath = '/overview.html';
  } else if (reqPath === '/missions' || reqPath === '/missions.html' || reqPath === '/challenges') {
    reqPath = '/missions.html';
  } else if (reqPath === '/leaderboard' || reqPath === '/leaderboard.html' || reqPath === '/standings') {
    reqPath = '/leaderboard.html';
  } else if (reqPath === '/admin' || reqPath === '/admin.html' || reqPath === '/members') {
    reqPath = '/admin.html';
  } else if (reqPath === '/files' || reqPath === '/files.html' || reqPath === '/resources') {
    reqPath = '/files.html';
  } else if (reqPath === '/schedule' || reqPath === '/schedule.html') {
    reqPath = '/schedule.html';
  } else if (reqPath === '/reports' || reqPath === '/reports.html') {
    reqPath = '/reports.html';
  } else if (reqPath === '/workspace' || reqPath === '/workspace.html') {
    reqPath = '/workspace.html';
  } else if (reqPath === '/projects' || reqPath === '/projects.html') {
    reqPath = '/projects.html';
  } else if (reqPath === '/billing' || reqPath === '/billing.html') {
    reqPath = '/billing.html';
  } else if (reqPath === '/recycle_bin' || reqPath === '/recycle_bin.html') {
    reqPath = '/recycle_bin.html';
  }

  const filePath = path.join(__dirname, reqPath);

  // Security: Avoid directory traversal outside Logic_CTF
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`<!DOCTYPE html><html><head><title>404 Not Found</title><style>body{background:#0e1511;color:#5bdcae;font-family:sans-serif;padding:40px;text-align:center;}</style></head><body><h1>404 // RESOURCE UNREACHABLE</h1><p>The requested vector does not exist in the collegiate arena.</p><a href="/" style="color:#fff;text-decoration:underline;">Return to Arena Overview</a></body></html>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

function getSortedLeaderboard() {
  return [...ctfState.teams].map(team => ({
    id: team.id,
    name: team.name,
    college: team.college,
    score: team.score,
    solvedCount: team.solved ? team.solved.length : 0,
    solved: team.solved || [],
    penalties: team.penalties || 0,
    lastSolve: team.lastSolve || 0
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
    return a.lastSolve - b.lastSolve;
  });
}

let currentPort = Number(PORT);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[CTF Server] Port ${currentPort} is busy. Automatically switching to port ${currentPort + 1}...`);
    currentPort++;
    setTimeout(() => {
      server.listen(currentPort);
    }, 200);
  } else {
    console.error('[CTF Server] Fatal server error:', err);
  }
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`=======================================================`);
    console.log(`  LOGIC BREAK CTF // CYBERNEXUS COMMAND ARENA RUNNING  `);
    console.log(`  Local Gateway: http://localhost:${port}              `);
    console.log(`  Real-time SSE: http://localhost:${port}/api/events   `);
    console.log(`  Hardcoded Admin: admin / logicbreak_admin_2026        `);
    console.log(`=======================================================`);
  });
}

startServer(currentPort);
