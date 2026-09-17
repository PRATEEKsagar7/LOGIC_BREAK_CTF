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
// Challenges 1-10 (Tier 1): +50 pts solve, -15 pts penalty on wrong
// Challenges 11-12 (Tier 2): +100 pts solve, -25 pts penalty on wrong
const INITIAL_CHALLENGES = [
  {
    id: 'ch1',
    number: 1,
    title: 'The Invisible User',
    category: 'Business Logic & Recon',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Find a user who is missing from the User Directory. Not seeing a user does not always mean the user is gone.',
    hints: [
      '“Try looking where actions are remembered.”',
      'Inspect the Activity Log audit or search filters in Users Directory to discover the unlisted operative.'
    ],
    file: 'users.html',
    codeSnippet: '// Directory filter suppresses unlisted active operator.\n// Inspect Activity Log audit or search filters in Users Directory to discover the unlisted operative.\n// Flag: logicCTF{pr0j3ct_l1m1t_byp4ss_dupl1c4t3}',
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
    title: 'Documentation Exception',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Find the exception to a documented permission rule. A general rule may have a small exception hiding behind a normal workflow.',
    hints: [
      '“Look beyond the general rule.”',
      'Compare the role permissions matrix in Documentation with the actions available in the live application.'
    ],
    file: 'documentation.html',
    codeSnippet: '// Documentation states viewers cannot modify user accounts.\n// Explore the User Directory workflows to discover the alternate permitted path.\n// Flag: logicCTF{t3xt4r34_r3s1z3_h1dd3n_buff3r_unl0ck}',
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
    title: 'SSRF Cloud Metadata',
    category: 'Cloud Security & Recon',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Inspect cloud metadata endpoints and decoupled telemetry APIs to uncover concealed server credentials.',
    hints: [
      '“Decoupled shadow endpoints often query internal metadata services.”',
      'Look for instance metadata queries in challenge_11_shadow_api.json to extract the authentic access key.'
    ],
    file: 'challenge_11_shadow_api.json',
    codeSnippet: '// Cloud Metadata Gateway: 169.254.169.254\n// Shadow API relays unauthenticated internal credentials.\n// Flag: logicCTF{ssrf_cl0ud_m3t4d4t4_cr3ds_pwn}',
    flag: 'logicCTF{ssrf_cl0ud_m3t4d4t4_cr3ds_pwn}'
  },
  {
    id: 'ch12',
    number: 12,
    title: 'The Outdated Rule',
    category: 'Business Logic',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Find a feature that is described differently in the documentation and in the application. One page still remembers an older version of the application.',
    hints: [
      '“Not everything written down was written recently.”',
      'Compare what the documentation claims is unavailable with what the live application allows.'
    ],
    file: 'documentation.html',
    codeSnippet: '// Documentation marks feature as read-only/deprecated.\n// Live application execution path remains enabled.\n// Flag: logicCTF{su1d_pr1v1l3g3_3sc4l4t10n_r00t}',
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
    description: 'He changed the way information was connected, turning a simple idea into something the whole world could use. Locate the archived intelligence dossier in the Files & Docs archive, deduce the pioneer\'s identity, and submit the flag.',
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
      '“Missing from view does not mean missing from the system.”',
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
      '“The first Share button may not tell the whole story.”',
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
      '“After billing tells you something, check the account again.”',
      'A cancellation error message in the interface may disguise state synchronization on the underlying subscription record.'
    ],
    file: 'billing.html',
    codeSnippet: '// Cancellation yields simulated transaction failure.\n// Refreshing reveals updated account cancellation status and flag.\n// Flag: logicCTF{c4nc3ll3d_but_4ct1v3_st4t3_d1sc0v3r3d}',
    flag: 'logicCTF{c4nc3ll3d_but_4ct1v3_st4t3_d1sc0v3r3d}'
  },
  {
    id: 'ch17',
    number: 17,
    title: 'The Hidden Name',
    category: 'Business Logic & Forensics',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Find the hidden clue inside the Add User form and use it to complete the challenge. The field looks empty, but the application may know something you cannot see.',
    hints: [
      '“Sometimes a blank field is carrying more than it shows.”',
      'Open the Add User modal and inspect the Name input field element in DevTools to find the secret identity attribute.'
    ],
    file: 'users.html',
    codeSnippet: '// In Add User form:\n// Input #create-name carries hidden data attribute:\n// data-secret-identity="Cipher Prime"\n// Entering "Cipher Prime" triggers the flag payload!\n// Flag: logicCTF{h1dd3n_n4m3_pl4c3h0ld3r_unm4sk3d}',
    flag: 'logicCTF{h1dd3n_n4m3_pl4c3h0ld3r_unm4sk3d}'
  },
  {
    id: 'ch18',
    number: 18,
    title: 'The Exported Flag',
    category: 'Business Logic & Analysis',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Identify the real flag hidden behind an apparently valid export result. The export gives you something that looks ready to submit, but appearances can be misleading.',
    hints: [
      '“Before trusting the result, make sure it speaks the same language as the submission.”',
      'Click Export in Users Directory. Compare the decoy flag against the authentic logicCTF{...} syntax.'
    ],
    file: 'users.html',
    codeSnippet: '// User Directory Export:\n// Decoy flag: FLAG{invalid_syntax_export_test} (rejected)\n// Authentic canonical flag:\n// Flag: logicCTF{3xp0rt_csv_tru3_fl4g_r3v34l3d}',
    flag: 'logicCTF{3xp0rt_csv_tru3_fl4g_r3v34l3d}'
  },
  {
    id: 'ch19',
    number: 19,
    title: 'The Forgotten Menu',
    category: 'Business Logic & Branding',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'You need to change the workspace logo, but the usual settings do not show the option. Discover the branding and appearance controls to update the logo and retrieve the flag.',
    hints: [
      '“A missing option doesn\'t always mean a missing feature.”',
      'Inspect Workspace Settings or Appearance to change the active workspace emblem.'
    ],
    file: 'workspace.html',
    codeSnippet: '// Workspace Settings / Branding:\n// Missing direct control on primary overview.\n// Trigger Change Logo via Appearance/Branding workflow:\n// Flag: logicCTF{f0rg0tt3n_m3nu_br4nd1ng_l0g0_ch4ng3d}',
    flag: 'logicCTF{f0rg0tt3n_m3nu_br4nd1ng_l0g0_ch4ng3d}'
  },
  {
    id: 'ch20',
    number: 20,
    title: 'The Archive Vault Recovery',
    category: 'Business Logic & Archival',
    difficulty: 'Beginner',
    tier: 1,
    points: 50,
    penalty: 15,
    description: 'Direct modification of archived records is locked by security controls. Find and restore an unlisted deactivated account from the Archive Vault cold storage to verify compliance.',
    hints: [
      '“What is kept in the vault can still be summoned back.”',
      'Explore Archived Users, locate the restricted deactivated record, and restore the operational clearance.'
    ],
    file: 'archived_users.html',
    codeSnippet: '// Retention & Security Vault:\n// Archived user accounts held in cold storage.\n// Restore deactivated user record to unlock compliance verification.\n// Flag: logicCTF{4rch1v3_v4ult_r3c0v3ry_c0mpl14nc3}',
    flag: 'logicCTF{4rch1v3_v4ult_r3c0v3ry_c0mpl14nc3}'
  }
];

