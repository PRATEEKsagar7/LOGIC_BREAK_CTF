/**
 * Logic Break CTF - Unified Navigation & Real-Time Sync Client
 */

(function() {
  // Ensure default active team
  if (!localStorage.getItem('logic_ctf_team')) {
    localStorage.setItem('logic_ctf_team', 'Logic Breakers');
  }

  const activeTeam = localStorage.getItem('logic_ctf_team');
  const isAdmin = localStorage.getItem('logic_ctf_admin_token') === 'logicbreak_admin_token_active_session_2026';

  // Determine current page
  const currentPath = window.location.pathname.toLowerCase();

  function isPage(names) {
    return names.some(n => currentPath.includes(n.toLowerCase()));
  }

  // Create Header HTML with full collegiate CTF navigation flow
  const navHtml = `
    <header class="sticky top-0 z-50 w-full bg-[#0e1511]/95 backdrop-blur-xl border-b border-[#2d3a4b] shadow-lg">
      <div class="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3 shrink-0">
          <a href="overview.html" class="flex items-center gap-2.5 group">
            <div class="w-9 h-9 rounded-xl bg-[#1a211d] border border-emerald-500/40 flex items-center justify-center text-[#5bdcae] shadow-[0_0_15px_rgba(91,220,174,0.25)] group-hover:scale-105 transition-transform">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17l10 5 10-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-black tracking-wider text-white uppercase font-mono">LOGIC BREAK</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-[#5bdcae] border border-emerald-500/30">CTF '26</span>
              </div>
              <p class="text-[10px] font-mono text-slate-400 leading-none">Collegiate Security Arena</p>
            </div>
          </a>
        </div>

        <!-- Center Navigation Links (Linewise Collegiate Flow) -->
        <nav class="hidden xl:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
          <a href="overview.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['overview', 'index']) || currentPath === '/' ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Overview</span>
          </a>

          <a href="missions.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['missions', 'challenges']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Missions (12)</span>
          </a>

          <a href="leaderboard.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['leaderboard', 'standings']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Leaderboard</span>
          </a>

          <a href="files.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['files', 'folder']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Files & Docs</span>
          </a>

          <a href="schedule.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['schedule', 'task']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Schedule</span>
          </a>

          <a href="reports.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['reports']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Reports</span>
          </a>

          <a href="workspace.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['workspace']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Workspace</span>
          </a>

          <!-- More Dropdown -->
          <div class="relative group">
            <button class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-slate-300 hover:text-white hover:bg-[#1a211d]">
              <span>More</span>
              <svg class="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
              <div class="w-48 bg-[#161d19] border border-[#2d3a4b] rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5">
                <a href="projects.html" class="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#224f3e] transition">Projects Archive</a>
                <a href="billing.html" class="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#224f3e] transition">Billing Plans</a>
                <a href="recycle_bin.html" class="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#224f3e] transition">Purged Artifacts</a>
              </div>
            </div>
          </div>

          <!-- Admin Link -->
          <a href="admin.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['members', 'admin']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Admin</span>
          </a>
        </nav>

        <!-- Right Side: Sync status + Team Selector -->
        <div class="flex items-center gap-3">
          <!-- Live Auto-Sync Indicator -->
          <div id="sync-status-indicator" class="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/40 rounded-full shadow-[0_0_10px_rgba(91,220,174,0.15)] text-xs font-mono text-[#5bdcae]">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span class="hidden sm:inline">LIVE SYNC</span>
          </div>

          <!-- Active Team Switcher Badge -->
          <div class="relative">
            <button id="btnTeamModalTrigger" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a211d] border border-[#2d3a4b] hover:border-emerald-500/50 text-xs font-semibold text-white transition">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span class="max-w-[110px] truncate" id="nav-active-team-name">${activeTeam}</span>
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>

          ${isAdmin ? `
            <a href="admin.html" class="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold uppercase">ADMIN</a>
          ` : ''}
        </div>
      </div>
    </header>

    <!-- Global Toast Container -->
    <div id="logic-toast-shelf" class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"></div>

    <!-- Switch Team Modal -->
    <div id="modal-switch-team" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-[#121820] border border-[#2d3a4b] rounded-2xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-[#2d3a4b] pb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-950 text-[#5bdcae] flex items-center justify-center border border-emerald-500/30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Select or Register Team</h3>
          </div>
          <button onclick="document.getElementById('modal-switch-team').classList.add('hidden')" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

        <p class="text-xs text-slate-300">Choose an existing collegiate collective or register your squad name below:</p>

        <div class="space-y-2">
          <label class="text-[11px] font-bold text-slate-400 uppercase">Existing Arena Teams</label>
          <select id="select-existing-teams" class="w-full bg-[#1a211d] border border-[#2d3a4b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            <option value="Null Vector">Null Vector (Technova University)</option>
            <option value="Byte Raiders">Byte Raiders (Nexus Institute)</option>
            <option value="Root Squad">Root Squad (National Cyber Academy)</option>
            <option value="Cyber Phantoms">Cyber Phantoms (Apex Polytechnic)</option>
            <option value="Kernel Panic">Kernel Panic (Metro Cyber College)</option>
            <option value="Bit Shifters">Bit Shifters (Vanguard Tech Institute)</option>
            <option value="Zero Day Cell">Zero Day Cell (Pacific State University)</option>
            <option value="Logic Breakers" selected>Logic Breakers (Host College Collective)</option>
          </select>
        </div>

        <div class="space-y-2 pt-2 border-t border-[#2d3a4b]/60">
          <label class="text-[11px] font-bold text-slate-400 uppercase">Or Register Custom Team Name</label>
          <input type="text" id="input-custom-team" placeholder="e.g. CyberKnights" class="w-full bg-[#1a211d] border border-[#2d3a4b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500">
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#2d3a4b]">
          <button onclick="document.getElementById('modal-switch-team').classList.add('hidden')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
          <button id="btnSaveTeamSelection" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-[#5bdcae] text-slate-950 font-bold text-xs shadow-lg transition">Apply Team</button>
        </div>
      </div>
    </div>
  `;

  // Inject or replace header
  window.addEventListener('DOMContentLoaded', () => {
    const existingHeader = document.querySelector('header');
    if (existingHeader) {
      existingHeader.outerHTML = navHtml;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHtml);
    }

    // Modal Trigger
    const btnTeamModal = document.getElementById('btnTeamModalTrigger');
    if (btnTeamModal) {
      btnTeamModal.addEventListener('click', () => {
        document.getElementById('modal-switch-team').classList.remove('hidden');
      });
    }

    // Save team selection
    const btnSaveTeam = document.getElementById('btnSaveTeamSelection');
    if (btnSaveTeam) {
      btnSaveTeam.addEventListener('click', () => {
        const customName = document.getElementById('input-custom-team').value.trim();
        const selected = customName || document.getElementById('select-existing-teams').value;
        if (selected) {
          localStorage.setItem('logic_ctf_team', selected);
          const activeDisplay = document.getElementById('nav-active-team-name');
          if (activeDisplay) activeDisplay.textContent = selected;
          document.getElementById('modal-switch-team').classList.add('hidden');
          window.showLogicToast && window.showLogicToast(`Team switched to "${selected}"`, 'info');
          if (window.onTeamChanged) {
            window.onTeamChanged(selected);
          } else {
            setTimeout(() => window.location.reload(), 400);
          }
        }
      });
    }

    setupGlobalSync();
  });

  // Global Toast Function
  window.showLogicToast = function(message, type = 'info') {
    const shelf = document.getElementById('logic-toast-shelf');
    if (!shelf) return;

    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'border-emerald-500 bg-[#0f221a] text-emerald-300' :
                       type === 'error' ? 'border-red-500 bg-[#261214] text-red-300' :
                       'border-cyan-500 bg-[#0f1d26] text-cyan-300';

    toast.className = `pointer-events-auto px-4 py-3 rounded-xl border ${colorClass} shadow-xl text-xs font-mono flex items-center gap-2.5 max-w-md animate-bounce transition-all duration-300`;
    toast.innerHTML = `
      <span class="text-base">${type === 'success' ? '🚩' : type === 'error' ? '⚠️' : '⚡'}</span>
      <div class="flex-1 font-semibold">${message}</div>
    `;

    shelf.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  // Setup Server-Sent Events (SSE)
  function setupGlobalSync() {
    try {
      const eventSource = new EventSource('/api/events');
      const indicator = document.getElementById('sync-status-indicator');

      eventSource.onopen = () => {
        if (indicator) {
          indicator.classList.remove('border-red-500/50', 'text-red-400');
          indicator.classList.add('border-emerald-500/40', 'text-[#5bdcae]');
        }
      };

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'FLAG_SOLVED') {
            window.showLogicToast(`🎉 ${data.team} solved "${data.challengeTitle}" (+${data.pointsGained} pts)!`, 'success');
          } else if (data.type === 'FLAG_PENALTY') {
            window.showLogicToast(`⚠️ ${data.team} failed attempt on "${data.challengeTitle}" (-${data.penalty} pts penalty)`, 'error');
          }

          if (window.onLeaderboardEvent) {
            window.onLeaderboardEvent(data);
          }
        } catch (err) {
          // heartbeat
        }
      };

      eventSource.onerror = () => {
        if (indicator) {
          indicator.classList.remove('border-emerald-500/40', 'text-[#5bdcae]');
          indicator.classList.add('border-amber-500/40', 'text-amber-400');
        }
      };
    } catch (e) {
      console.log('SSE running in fallback mode');
    }
  }
})();
