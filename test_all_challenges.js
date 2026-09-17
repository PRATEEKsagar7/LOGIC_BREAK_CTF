const http = require('http');

const FLAGS = [
  { id: 'ch1', flag: 'logicCTF{pr0j3ct_l1m1t_byp4ss_dupl1c4t3}', pts: 50 },
  { id: 'ch2', flag: 'logicCTF{purg3d_r3cycl3_b1n_csv_3xp0rt}', pts: 50 },
  { id: 'ch3', flag: 'logicCTF{t3xt4r34_r3s1z3_h1dd3n_buff3r_unl0ck}', pts: 50 },
  { id: 'ch4', flag: 'logicCTF{r3st0r3_purg3d_r3p0rt_int3gr1ty_unl0ck}', pts: 50 },
  { id: 'ch5', flag: 'logicCTF{DPG_badmos}', pts: 50 },
  { id: 'ch6', flag: 'logicCTF{u1_c0ntr4d1ct10n_f1l3_sh4r1ng_tru7h}', pts: 50 },
  { id: 'ch7', flag: 'logicCTF{s3cr3t_s34rch_unl1st3d_inv01c3_r3v34l3d}', pts: 50 },
  { id: 'ch8', flag: 'logicCTF{wr0ng_w0rkfl0w_4lt3rn4t1v3_p4th_c0mpl3t3d}', pts: 50 },
  { id: 'ch9', flag: 'logicCTF{4rch1v3d_pr0j3ct_h1st0ry_m0d1f13d_unl0ck}', pts: 50 },
  { id: 'ch10', flag: 'logicCTF{wr0ng_n4m3_c0rr3ct_d0cum3nt_unm4sk3d}', pts: 50 },
  { id: 'ch11', flag: 'logicCTF{ssrf_cl0ud_m3t4d4t4_cr3ds_pwn}', pts: 50 },
  { id: 'ch12', flag: 'logicCTF{su1d_pr1v1l3g3_3sc4l4t10n_r00t}', pts: 50 },
  { id: 'ch13', flag: 'logicCTF{tim_berners_lee}', pts: 50 },
  { id: 'ch14', flag: 'logicCTF{m1ss1ng_t4sk_unl1st3d_c0mpl3t3d}', pts: 50 },
  { id: 'ch15', flag: 'logicCTF{unsck3dul4bl3_sh4r3_c4l3nd4r_p4th}', pts: 50 },
  { id: 'ch16', flag: 'logicCTF{c4nc3ll3d_but_4ct1v3_st4t3_d1sc0v3r3d}', pts: 50 },
  { id: 'ch17', flag: 'logicCTF{h1dd3n_n4m3_pl4c3h0ld3r_unm4sk3d}', pts: 50 },
  { id: 'ch18', flag: 'logicCTF{3xp0rt_csv_tru3_fl4g_r3v34l3d}', pts: 50 },
  { id: 'ch19', flag: 'logicCTF{f0rg0tt3n_m3nu_br4nd1ng_l0g0_ch4ng3d}', pts: 50 },
  { id: 'ch20', flag: 'logicCTF{4rch1v3_v4ult_r3c0v3ry_c0mpl14nc3}', pts: 50 }
];

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runAudit() {
  console.log('=====================================================');
  console.log('  LOGIC BREAK CTF // COMPREHENSIVE CHALLENGE AUDIT   ');
  console.log('=====================================================\\n');

  // 1. Fetch challenge definitions
  const chalData = await request('/api/challenges');
  console.log(`[CATALOG] /api/challenges count: ${chalData.challenges ? chalData.challenges.length : 0}`);

  for (const f of FLAGS) {
    const found = chalData.challenges.find(c => c.id === f.id);
    if (!found) {
      console.error(`[FAIL] Challenge ${f.id} missing from catalog!`);
    } else {
      console.log(`[CATALOG OK] ${f.id.padEnd(5)} | #${String(found.number).padStart(2, '0')} | ${found.title.padEnd(30)} | ${found.points} pts | Tier ${found.tier}`);
    }
  }

  console.log('\n--- TESTING SUBMISSION OF ALL 20 FLAGS (CODEPIRATE) ---');
  let passedCount = 0;
  for (const f of FLAGS) {
    const res = await request('/api/submit', 'POST', {
      team: 'CODEPIRATE',
      challengeId: f.id,
      flag: f.flag
    });
    if (res.success) {
      passedCount++;
      console.log(`[SUCCESS] ${f.id.toUpperCase().padEnd(5)} -> +${res.points} PTS awarded. Score now: ${res.newScore} PTS`);
    } else if (res.status === 'already_solved') {
      passedCount++;
      console.log(`[VERIFIED] ${f.id.toUpperCase().padEnd(5)} -> Already Solved. Flag accepted.`);
    } else {
      console.error(`[FAILED] ${f.id.toUpperCase().padEnd(5)} ->`, res);
    }
  }

  // 4. Check Leaderboard
  const lbData = await request('/api/leaderboard');
  console.log('\\n--- LEADERBOARD STATE ---');
  if (lbData.leaderboard && lbData.leaderboard.length > 0) {
    const t = lbData.leaderboard[0];
    console.log(`Top Team: ${t.name} | Solved: ${t.solvedCount || (t.solved ? t.solved.length : 0)} / 16 | Score: ${t.score} PTS`);
  }

  console.log(`\\n=====================================================`);
  console.log(`  AUDIT COMPLETE: ${passedCount}/${FLAGS.length} CHALLENGES FULLY VERIFIED`);
  console.log(`=====================================================`);
}

runAudit().catch(console.error);
