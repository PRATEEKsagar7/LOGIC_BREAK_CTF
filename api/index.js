/**
 * Logic Break CTF - Vercel Serverless Handler
 * Adapted from server.js for Vercel deployment.
 *
 * Key differences from server.js:
 *  - In-memory state only (no fs.writeFileSync — Vercel filesystem is read-only)
 *  - ctf_data.json is read once at cold start for initial data
 *  - SSE /api/events is kept but only works on Vercel Pro (streaming)
 *  - All static challenge_files are served from the /challenge_files directory
 */

const fs = require('fs');
const path = require('path');
const url = require('url');

// =============================================
// ADMIN CREDENTIALS
// =============================================
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'logicbreak_admin_2026',
  backupPassword: 'admin123'
};
const ADMIN_TOKEN = 'logicbreak_admin_token_active_session_2026';

// =============================================
// 16 CHALLENGES
// =============================================
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
    description: 'Download and extract the repository ZIP using the artifact button (📄). Search through the nested source code and audit logs to find the authentic recovery flag while avoiding decoys.',
    hints: [
      'Click the document icon (📄) on this mission card and click "Download Artifact (ZIP)" to download challenge_05_source_maze.zip.',
      'Check app.py and inspect recent entries in storage/logs/audit/ to see where the system archived its operational beacon.',
      'Beware of decoy flags placed in fake SQL snapshots and comments—only the authentic recovery beacon counts!'
    ],
    file: 'challenge_05_source_maze.zip',
    codeSnippet: '// 1. Click "Download Artifact (ZIP)" in the modal to download challenge_05_source_maze.zip\n// 2. Extract the archive onto your computer and explore the folders.\n// 3. Locate the authentic recovery beacon and submit the flag:\n// Format: logicCTF{...}',
    flag: 'logicCTF{DPG_badmos}'
  },
  {
    id: 'ch6',
    number: 6,
    title: 'The UI Contradiction',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'The Files & Docs hub claims file sharing is disabled across all collegiate nodes, yet another arena section suggests otherwise. Find where the contradiction lives and test which part reflects actual behavior.',
    hints: [
      'Inspect Files & Docs to see what the central security banner claims about file sharing.',
      'Check other operational sections like Schedule to see if an attached dossier file can actually be shared.',
      'When two parts disagree, test which one is telling the truth by executing the share action.'
    ],
    file: 'schedule.html',
    codeSnippet: '// Page A (Files & Docs): "File sharing is disabled across all collegiate nodes."\n// Page B (Schedule): "Share Schedule & Dossier" available.\n// Flaw: Front-end policy restriction was cosmetic and not enforced by the backend!',
    flag: 'logicCTF{u1_c0ntr4d1ct10n_f1l3_sh4r1ng_tru7h}'
  },
  {
    id: 'ch7',
    number: 7,
    title: 'The Secret Search Result',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Find an item that is not visible in the normal list. Use the built-in search filter to discover the unlisted record and claim the voucher.',
    hints: [
      'The normal billing history displays standard monthly entries, but unlisted allocation records remain indexed.',
      'Try searching for keywords like "secret", "hidden", "classified", or "bounty" in the billing history search bar.',
      'Not visible is not the same as unavailable.'
    ],
    file: 'billing.html',
    codeSnippet: '// Billing Archive Engine:\n// Normal view filters out unlisted vouchers.\n// Search query indexes unlisted allocation records:\n// Search "secret" -> INV-SECRET-077 -> Claim Voucher -> Flag revealed!',
    flag: 'logicCTF{s3cr3t_s34rch_unl1st3d_inv01c3_r3v34l3d}'
  },
  {
    id: 'ch8',
    number: 8,
    title: 'The Wrong Workflow',
    category: 'Business Logic',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Complete a restricted action through an unexpected but legitimate workflow.',
    hints: [
      'Directly archiving the institutional project from the projects grid is blocked by security controls.',
      'Explore other workspace sections where node telemetry and linked project services are managed.',
      'There may be more than one way to reach the same result.'
    ],
    file: 'projects.html',
    codeSnippet: '// Normal Workflow (Projects Grid): Direct archive rejected due to bound node telemetry.\n// Alternative Workflow (Workspace Node): Disconnecting node service archives project to standby storage!\n// Flag unlocked: logicCTF{wr0ng_w0rkfl0w_4lt3rn4t1v3_p4th_c0mpl3t3d}',
    flag: 'logicCTF{wr0ng_w0rkfl0w_4lt3rn4t1v3_p4th_c0mpl3t3d}'
  },
  {
    id: 'ch9',
    number: 9,
    title: 'The Archived Project',
    category: 'Business Logic',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Perform an action on an archived project.',
    hints: [
      'Archived projects cannot be modified through the normal projects dashboard.',
      'Explore other ways to access the project such as search, activity history, or audit logs.',
      'Where you open something can change what you can do with it.'
    ],
    file: 'projects.html',
    codeSnippet: '// Normal projects dashboard blocks modification of archived items:\n// "Archived projects cannot be modified."\n// Accessing via Recent Activity / Audit History exposes action workflow:\n// Flag: logicCTF{4rch1v3d_pr0j3ct_h1st0ry_m0d1f13d_unl0ck}',
    flag: 'logicCTF{4rch1v3d_pr0j3ct_h1st0ry_m0d1f13d_unl0ck}'
  },
  {
    id: 'ch10',
    number: 10,
    title: 'The Wrong Name',
    category: 'Business Logic',
    difficulty: 'Intermediate',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Find the correct name of the document and rename it to unlock the flag.',
    hints: [
      'A document carries the right information under the wrong name, and the clue to fix it is hiding in plain sight.',
      'The file that guides you may point you closer than you think. Compare Movie Reference Notes with Annual Project Report.'
    ],
    file: 'Movie Reference Notes.md',
    codeSnippet: '// Identified document under wrong generic title: "Annual Project Report.md"\n// Reference guide describes a movie about dreams within dreams, artificial layers, and memories.\n// The document itself mentions: "The final stage was described internally as an inception"\n// Correct Canonical Name: "Inception.md"\n// Flag: logicCTF{wr0ng_n4m3_c0rr3ct_d0cum3nt_unm4sk3d}',
    flag: 'logicCTF{wr0ng_n4m3_c0rr3ct_d0cum3nt_unm4sk3d}'
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
  },
  {
    id: 'ch13',
    number: 13,
    title: 'The Person Behind the Web',
    category: 'Web History & Recon',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: "He changed the way information was connected, turning a simple idea into something the whole world could use. Locate the archived intelligence dossier in the Files & Docs archive, deduce the pioneer's identity, and submit the flag.",
    hints: [
      'The person you are looking for was born on 8 June 1955.',
      'While working at a European research organization (CERN), he proposed hypertext and created the first web server (info.cern.ch).',
      'Submit the flag in standard format: logicCTF{<first>_<last>} (e.g. logicCTF{tim_berners_lee}).'
    ],
    file: 'challenge_13_the_unknown_person.txt',
    codeSnippet: '// Historical Intelligence Dossier: ARCH-HIST-1955-WWW\n// "The person you are looking for was born on 8 June 1955."\n// Inventor of the World Wide Web at CERN.\n// Flag: logicCTF{tim_berners_lee}',
    flag: 'logicCTF{tim_berners_lee}'
  },
  {
    id: 'ch14',
    number: 14,
    title: 'The Missing Task',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Find and complete a task that is not visible in the main task list. Some tasks disappear from the list without disappearing from the application.',
    hints: [
      '"Missing from view does not mean missing from the system."',
      'Inspect the Tactical Schedule dashboard. Use the search bar or the Activity & Audit log filter to uncover hidden background tasks, then mark it complete.'
    ],
    file: 'schedule.html',
    codeSnippet: '// Main view suppresses background maintenance daemons.\n// Filter by activity/audit or search for cold-storage/unlisted tasks.\n// Flag: logicCTF{m1ss1ng_t4sk_unl1st3d_c0mpl3t3d}',
    flag: 'logicCTF{m1ss1ng_t4sk_unl1st3d_c0mpl3t3d}'
  },
  {
    id: 'ch15',
    number: 15,
    title: 'The Unscheduleable Share',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Schedule a share even though scheduling appears unavailable. A share can sometimes find a way onto the calendar.',
    hints: [
      '"The first Share button may not tell the whole story."',
      'The Files & Docs interface insists scheduling is unavailable, but perhaps a dedicated scheduling workflow looks at it differently.'
    ],
    file: 'schedule.html',
    codeSnippet: '// Files portal disables scheduling with policy restriction.\n// Schedule portal alternative workflow permits calendar share.\n// Flag: logicCTF{unsck3dul4bl3_sh4r3_c4l3nd4r_p4th}',
    flag: 'logicCTF{unsck3dul4bl3_sh4r3_c4l3nd4r_p4th}'
  },
  {
    id: 'ch16',
    number: 16,
    title: 'Cancelled but Active',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Complete a billing action that appears to have failed. The billing message says no, but the account may say yes.',
    hints: [
      '"After billing tells you something, check the account again."',
      'A cancellation error message in the interface may disguise state synchronization on the underlying subscription record.'
    ],
    file: 'billing.html',
    codeSnippet: '// Cancellation yields simulated transaction failure.\n// Refreshing reveals updated account cancellation status and flag.\n// Flag: logicCTF{c4nc3ll3d_but_4ct1v3_st4t3_d1sc0v3r3d}',
    flag: 'logicCTF{c4nc3ll3d_but_4ct1v3_st4t3_d1sc0v3r3d}'
  }
];

