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
    title: 'Export a report.',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: "The Reports page doesn't provide the export option you need. Find another place where the report can be handled.",
    hints: [
      'The same information can sometimes be available through another section.'
    ],
    file: 'reports.html',
    codeSnippet: '// The Reports page does not provide the export option you need.\n// Find another place where the report can be handled.',
    flag: 'logicCTF{purg3d_r3cycl3_b1n_csv_3xp0rt}'
  },
  {
    id: 'ch3',
    number: 3,
    title: 'Read Between the Lines.',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'The workspace description seems brief, but not everything recorded is immediately visible. Find a way to read the complete entry.',
    hints: [
      "The counter beneath the field tells a different story than what you see. Some containers aren't meant to stay small."
    ],
    file: 'workspace.html',
    codeSnippet: '// The briefing looks short at first glance.\n// Look closely at the details and find what is tucked away.',
    flag: 'logicCTF{t3xt4r34_r3s1z3_h1dd3n_buff3r_unl0ck}'
  },
  {
    id: 'ch4',
    number: 4,
    title: 'Restore a report.',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Direct access to the incident report is blocked by security controls. Find another way to inspect its verified details.',
    hints: [
      "Access to view the document is locked in the Reports ledger. Certain system rules reset when an artifact is purged and recovered from the archive vault."
    ],
    file: 'reports.html',
    codeSnippet: '// Direct inspection: Integrity check locked.\n// Archive recovery resets verification state and unlocks inspection.',
    flag: 'logicCTF{r3st0r3_purg3d_r3p0rt_int3gr1ty_unl0ck}'
  },
  {
    id: 'ch5',
    number: 5,
    title: 'The Source Code Maze',
    category: 'Forensics & Code Recon',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'A decommissioned telemetry server backup contains sensitive operational assets hidden within its nested repository tree. Sift through the maze of source files, templates, and configurations to extract the true operational flag.',
    hints: [
      'Inspect the application entrypoint in app.py to trace how recovery files are routed.',
      'Beware of decoy flags placed in database dumps and maintenance templates.'
    ],
    file: 'challenge_05_source_maze.zip',
    codeSnippet: '// Decommissioned Telemetry Node v4.7.19\n// Sift through the repository tree to find the genuine recovery beacon.\n// Flag Format: logicCTF{...}',
    flag: 'logicCTF{DPG_badmos}'
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

// Random Credential Generators
function generateRandomUserId(type = 'DUO') {
  const num = Math.floor(1000 + Math.random() * 9000);
  if (type === 'SOLO') return `SOLO-${num}`;
  if (type === 'DUO') return `DUO-${num}`;
  return `USER-${num}`;
}

function generateRandomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(10 + Math.random() * 90);
  return `Nexus#${rand}${digits}`;
}

// Confirmed Participants with Random Generated Credentials (Fake teams removed)
const INITIAL_PARTICIPANTS = [
  {
    id: 'usr_8319',
    userId: 'USER-8319',
    name: 'Cyber Strike',
    password: 'Nexus#4921',
    confirmed: true,
    college: 'Apex Cyber Institute',
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0
  },
  {
    id: 'usr_5172',
    userId: 'USER-5172',
    name: 'Vanguard Unit',
    password: 'Nexus#8834',
    confirmed: true,
    college: 'Technova University',
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0
  },
  {
    id: 'usr_9043',
    userId: 'USER-9043',
    name: 'Shadow Protocol',
    password: 'Nexus#1290',
    confirmed: true,
    college: 'National Defense Academy',
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0
  }
];

// Persistent state
let ctfState = {
  teams: INITIAL_PARTICIPANTS,
  submissions: [],
  purgedArtifacts: []
};