// Clean Team User ID Generator (TEAM-01, TEAM-02, etc.)
function generateRandomUserId() {
  const currentCount = ctfState && ctfState.teams ? ctfState.teams.length : 0;
  const num = String(currentCount + 1).padStart(2, '0');
  return `TEAM-${num}`;
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

// Permanent Baseline Participants for the Tournament
const INITIAL_PARTICIPANTS = [
  {
    id: "team_codepirate",
    type: "DUO",
    userId: "CODEPIRATE",
    partner1UserId: "CODEPIRATE",
    partner2UserId: "CODEPIRATE-B",
    name: "CODEPIRATE",
    password: "CodePirate#2026",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "CODEPIRATE" },
    partner2: { name: "Operative Bravo", userId: "CODEPIRATE-B" }
  },
  {
    id: "team_logiclord",
    type: "DUO",
    userId: "LOGIC-LORD",
    partner1UserId: "LOGIC-LORD",
    partner2UserId: "LOGIC-LORD-B",
    name: "LOGIC LORD",
    password: "LogicLord#2026",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "LOGIC-LORD" },
    partner2: { name: "Operative Bravo", userId: "LOGIC-LORD-B" }
  },
  {
    id: "team_lumora",
    type: "DUO",
    userId: "LUMORA",
    partner1UserId: "LUMORA",
    partner2UserId: "LUMORA-B",
    name: "LUMORA",
    password: "Lumora#2026",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "LUMORA" },
    partner2: { name: "Operative Bravo", userId: "LUMORA-B" }
  },
  {
    id: "team_logic_lords",
    type: "DUO",
    userId: "TEAM-2",
    partner1UserId: "TEAM-2",
    partner2UserId: "TEAM-2-B",
    name: "Logic Lords",
    password: "Nexus#rnU789",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-2" },
    partner2: { name: "Operative Bravo", userId: "TEAM-2-B" }
  },
  {
    id: "team_lumina",
    type: "DUO",
    userId: "TEAM-07",
    partner1UserId: "TEAM-07",
    partner2UserId: "TEAM-07-B",
    name: "LUMINA",
    password: "Nexus#LPrc43",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-07" },
    partner2: { name: "Operative Bravo", userId: "TEAM-07-B" }
  },
  {
    id: "team_code_breakers",
    type: "DUO",
    userId: "TEAM-08",
    partner1UserId: "TEAM-08",
    partner2UserId: "TEAM-08-B",
    name: "Code Breakers ⚡",
    password: "Nexus#wp4765",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-08" },
    partner2: { name: "Operative Bravo", userId: "TEAM-08-B" }
  },
  {
    id: "team_syntax_terro",
    type: "DUO",
    userId: "TEAM-09",
    partner1UserId: "TEAM-09",
    partner2UserId: "TEAM-09-B",
    name: "Syntax Terro",
    password: "Nexus#PHen76",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-09" },
    partner2: { name: "Operative Bravo", userId: "TEAM-09-B" }
  },
  {
    id: "team_platinum_coders",
    type: "DUO",
    userId: "TEAM-10",
    partner1UserId: "TEAM-10",
    partner2UserId: "TEAM-10-B",
    name: "Platinum_coders",
    password: "Nexus#jAFp27",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-10" },
    partner2: { name: "Operative Bravo", userId: "TEAM-10-B" }
  },
  {
    id: "team_bug_buster",
    type: "DUO",
    userId: "TEAM-11",
    partner1UserId: "TEAM-11",
    partner2UserId: "TEAM-11-B",
    name: "Bug Buster",
    password: "Nexus#RbnZ62",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-11" },
    partner2: { name: "Operative Bravo", userId: "TEAM-11-B" }
  },
  {
    id: "team_sharaturi",
    type: "DUO",
    userId: "TEAM-12",
    partner1UserId: "TEAM-12",
    partner2UserId: "TEAM-12-B",
    name: "Sharaturi",
    password: "Nexus#5KLL12",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-12" },
    partner2: { name: "Operative Bravo", userId: "TEAM-12-B" }
  },
  {
    id: "team_swanik",
    type: "DUO",
    userId: "TEAM-04",
    partner1UserId: "TEAM-04",
    partner2UserId: "TEAM-04-B",
    name: "Swanik",
    password: "Nexus#dpfa12",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-04" },
    partner2: { name: "Operative Bravo", userId: "TEAM-04-B" }
  },
  {
    id: "team_mooncoderz",
    type: "DUO",
    userId: "TEAM-12",
    partner1UserId: "TEAM-12",
    partner2UserId: "TEAM-12-B",
    name: "Mooncoderz",
    password: "Nexus#gyvz92",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-12" },
    partner2: { name: "Operative Bravo", userId: "TEAM-12-B" }
  },
  {
    id: "team_as2",
    type: "DUO",
    userId: "TEAM-45",
    partner1UserId: "TEAM-45",
    partner2UserId: "TEAM-45-B",
    name: "As2",
    password: "Nexus#KVB748",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-45" },
    partner2: { name: "Operative Bravo", userId: "TEAM-45-B" }
  },
  {
    id: "team_yogesh_33",
    type: "DUO",
    userId: "TEAM-33",
    partner1UserId: "TEAM-33",
    partner2UserId: "TEAM-33-B",
    name: "Yogesh",
    password: "Nexus#W63X16",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-33" },
    partner2: { name: "Operative Bravo", userId: "TEAM-33-B" }
  },
  {
    id: "team_hydra",
    type: "DUO",
    userId: "TEAM_%%",
    partner1UserId: "TEAM_%%",
    partner2UserId: "TEAM_%%-B",
    name: "HYDRA",
    password: "Nexus#JQ2p54",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM_%%" },
    partner2: { name: "Operative Bravo", userId: "TEAM_%%-B" }
  },
  {
    id: "team_yogesh_22",
    type: "DUO",
    userId: "TEAM-22",
    partner1UserId: "TEAM-22",
    partner2UserId: "TEAM-22-B",
    name: "Yogesh",
    password: "Nexus#BrdJ15",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-22" },
    partner2: { name: "Operative Bravo", userId: "TEAM-22-B" }
  },
  {
    id: "team_syntax_404",
    type: "DUO",
    userId: "TEAM-15",
    partner1UserId: "TEAM-15",
    partner2UserId: "TEAM-15-B",
    name: "Team syntax 404",
    password: "Nexus#YAYh24",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-15" },
    partner2: { name: "Operative Bravo", userId: "TEAM-15-B" }
  },
  {
    id: "team_error_404",
    type: "DUO",
    userId: "TEAM-14",
    partner1UserId: "TEAM-14",
    partner2UserId: "TEAM-14-B",
    name: "Error 404",
    password: "Nexus#rKXm90",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-14" },
    partner2: { name: "Operative Bravo", userId: "TEAM-14-B" }
  },
  {
    id: "team_solo_avenger",
    type: "SOLO",
    userId: "TEAM-77",
    partner1UserId: "TEAM-77",
    partner2UserId: "TEAM-77-B",
    name: "SOLO Avenger",
    password: "Nexus#6XfF10",
    college: "Collegiate Arena",
    confirmed: true,
    score: 0,
    solved: [],
    penalties: 0,
    lastSolve: 0,
    partner1: { name: "Operative Alpha", userId: "TEAM-77" },
    partner2: { name: "Operative Bravo", userId: "TEAM-77-B" }
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
    const pubFile = path.join(__dirname, 'public', 'ctf_data.json');
    if (fs.existsSync(path.join(__dirname, 'public'))) {
      fs.writeFileSync(pubFile, JSON.stringify(ctfState, null, 2), 'utf8');
    }
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
  '.sql': 'text/plain; charset=UTF-8',
  '.zip': 'application/zip'
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
        (challenge.id === 'ch16' && submittedFlag.toLowerCase() === 'logicctf{c4nc3ll3d_but_4ct1v3_st4t3_d1sc0v3r3d}') ||
        (challenge.id === 'ch17' && (submittedFlag === 'logicCTF{h1dd3n_n4m3_pl4c3h0ld3r_unm4sk3d}' || submittedFlag === 'logicCTF{hidden_name_placeholder_unmasked}')) ||
        (challenge.id === 'ch18' && (submittedFlag === 'logicCTF{3xp0rt_csv_tru3_fl4g_r3v34l3d}' || submittedFlag === 'logicCTF{export_csv_true_flag_revealed}')) ||
        (challenge.id === 'ch19' && (submittedFlag.toLowerCase() === 'logicctf{f0rg0tt3n_m3nu_br4nd1ng_l0g0_ch4ng3d}' || submittedFlag.toLowerCase() === 'logicctf{forgotten_menu_branding_logo_changed}')) ||
        (challenge.id === 'ch20' && (submittedFlag.toLowerCase() === 'logicctf{4rch1v3_v4ult_r3c0v3ry_c0mpl14nc3}' || submittedFlag.toLowerCase() === 'logicctf{archive_vault_recovery_compliance}'));

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

      function normUid(s) {
        if (!s) return '';
        let u = s.toUpperCase().trim().replace(/\s+/g, '-');
        return u.replace(/^TEAM-0+([0-9]+)$/, 'TEAM-$1');
      }
      function normName(s) {
        if (!s) return '';
        return s.toLowerCase().replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/[_\-\s]+/g, ' ').trim();
      }

      const cleanUser = usernameInput.trim();
      const cleanPass = passwordInput.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      const nUser = normUid(cleanUser);
      const nName = normName(cleanUser);

      function matchesUser(t) {
        if (!t) return false;
        const tUid = (t.userId || '').toUpperCase().trim();
        const tP1 = (t.partner1UserId || '').toUpperCase().trim();
        const tP2 = (t.partner2UserId || '').toUpperCase().trim();
        const tName = (t.name || '').toLowerCase().trim();

        if (tUid === cleanUser.toUpperCase() || tP1 === cleanUser.toUpperCase() || tP2 === cleanUser.toUpperCase()) return true;
        if (normUid(tUid) === nUser || normUid(tP1) === nUser || normUid(tP2) === nUser) return true;
        if (tName === cleanUser.toLowerCase() || normName(tName) === nName) return true;
        if (t.id && t.id.toLowerCase() === cleanUser.toLowerCase()) return true;
        return false;
      }

      // Check Confirmed Participant Credentials (supports squad ID, partner aliases -A/-B, or team name)
      const participant = ctfState.teams.find(t => matchesUser(t) && t.password && t.password.trim() === cleanPass) ||
                          ctfState.teams.find(t => matchesUser(t));

      if (!participant || participant.password.trim() !== cleanPass) {
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
        type, // 'SOLO' or 'DUO'
        userId,
        partner1UserId: userId,
        partner2UserId: null,
        name,
        password,
        confirmed: true,
        college,
        partner1: {
          name: partner1Name || name,
          email: partner1Email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          userId: userId
        },
        partner2: partner2Name ? {
          name: partner2Name,
          email: partner2Email || `${name.toLowerCase().replace(/\s+/g, '')}_p2@gmail.com`,
          userId: userId
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

    const rawTarget = pathname.split('/')[4] || '';
    const targetId = decodeURIComponent(rawTarget).toLowerCase().trim();
    const parsedUrl = url.parse(req.url, true);
    const qUser = (parsedUrl.query && parsedUrl.query.userId ? String(parsedUrl.query.userId) : '').toLowerCase().trim();
    const qName = (parsedUrl.query && parsedUrl.query.name ? String(parsedUrl.query.name) : '').toLowerCase().trim();

    ctfState.teams = ctfState.teams.filter(t => {
      const tId = (t.id || '').toLowerCase().trim();
      const tUser = (t.userId || '').toLowerCase().trim();
      const tName = (t.name || '').toLowerCase().trim();
      if (targetId && (tId === targetId || tUser === targetId || tName === targetId)) return false;
      if (qUser && (tUser === qUser || tId === qUser)) return false;
      if (qName && tName === qName && (!qUser || tUser === qUser)) return false;
      return true;
    });
    saveState();
    broadcastSSE({ type: 'PARTICIPANT_DELETED', targetId });

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
    if (body.type === 'ALL_TEAMS') {
      ctfState.teams = [];
      ctfState.submissions = [];
      saveState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'All teams wiped successfully' }));
      return;
    }
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
  // API: FILE SHARING (CHALLENGE 6 - THE UI CONTRADICTION)
  // ==========================================
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

  // ==========================================
  // API: SECRET VOUCHER CLAIM (CHALLENGE 7 - THE SECRET SEARCH RESULT)
  // ==========================================
  if (pathname === '/api/billing/claim-voucher' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const voucherId = body.voucherId || 'INV-SECRET-077';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        voucherId: voucherId,
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

  // ==========================================
  // API: DEACTIVATE & ARCHIVE NODE (CHALLENGE 8 - THE WRONG WORKFLOW)
  // ==========================================
  if (pathname === '/api/projects/deactivate-node' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const projectId = body.projectId || 'proj-1';
      const projectName = body.projectName || 'Cyber Defense Challenge';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        projectId: projectId,
        projectName: projectName,
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

  // ==========================================
  // API: ARCHIVED PROJECT ACTION (CHALLENGE 9 - THE ARCHIVED PROJECT)
  // ==========================================
  if (req.method === 'POST' && pathname === '/api/projects/archived-action') {
    try {
      const body = await parseJsonBody(req);
      const projectId = body.projectId || 'proj-archived';
      const action = body.action || 'sign_manifest';

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        projectId: projectId,
        action: action,
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

  // ==========================================
  // API: DOCUMENT RENAME (CHALLENGE 10 - THE WRONG NAME)
  // ==========================================
  if (req.method === 'POST' && pathname === '/api/documents/rename') {
    try {
      const body = await parseJsonBody(req);
      const documentId = body.documentId || 'file-row-10';
      const originalName = body.originalName || 'Annual Project Report.md';
      const newName = (body.newName || '').trim();

      // Check if rename matches "Inception" (e.g. Inception.md, inception.md, Inception, Inception Report, etc.)
      // Also maintain backwards-compatibility with incident_response_runbook.pdf
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
          documentId: documentId,
          newName: canonicalDisplay,
          flag: 'logicCTF{wr0ng_n4m3_c0rr3ct_d0cum3nt_unm4sk3d}',
          message: `True identity verified! "${originalName}" correctly renamed to "${canonicalDisplay}" based on the movie reference context.`
        }));
        return;
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          verified: false,
          documentId: documentId,
          newName: newName,
          message: `Document renamed to "${newName}", but does not match the true identity revealed by the movie reference.`
        }));
        return;
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Document rename error: ' + e.message }));
      return;
    }
  }

  // ==========================================
  // API: DOWNLOAD CHALLENGE FILES
  // ==========================================
  if (pathname.startsWith('/api/files/') || pathname.startsWith('/challenge_files/')) {
    const rawFilename = path.basename(pathname);
    const filename = decodeURIComponent(rawFilename);
    const safePath = path.join(__dirname, 'challenge_files', filename);
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

  // ==========================================
  // STATIC FILE SERVING & CLEAN ROUTING
  // ==========================================
  let reqPath = pathname;
  if (reqPath.toLowerCase().startsWith('/logic_ctf')) {
    reqPath = reqPath.slice('/logic_ctf'.length) || '/';
  }
  if (!reqPath || reqPath === '') reqPath = '/';

  // Convenient Route Aliases - Landing goes directly to login
  if (reqPath === '/' || reqPath === '/index.html' || reqPath === '/login' || reqPath === '/login.html') {
    reqPath = '/login.html';
  } else if (reqPath === '/overview' || reqPath === '/overview.html') {
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
  } else if (reqPath === '/docs' || reqPath === '/docs.html' || reqPath === '/documentation' || reqPath === '/documentation.html' || reqPath === '/sop') {
    reqPath = '/documentation.html';
  } else if (reqPath === '/users' || reqPath === '/users.html') {
    reqPath = '/users.html';
  } else if (reqPath === '/archived_users' || reqPath === '/archived_users.html' || reqPath === '/archived-users' || reqPath === '/archived-users.html') {
    reqPath = '/archived_users.html';
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
    console.log(`  LOGIC BREAK CTF // LOGIC CTF COMMAND ARENA RUNNING  `);
    console.log(`  Local Gateway: http://localhost:${port}              `);
    console.log(`  Real-time SSE: http://localhost:${port}/api/events   `);
    console.log(`  Hardcoded Admin: admin / logicbreak_admin_2026        `);
    console.log(`=======================================================`);
  });
}

startServer(currentPort);