// =============================================
// MIME TYPES
// =============================================
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
  '.sql': 'text/plain; charset=UTF-8',
  '.zip': 'application/zip'
};

// =============================================
// IN-MEMORY STATE (persists per warm instance)
// On Vercel: resets on cold start / new deployment
// =============================================
function generateRandomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(10 + Math.random() * 90);
  return `Nexus#${rand}${digits}`;
}

// Load initial state from ctf_data.json if it exists (read-only on Vercel)
let ctfState = { teams: [], submissions: [], purgedArtifacts: [] };
try {
  const dataFilePath = path.join(__dirname, '..', 'ctf_data.json');
  if (fs.existsSync(dataFilePath)) {
    const saved = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    if (saved.teams && saved.submissions) {
      ctfState = saved;
      ctfState.purgedArtifacts = ctfState.purgedArtifacts || [];
    }
  }
} catch (err) {
  console.error('[CTF] Failed to load ctf_data.json:', err.message);
}

// saveState is a no-op on Vercel (read-only filesystem) — state lives in memory
function saveState() {
  // On Vercel: no-op. State persists in memory for the lifetime of the warm instance.
  // Use the Admin panel to manage teams; data survives warm instance but resets on cold start.
}

// =============================================
// SSE CLIENTS (per-instance, warm only)
// =============================================
const sseClients = new Set();

