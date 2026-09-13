/**
 * Logic Break CTF - Unified Navigation & Real-Time Sync Client
 */

(function() {
  const currentPath = window.location.pathname.toLowerCase();
  function isPage(names) {
    return names.some(n => currentPath.includes(n.toLowerCase()));
  }

  const isLoginPage = isPage(['login']);
  const isAdminPage = isPage(['admin']);
  const token = localStorage.getItem('logic_ctf_token');
  const adminToken = localStorage.getItem('logic_ctf_admin_token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('logic_ctf_user') || 'null');
  } catch (e) {
    user = null;
  }

  // Ensure default active team name from user session
  if (user && user.name) {
    localStorage.setItem('logic_ctf_team', user.name);
  }

  // Auth Guard: Redirect unauthenticated users to login.html
  if (!token && !adminToken && !isLoginPage) {
    window.location.href = 'login.html';
    return;
  }

  // Create Header HTML with full collegiate CTF navigation flow (LEADERBOARD REMOVED FOR PARTICIPANTS)
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
                <span class="text-sm font-black tracking-wider text-white uppercase font-mono">LOGIC BREAK CTF</span>
              </div>
              <p class="text-[10px] font-mono text-slate-400 leading-none">Collegiate Security Arena</p>
            </div>
          </a>
        </div>

        <!-- Center Navigation Links (Leaderboard Hidden from Participants) -->
        <nav class="hidden xl:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
          <a href="overview.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['overview', 'index']) || currentPath === '/' ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Overview</span>
          </a>

          <a href="missions.html" class="nav-link px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isPage(['missions', 'challenges']) ? 'bg-[#224f3e] text-[#5bdcae] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#1a211d]'}">
            <span>Missions (12)</span>
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
            <span>Admin</span>
          </a>
        </nav>

        <!-- Right Side: Confirmed Participant Badge & Logout -->
        <div class="flex items-center gap-3">
          <!-- Active Participant Credential Badge -->
          <div class="px-3 py-1.5 rounded-xl bg-[#1a211d] border border-[#2d3a4b] text-xs font-mono text-slate-300 flex items-center gap-2 shadow-inner">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-white font-bold">${user ? user.userId : (adminToken ? 'ADMIN' : 'OPERATIVE')}</span>
            <span class="text-slate-500">•</span>
            <span class="text-emerald-400 font-semibold max-w-[130px] truncate" id="nav-active-team-name">${user ? user.name : (adminToken ? 'Coordinator' : 'Confirmed')}</span>
          </div>

          <!-- Logout Button -->
          <button onclick="logoutLogicCTF()" class="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer" title="Sign out of arena session">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Global Toast Container -->
    <div id="logic-toast-shelf" class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"></div>
  `;

  // Inject or replace header
  window.addEventListener('DOMContentLoaded', () => {
    const existingHeader = document.querySelector('header');
    if (existingHeader) {
      existingHeader.outerHTML = navHtml;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHtml);
    }

    setupGlobalSync();
  });

  // Global Logout Function
  window.logoutLogicCTF = function() {
    localStorage.removeItem('logic_ctf_token');
    localStorage.removeItem('logic_ctf_user');
    localStorage.removeItem('logic_ctf_team');
    localStorage.removeItem('logic_ctf_admin_token');
    window.location.href = 'login.html';
  };

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
    } catch (e) {
      console.log('SSE running in fallback mode');
    }
  }
})();