// Load saved state if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (saved.teams && saved.submissions) {
      ctfState = saved;
      ctfState.purgedArtifacts = ctfState.purgedArtifacts || [];
      console.log(`[CTF Server] Loaded persisted state with ${ctfState.teams.length} teams and ${ctfState.purgedArtifacts.length} purged artifacts.`);
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
    const team = ctfState.teams.find(t =>
      (t.name && t.name.toLowerCase() === teamName.toLowerCase()) ||
      (t.userId && t.userId.toUpperCase() === teamName.toUpperCase()) ||
      (t.partner1UserId && t.partner1UserId.toUpperCase() === teamName.toUpperCase()) ||
      (t.partner2UserId && t.partner2UserId.toUpperCase() === teamName.toUpperCase()) ||
      (t.id && t.id === teamName)
    );
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

      // Find confirmed participant
      let team = ctfState.teams.find(t =>
        (t.userId && t.userId.toUpperCase() === teamName.toUpperCase()) ||
        (t.partner1UserId && t.partner1UserId.toUpperCase() === teamName.toUpperCase()) ||
        (t.partner2UserId && t.partner2UserId.toUpperCase() === teamName.toUpperCase()) ||
        (t.name && t.name.toLowerCase() === teamName.toLowerCase()) ||
        (t.id && t.id === teamName)
      );
      if (!team) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Access Denied: Only confirmed registered participants may submit flags. Please log in.'
        }));
        return;
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

      // Check Flag (supports ch1 & ch2 & ch3 custom flags + legacy flags)
      const isCorrect = submittedFlag === challenge.flag ||
        (challenge.id === 'ch1' && (submittedFlag === 'logicCTF{pr0j3ct_l1m1t_byp4ss_dupl1c4t3}' || submittedFlag === 'logicCTF{gr4phql_1ntr0sp3ct10n_byp4ss}')) ||
        (challenge.id === 'ch2' && (submittedFlag === 'logicCTF{purg3d_r3cycl3_b1n_csv_3xp0rt}' || submittedFlag === 'logicCTF{x0r_c1ph3r_b4s364_cr4ck3d}')) ||
        (challenge.id === 'ch3' && (submittedFlag === 'logicCTF{t3xt4r34_r3s1z3_h1dd3n_buff3r_unl0ck}' || submittedFlag === 'logicCTF{p4ck3t_sn1ff3r_cr3ds_l34k}')) ||
        (challenge.id === 'ch4' && (submittedFlag === 'logicCTF{r3st0r3_purg3d_r3p0rt_int3gr1ty_unl0ck}' || submittedFlag === 'logicCTF{cl13nt_s1d3_auth_1s_n0t_s4f3}')) ||
        (challenge.id === 'ch5' && (submittedFlag === 'logicCTF{DPG_badmos}' || submittedFlag === 'logicCTF{jwt_s3cr3t_brut3f0rc3_2026}'));

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

        const isFakeFlag = submittedFlag.toUpperCase().includes('FAKE_FLAG') ||
          submittedFlag.includes('d3c0y') || submittedFlag.includes('k33p_s34rch1ng') || submittedFlag.includes('wr0ng_c0nf1g') || submittedFlag.includes('n1c3_try');
        const penaltyMsg = isFakeFlag
          ? `🚨 DECOY FLAG TRIGGERED! You fell for an archive decoy trap. -${challenge.penalty} PTS Penalty applied!`
          : `❌ INCORRECT FLAG! -${challenge.penalty} Points penalty applied for failed attempt on "${challenge.title}".`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          status: 'incorrect',
          penalty: challenge.penalty,
          newScore: team.score,
          message: penaltyMsg
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
  // API: PARTICIPANT & ADMIN UNIFIED LOGIN
  // ==========================================
  if (pathname === '/api/login' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const usernameInput = (data.userId || data.username || '').trim();
      const passwordInput = (data.password || '').trim();

      if (!usernameInput || !passwordInput) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'User ID / Username and Password are required.' }));
        return;
      }

      // Check Admin Credentials
      if (usernameInput === ADMIN_CREDENTIALS.username &&
          (passwordInput === ADMIN_CREDENTIALS.password || passwordInput === ADMIN_CREDENTIALS.backupPassword)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          isAdmin: true,
          token: ADMIN_TOKEN,
          user: { name: 'Admin Coordinator', userId: 'ADMIN' },
          redirect: 'admin.html',
          message: 'Admin authorization granted. Welcome Coordinator.'
        }));
        return;
      }

      // Check Confirmed Participant Credentials (supports squad ID, partner aliases -A/-B, or team name)
      const participant = ctfState.teams.find(t =>
        (t.userId && t.userId.toUpperCase() === usernameInput.toUpperCase()) ||
        (t.partner1UserId && t.partner1UserId.toUpperCase() === usernameInput.toUpperCase()) ||
        (t.partner2UserId && t.partner2UserId.toUpperCase() === usernameInput.toUpperCase()) ||
        (t.name && t.name.toLowerCase() === usernameInput.toLowerCase())
      );

      if (!participant || participant.password !== passwordInput) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid User ID or Password. Only confirmed participants can enter.'
        }));
        return;
      }

      // Check if logged in with a partner-specific ID
      const isPartner2 = participant.partner2UserId && participant.partner2UserId.toUpperCase() === usernameInput.toUpperCase();
      const isPartner1 = participant.partner1UserId && participant.partner1UserId.toUpperCase() === usernameInput.toUpperCase();
      const activePartnerName = isPartner2 
        ? (participant.partner2 && participant.partner2.name ? participant.partner2.name : 'Partner 2')
        : (isPartner1 && participant.partner1 && participant.partner1.name ? participant.partner1.name : participant.name);

      const token = `token_${participant.id}_${Date.now()}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        isAdmin: false,
        token: token,
        user: {
          id: participant.id,
          userId: isPartner2 ? participant.partner2UserId : (isPartner1 ? participant.partner1UserId : participant.userId),
          teamUserId: participant.userId,
          name: participant.name,
          activeOperative: activePartnerName,
          type: participant.type || 'DUO',
          college: participant.college,
          score: participant.score,
          solved: participant.solved || []
        },
        redirect: 'missions.html',
        message: `Welcome, ${activePartnerName} [${participant.name}]!`
      }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Login processing error: ' + err.message }));
      return;
    }
  }

  // ==========================================
  // API: PURGED ARTIFACTS / RECYCLE BIN VAULT
  // ==========================================
  if (pathname === '/api/recycle-bin' && req.method === 'GET') {
    ctfState.purgedArtifacts = ctfState.purgedArtifacts || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      items: ctfState.purgedArtifacts
    }));
    return;
  }

  if (pathname === '/api/recycle-bin' && req.method === 'POST') {
    try {
      const item = await parseJsonBody(req);
      if (!item || !item.name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Artifact metadata required.' }));
        return;
      }
      ctfState.purgedArtifacts = ctfState.purgedArtifacts || [];
      const existingIdx = ctfState.purgedArtifacts.findIndex(i => i.id === item.id);
      if (existingIdx >= 0) {
        ctfState.purgedArtifacts[existingIdx] = item;
      } else {
        ctfState.purgedArtifacts.unshift(item);
      }
      saveState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, item }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Error adding to recycle bin: ' + err.message }));
      return;
    }
  }

  if ((pathname === '/api/recycle-bin' || pathname.startsWith('/api/recycle-bin/')) && req.method === 'DELETE') {
    ctfState.purgedArtifacts = ctfState.purgedArtifacts || [];
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    let idToDelete = urlObj.searchParams.get('id');
    if (!idToDelete && pathname.startsWith('/api/recycle-bin/')) {
      idToDelete = decodeURIComponent(pathname.replace('/api/recycle-bin/', ''));
    }

    if (idToDelete) {
      ctfState.purgedArtifacts = ctfState.purgedArtifacts.filter(i => i.id !== idToDelete);
    } else {
      ctfState.purgedArtifacts = [];
    }
    saveState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, items: ctfState.purgedArtifacts }));
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
  // API: ADMIN GET PARTICIPANTS
  // ==========================================
  if (pathname === '/api/admin/participants' && req.method === 'GET') {
    const authHeader = req.headers['authorization'] || '';
    const adminToken = authHeader.replace('Bearer ', '').trim();
    if (adminToken !== ADMIN_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unauthorized. Admin token required.' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      participants: ctfState.teams.map(t => ({
        id: t.id,
        type: t.type || (t.partner2 ? 'DUO' : 'SOLO'),
        userId: t.userId || 'USER-UNASSIGNED',
        partner1UserId: t.partner1UserId || t.userId,
        partner2UserId: t.partner2UserId || null,
        name: t.name,
        password: t.password || 'Nexus#P4ss',
        college: t.college || 'Collegiate Arena',
        partner1: t.partner1 || { name: t.name, email: `${t.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`, userId: t.userId },
        partner2: t.partner2 || null,
        confirmed: true,
        score: t.score,
        solvedCount: t.solved ? t.solved.length : 0,
        penalties: t.penalties || 0
      }))
    }));
    return;
  }

  // ==========================================
  // API: ADMIN CONFIRM NEW PARTICIPANT (AUTO-GENERATES USER ID & PASSWORD)
  // Supports Solo Operative or Duo Team with Partners
  // ==========================================
  if (pathname === '/api/admin/confirm-participant' && req.method === 'POST') {
    try {
      const authHeader = req.headers['authorization'] || '';
      const adminToken = authHeader.replace('Bearer ', '').trim();
      if (adminToken !== ADMIN_TOKEN) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized. Admin token required.' }));
        return;
      }

      const body = await parseJsonBody(req);
      const type = (body.type || (body.partner2Name ? 'DUO' : 'SOLO')).toUpperCase();
      const name = (body.name || '').trim();
      const college = (body.college || 'Collegiate Arena').trim();
      const partner1Name = (body.partner1Name || body.partner1 || '').trim();
      const partner1Email = (body.partner1Email || '').trim();
      const partner2Name = (body.partner2Name || body.partner2 || '').trim();
      const partner2Email = (body.partner2Email || '').trim();

      if (!name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Participant or Squad Name is required.' }));
        return;
      }

      let userId = generateRandomUserId(type);
      while (ctfState.teams.some(t => t.userId === userId)) {
        userId = generateRandomUserId(type);
      }
      const password = generateRandomPassword();

      const newParticipant = {
        id: 'usr_' + Date.now(),
        type, // 'SOLO' or 'DUO'
        userId,
        partner1UserId: type === 'DUO' ? `${userId}-A` : userId,
        partner2UserId: type === 'DUO' ? `${userId}-B` : null,
        name,
        password,
        confirmed: true,
        college,
        partner1: {
          name: partner1Name || name,
          email: partner1Email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          userId: type === 'DUO' ? `${userId}-A` : userId
        },
        partner2: type === 'DUO' ? {
          name: partner2Name || 'Partner 2',
          email: partner2Email || `${name.toLowerCase().replace(/\s+/g, '')}_p2@gmail.com`,
          userId: `${userId}-B`
        } : null,
        score: 0,
        solved: [],
        penalties: 0,
        lastSolve: 0
      };

      ctfState.teams.push(newParticipant);
      saveState();

      // Broadcast update
      broadcastSSE({
        type: 'PARTICIPANTS_UPDATED',
        timestamp: Date.now()
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `${type === 'DUO' ? 'Duo Squad' : 'Solo Operative'} "${name}" confirmed. Credentials dispatched to Gmail.`,
        participant: newParticipant
      }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Error confirming participant: ' + err.message }));
      return;
    }
  }

  // ==========================================
  // API: ADMIN DELETE PARTICIPANT
  // ==========================================
  if (pathname.startsWith('/api/admin/participant/') && req.method === 'DELETE') {
    const authHeader = req.headers['authorization'] || '';
    const adminToken = authHeader.replace('Bearer ', '').trim();
    if (adminToken !== ADMIN_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      return;
    }

    const targetId = pathname.split('/')[4];
    ctfState.teams = ctfState.teams.filter(t => t.id !== targetId && t.userId !== targetId);
    saveState();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Participant removed successfully.' }));
    return;
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