function broadcastSSE(data) {
  const payload = `event: message\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch (e) { sseClients.delete(res); }
  }
}

// =============================================
// HELPERS
// =============================================
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { req.destroy(); reject(new Error('Payload too large')); }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

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

// =============================================
// MAIN VERCEL HANDLER
// =============================================
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const rawUrl = req.headers['x-matched-path'] || req.url;
  const parsedUrl = new URL(rawUrl, `https://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;
  if (parsedUrl.searchParams.has('__route')) {
    pathname = parsedUrl.searchParams.get('__route');
  } else if ((pathname === '/api/index.js' || pathname === '/api' || pathname === '/api/') && req.headers['x-matched-path']) {
    pathname = req.headers['x-matched-path'].split('?')[0];
  }

  // ------------------------------------------
  // SSE: /api/events
  // ------------------------------------------
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    // Send initial state
    res.write(`event: message\ndata: ${JSON.stringify({ type: 'INIT', leaderboard: getSortedLeaderboard() })}\n\n`);
    return;
  }

  // ------------------------------------------
  // API: GET CHALLENGES
  // ------------------------------------------
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

  // ------------------------------------------
  // API: GET CHALLENGE HINT
  // ------------------------------------------
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

  // ------------------------------------------
  // API: SUBMIT FLAG
  // ------------------------------------------
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

      const challenge = INITIAL_CHALLENGES.find(c => c.id === challengeId);
      if (!challenge) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Challenge not found.' }));
        return;
      }

      const team = ctfState.teams.find(t =>
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

      if (team.solved.includes(challenge.id)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          status: 'already_solved',
          message: `Challenge "${challenge.title}" was already solved by your team! No additional points awarded.`
        }));
        return;
      }

      // Flag Verification
      const isCorrect =
        submittedFlag === challenge.flag ||
        (challenge.id === 'ch1' && (submittedFlag === 'logicCTF{pr0j3ct_l1m1t_byp4ss_dupl1c4t3}' || submittedFlag === 'logicCTF{gr4phql_1ntr0sp3ct10n_byp4ss}')) ||
        (challenge.id === 'ch2' && (submittedFlag === 'logicCTF{purg3d_r3cycl3_b1n_csv_3xp0rt}' || submittedFlag === 'logicCTF{x0r_c1ph3r_b4s364_cr4ck3d}')) ||
        (challenge.id === 'ch3' && (submittedFlag === 'logicCTF{t3xt4r34_r3s1z3_h1dd3n_buff3r_unl0ck}' || submittedFlag === 'logicCTF{p4ck3t_sn1ff3r_cr3ds_l34k}')) ||
        (challenge.id === 'ch4' && (submittedFlag === 'logicCTF{r3st0r3_purg3d_r3p0rt_int3gr1ty_unl0ck}' || submittedFlag === 'logicCTF{cl13nt_s1d3_auth_1s_n0t_s4f3}')) ||
        (challenge.id === 'ch5' && (submittedFlag === 'logicCTF{DPG_badmos}' || submittedFlag === 'logicCTF{jwt_s3cr3t_brut3f0rc3_2026}')) ||
        (challenge.id === 'ch6' && submittedFlag === 'logicCTF{u1_c0ntr4d1ct10n_f1l3_sh4r1ng_tru7h}') ||
        (challenge.id === 'ch7' && (submittedFlag === 'logicCTF{s3cr3t_s34rch_unl1st3d_inv01c3_r3v34l3d}' || submittedFlag === 'logicCTF{st3g0_m3t4d4t4_h1dd3n_fl4g}')) ||
        (challenge.id === 'ch8' && (submittedFlag === 'logicCTF{wr0ng_w0rkfl0w_4lt3rn4t1v3_p4th_c0mpl3t3d}' || submittedFlag === 'logicCTF{b1n4ry_0v3rfl0w_r3t2l1bc_pwnd}')) ||
        (challenge.id === 'ch9' && (submittedFlag === 'logicCTF{4rch1v3d_pr0j3ct_h1st0ry_m0d1f13d_unl0ck}' || submittedFlag === 'logicCTF{sm4ll_pr1m3_f4ct0r1z4t10n_rs4}')) ||
        (challenge.id === 'ch10' && (submittedFlag === 'logicCTF{wr0ng_n4m3_c0rr3ct_d0cum3nt_unm4sk3d}' || submittedFlag === 'logicCTF{m3m0ry_f0r3ns1cs_v0l4t1l1ty_d1sc0v3r3d}')) ||
        (challenge.id === 'ch13' && (
          submittedFlag.toLowerCase() === 'logicctf{tim_berners_lee}' ||
          submittedFlag.toLowerCase() === 'logicctf{timothy_berners_lee}' ||
          submittedFlag.toLowerCase() === 'logicctf{tim_berners_lee_1955}' ||
          submittedFlag.toLowerCase() === 'logicctf{timbernerslee}' ||
          submittedFlag.toLowerCase() === 'logicctf{sir_tim_berners_lee}' ||
          submittedFlag.toLowerCase() === 'tim berners-lee' ||
          submittedFlag.toLowerCase() === 'tim berners lee'
        )) ||
        (challenge.id === 'ch14' && submittedFlag.toLowerCase() === 'logicctf{m1ss1ng_t4sk_unl1st3d_c0mpl3t3d}') ||
        (challenge.id === 'ch15' && submittedFlag.toLowerCase() === 'logicctf{unsck3dul4bl3_sh4r3_c4l3nd4r_p4th}') ||
        (challenge.id === 'ch16' && submittedFlag.toLowerCase() === 'logicctf{c4nc3ll3d_but_4ct1v3_st4t3_d1sc0v3r3d}');

      if (isCorrect) {
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
        saveState();

        broadcastSSE({
          type: 'FLAG_SOLVED',
          team: team.name,
          challenge: challenge.title,
          points: challenge.points,
          leaderboard: getSortedLeaderboard()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          status: 'correct',
          points: challenge.points,
          newScore: team.score,
          message: `Correct! +${challenge.points} pts awarded. Score: ${team.score} pts.`
        }));
      } else {
        // Penalty
        team.score = Math.max(0, team.score - challenge.penalty);
        team.penalties = (team.penalties || 0) + 1;

        const penaltyLog = {
          id: 'sub-' + Date.now(),
          team: team.name,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          status: 'INCORRECT',
          delta: `-${challenge.penalty}`,
          timestamp: Date.now()
        };
        ctfState.submissions.unshift(penaltyLog);
        saveState();

        broadcastSSE({
          type: 'FLAG_FAILED',
          team: team.name,
          challenge: challenge.title,
          penalty: challenge.penalty,
          leaderboard: getSortedLeaderboard()
        });

        const penaltyMsg = `Incorrect flag! -${challenge.penalty} pts penalty applied. Score: ${team.score} pts.`;
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

  // ------------------------------------------
  // API: LEADERBOARD
  // ------------------------------------------
  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    const leaderboard = getSortedLeaderboard();
    const totalFlagsClaimed = ctfState.teams.reduce((acc, t) => acc + (t.solved ? t.solved.length : 0), 0);
    const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, totalTeams: ctfState.teams.length, totalFlagsClaimed, topScore, leaderboard, recentActivity: ctfState.submissions.slice(0, 15) }));
    return;
  }

  // ------------------------------------------
  // API: TEAMS LIST
  // ------------------------------------------
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

  // ------------------------------------------
  // API: LOGIN (Participant + Admin)
  // ------------------------------------------
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

      const participant = ctfState.teams.find(t =>
        (t.userId && t.userId.toUpperCase() === usernameInput.toUpperCase()) ||
        (t.partner1UserId && t.partner1UserId.toUpperCase() === usernameInput.toUpperCase()) ||
        (t.partner2UserId && t.partner2UserId.toUpperCase() === usernameInput.toUpperCase()) ||
        (t.name && t.name.toLowerCase() === usernameInput.toLowerCase())
      );

      if (!participant || participant.password !== passwordInput) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid User ID or Password. Only confirmed participants can enter.' }));
        return;
      }

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
        redirect: 'overview.html',
        message: `Welcome, ${activePartnerName} [${participant.name}]!`
      }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Login processing error: ' + err.message }));
      return;
    }
  }

  // ------------------------------------------
  // API: RECYCLE BIN
  // ------------------------------------------
  if (pathname === '/api/recycle-bin' && req.method === 'GET') {
    ctfState.purgedArtifacts = ctfState.purgedArtifacts || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, items: ctfState.purgedArtifacts }));
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
    let idToDelete = parsedUrl.searchParams.get('id');
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

  // ------------------------------------------
  // API: ADMIN LOGIN
  // ------------------------------------------
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const creds = await parseJsonBody(req);
      const username = (creds.username || '').trim();
      const password = (creds.password || '').trim();
      const isValid = (username === ADMIN_CREDENTIALS.username) &&
        (password === ADMIN_CREDENTIALS.password || password === ADMIN_CREDENTIALS.backupPassword);
      if (isValid) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN, adminUser: ADMIN_CREDENTIALS.username, message: 'Admin authorization granted. Master access active.' }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid administrative credentials. Access denied.' }));
      }
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Login processing error' }));
      return;
    }
  }

  // ------------------------------------------
  // API: ADMIN GET PARTICIPANTS
  // ------------------------------------------
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

  // ------------------------------------------
  // API: ADMIN CONFIRM PARTICIPANT
  // ------------------------------------------
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

      let userId = (body.userId || '').trim().toUpperCase();
      if (!userId) {
        let candidateIdx = ctfState.teams.length + 1;
        do {
          userId = `TEAM-${String(candidateIdx).padStart(2, '0')}`;
          candidateIdx++;
        } while (ctfState.teams.some(t => t.userId === userId));
      }
      const password = (body.password || '').trim() || generateRandomPassword();

      const newParticipant = {
        id: 'usr_' + Date.now(),
        type,
        userId,
        partner1UserId: userId,
        partner2UserId: partner2Name ? `${userId}-B` : null,
        name,
        password,
        confirmed: true,
        college,
        partner1: { name: partner1Name || name, email: partner1Email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`, userId: userId },
        partner2: partner2Name ? { name: partner2Name, email: partner2Email || `${name.toLowerCase().replace(/\s+/g, '')}_p2@gmail.com`, userId: `${userId}-B` } : null,
        score: 0,
        solved: [],
        penalties: 0,
        lastSolve: 0
      };

      ctfState.teams.push(newParticipant);
      saveState();
      broadcastSSE({ type: 'PARTICIPANTS_UPDATED', timestamp: Date.now() });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `${type === 'DUO' ? 'Duo Squad' : 'Solo Operative'} "${name}" confirmed.`, participant: newParticipant }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Error confirming participant: ' + err.message }));
      return;
    }
  }

  // ------------------------------------------
  // API: ADMIN DELETE PARTICIPANT
  // ------------------------------------------
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

  // ------------------------------------------
  // API: ADMIN SUBMISSIONS LOG
  // ------------------------------------------
  if (pathname === '/api/admin/submissions' && req.method === 'GET') {
    const adminToken = req.headers['x-admin-token'] || parsedUrl.searchParams.get('token');
    if (adminToken !== ADMIN_TOKEN) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Forbidden: Admin clearance required.' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, submissions: ctfState.submissions, rawFlags: INITIAL_CHALLENGES.map(c => ({ id: c.id, title: c.title, flag: c.flag, points: c.points, penalty: c.penalty })) }));
    return;
  }

  // ------------------------------------------
  // API: ADMIN RESET
  // ------------------------------------------
  if (pathname === '/api/admin/reset' && req.method === 'POST') {
    const adminToken = req.headers['x-admin-token'];
    if (adminToken !== ADMIN_TOKEN) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Forbidden' }));
      return;
    }
    try {
      const body = await parseJsonBody(req);
      if (body.type === 'ALL') {
        ctfState.teams.forEach(t => { t.score = 0; t.solved = []; t.penalties = 0; t.lastSolve = 0; });
        ctfState.submissions = [];
        saveState();
        broadcastSSE({ type: 'ARENA_RESET', leaderboard: getSortedLeaderboard() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'All scores and challenge submissions have been reset.' }));
        return;
      } else if (body.teamId) {
        const t = ctfState.teams.find(team => team.id === body.teamId);
        if (t) {
          t.score = 0; t.solved = []; t.penalties = 0;
          saveState();
          broadcastSSE({ type: 'TEAM_RESET', team: t.name, leaderboard: getSortedLeaderboard() });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: `Reset score for team ${t.name}.` }));
          return;
        }
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid reset target.' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Reset error: ' + err.message }));
    }
    return;
  }

  // ------------------------------------------
  // API: FILE SHARING (Challenge 6)
  // ------------------------------------------
  if (pathname === '/api/files/share' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const filename = body.file || 'incident_recon_dossier.pdf';
      const shareToken = 'share_' + Buffer.from(filename + '_' + Date.now()).toString('base64').replace(/=/g, '');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        file: filename,
        shareUrl: `https://arena.logicctf.edu/shared/doc/${shareToken}`,
        flag: 'logicCTF{u1_c0ntr4d1ct10n_f1l3_sh4r1ng_tru7h}',
        message: 'Contradiction confirmed! The security banner restriction was purely cosmetic. File sharing link generated successfully.'
      }));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Share endpoint error: ' + e.message }));
      return;
    }
  }

  // ------------------------------------------
  // API: SECRET VOUCHER CLAIM (Challenge 7)
  // ------------------------------------------
  if (pathname === '/api/billing/claim-voucher' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const voucherId = body.voucherId || 'INV-SECRET-077';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        voucherId,
        voucherName: 'Classified Arena Vulnerability Bounty Voucher',
        amount: '₹0.00',
        flag: 'logicCTF{s3cr3t_s34rch_unl1st3d_inv01c3_r3v34l3d}',
        message: 'Unlisted voucher claimed successfully! Authorization token confirmed.'
      }));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Claim voucher endpoint error: ' + e.message }));
      return;
    }
  }

  // ------------------------------------------
  // API: DEACTIVATE NODE (Challenge 8)
  // ------------------------------------------
  if (pathname === '/api/projects/deactivate-node' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const projectId = body.projectId || 'proj-1';
      const projectName = body.projectName || 'Cyber Defense Challenge';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        projectId,
        projectName,
        status: 'Archived',
        flag: 'logicCTF{wr0ng_w0rkfl0w_4lt3rn4t1v3_p4th_c0mpl3t3d}',
        message: 'Telemetry node service disconnected. Institutional project successfully placed in Standby Archive!'
      }));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Deactivate node endpoint error: ' + e.message }));
      return;
    }
  }

  // ------------------------------------------
  // API: ARCHIVED PROJECT ACTION (Challenge 9)
  // ------------------------------------------
  if (req.method === 'POST' && pathname === '/api/projects/archived-action') {
    try {
      const body = await parseJsonBody(req);
      const projectId = body.projectId || 'proj-archived';
      const action = body.action || 'sign_manifest';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        projectId,
        action,
        flag: 'logicCTF{4rch1v3d_pr0j3ct_h1st0ry_m0d1f13d_unl0ck}',
        message: 'Archived project manifest signed & synchronized successfully!'
      }));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Archived action error: ' + e.message }));
      return;
    }
  }

  // ------------------------------------------
  // API: DOCUMENT RENAME (Challenge 10)
  // ------------------------------------------
  if (req.method === 'POST' && pathname === '/api/documents/rename') {
    try {
      const body = await parseJsonBody(req);
      const documentId = body.documentId || 'file-row-10';
      const originalName = body.originalName || 'Annual Project Report.md';
      const newName = (body.newName || '').trim();
      const cleanNew = newName.toLowerCase().replace(/['"]/g, '').trim();
      const isCanonical = cleanNew.includes('inception') || cleanNew === 'incident_response_runbook.pdf';
      if (isCanonical) {
        const canonicalDisplay = cleanNew.includes('inception')
          ? (newName.toLowerCase().endsWith('.md') ? newName : `${newName}.md`)
          : 'incident_response_runbook.pdf';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          verified: true,
          documentId,
          newName: canonicalDisplay,
          flag: 'logicCTF{wr0ng_n4m3_c0rr3ct_d0cum3nt_unm4sk3d}',
          message: `True identity verified! "${originalName}" correctly renamed to "${canonicalDisplay}" based on the movie reference context.`
        }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          verified: false,
          documentId,
          newName,
          message: `Document renamed to "${newName}", but does not match the true identity revealed by the movie reference.`
        }));
      }
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Document rename error: ' + e.message }));
      return;
    }
  }

  // ------------------------------------------
  // CHALLENGE FILES DOWNLOAD
  // ------------------------------------------
  if (pathname.startsWith('/api/files/') || pathname.startsWith('/challenge_files/')) {
    const rawFilename = path.basename(pathname);
    const filename = decodeURIComponent(rawFilename);
    // On Vercel, __dirname is the /api directory, so challenge_files is one level up
    const safePath = path.join(__dirname, '..', 'challenge_files', filename);
    if (fs.existsSync(safePath)) {
      const ext = path.extname(safePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(safePath);
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size,
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

  // ------------------------------------------
  // 404 fallback for unrecognized API routes
  // ------------------------------------------
  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'API endpoint not found.' }));
    return;
  }

  // ------------------------------------------
  // Static file serving (fallback for anything not caught above)
  // Vercel handles .html/.js/.css directly — this handles edge cases
  // ------------------------------------------
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '/index.html' || reqPath === '/login' || reqPath === '/login.html') {
    reqPath = '/login.html';
  }

  const baseDir = process.cwd();
  let resolvedFile = null;

  const candidates = [
    path.join(baseDir, reqPath),
    path.join(baseDir, 'public', reqPath),
    path.join(__dirname, '..', reqPath),
    path.join(baseDir, `${reqPath}.html`),
    path.join(baseDir, 'public', `${reqPath}.html`),
    path.join(__dirname, '..', `${reqPath}.html`)
  ];

  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        resolvedFile = cand;
        break;
      }
    } catch (e) {}
  }

  if (!resolvedFile) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(`<!DOCTYPE html><html><head><title>404 Not Found</title><style>body{background:#0e1511;color:#5bdcae;font-family:sans-serif;padding:40px;text-align:center;}</style></head><body><h1>404 // RESOURCE UNREACHABLE</h1><p>The requested vector does not exist in the collegiate arena.</p><a href="/login.html" style="color:#fff;text-decoration:underline;">Return to Tactical Login</a></body></html>`);
    return;
  }

  const ext = path.extname(resolvedFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(resolvedFile).pipe(res);
};
