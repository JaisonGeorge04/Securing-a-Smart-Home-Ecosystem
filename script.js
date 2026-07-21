/* ═══════════════════════════════════════════════════
   SMART HOME SECURITY HUB — script.js
   All interactive behaviour lives here.
═══════════════════════════════════════════════════ */
 
/* ── PAGE INIT ────────────────────────────────────
   Runs once when the page has fully loaded.
─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {

  // Login form handler (if on login page)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const user = document.getElementById('username').value;
      const pass = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');
      
      if (user === 'admin' && pass === 'admin123') {
        sessionStorage.setItem('isAuthenticated', 'true');
        addLog('log-ok', '[OK] Successful login by admin');
        window.location.href = 'index.html';
      } else {
        errorDiv.classList.remove('hidden');
        addLog('log-warn', '[WARN] Failed login attempt');
      }
    });
    // Don't run rest of init if on login page
    return;
  }

  // Set the timestamp on the first log entry
  const initTime = document.getElementById('init-time');
  if (initTime) {
    initTime.textContent = getTime();
  }

  // Set the footer year automatically
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Render initial devices list
  renderDevices();
});

// Logout function
function logout() {
  sessionStorage.removeItem('isAuthenticated');
  window.location.href = 'login.html';
}

/* ── SECTION A: MAIN TAB SWITCHING ──────────────
   Called by the three main nav buttons.
   id  = 'posture' | 'threats' | 'education'
   btn = the button element that was clicked
─────────────────────────────────────────────────── */
function showSection(id, btn) {

  // Step 1 — hide every section
  var sections = document.querySelectorAll('.section');
  sections.forEach(function (s) {
    s.classList.remove('active');
  });

  // Step 2 — remove active style from all nav buttons
  var navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(function (b) {
    b.classList.remove('active');
  });

  // Step 3 — show the target section
  var target = document.getElementById('sec-' + id);
  if (target) {
    target.classList.add('active');
  }

  // Step 4 — highlight the clicked button
  if (btn) btn.classList.add('active');
}


/* ── SECTION A: COLLAPSIBLE LAYERS ───────────────
   Called when a layer header is clicked.
   Expands or collapses the body beneath it.
─────────────────────────────────────────────────── */
function toggleLayer(header) {

  // The body div sits immediately after the header
  var body = header.nextElementSibling;

  // Toggle the 'open' class on both — CSS handles visibility
  body.classList.toggle('open');
  header.classList.toggle('open');
}

/* ── SECTION C: EDUCATION SUB-TABS ──────────────
   Called by the three education tab buttons.
   tabId = 'guidelines' | 'modules' | 'advisories'
   btn   = the tab button that was clicked
─────────────────────────────────────────────────── */
function showEduTab(tabId, btn) {

  // Hide all education panels
  var panels = document.querySelectorAll('.edu-panel');
  panels.forEach(function (p) {
    p.classList.remove('active');
  });

  // Remove active from all edu tab buttons
  var tabs = document.querySelectorAll('.edu-tab');
  tabs.forEach(function (t) {
    t.classList.remove('active');
  });

  // Show the chosen panel
  var panel = document.getElementById('edu-' + tabId);
  if (panel) {
    panel.classList.add('active'); 
  }

  // Mark the clicked tab as active
  btn.classList.add('active');
}

/* ── SECTION C: CHECKLIST ────────────────────────
   Called when a checklist item is clicked.
   Ticks or unticks the item and updates the progress bar.
─────────────────────────────────────────────────── */
var checkedCount = 0;      // tracks how many items are ticked
var totalItems = 7;        // total number of checklist items

function checkItem(itemEl) {

  var box = itemEl.querySelector('.check-box');

  // classList.toggle returns true if class was ADDED, false if removed
  var isNowChecked = box.classList.toggle('checked');

  // Update the running count
  if (isNowChecked) {
    checkedCount = checkedCount + 1;
    itemEl.classList.add('done');
  } else {
    checkedCount = checkedCount - 1;
    itemEl.classList.remove('done');
  }

  // Calculate percentage — Math.round prevents ugly decimals
  var pct = Math.round((checkedCount / totalItems) * 100);

  // Update the progress bar width
  var fill = document.getElementById('prog-fill');
  if (fill) {
    fill.style.width = pct + '%';
  }

  // Update the text labels
  var progText = document.getElementById('prog-text');
  if (progText) {
    progText.textContent = checkedCount + ' of ' + totalItems + ' complete';
  }

  var progPct = document.getElementById('prog-pct');
  if (progPct) {
    progPct.textContent = pct + '%';
  }
}

/* ── SECTION B: SECURITY CONTROLS ───────────────
   Toggle switches logic
─────────────────────────────────────────────────── */
function toggleControl(controlName, checkbox) {
  const isEnabled = checkbox.checked;
  const status = isEnabled ? 'enabled' : 'disabled';
  const colorClass = isEnabled ? 'log-ok' : 'log-warn';
  
  // Log the control change
  addLog(colorClass, `[INFO] Security Control: ${controlName.toUpperCase()} is now ${status}`);
  showToast('Control Updated', `${controlName.toUpperCase()} has been ${status}.`, isEnabled ? 'info' : 'warn');
}

/* ── SECTION C: DEVICE MANAGEMENT ───────────────
   Logic for handling devices
─────────────────────────────────────────────────── */

// In-memory array of devices (could be loaded from localStorage)
let devices = [
  { id: 1, name: 'Smart Hub Controller', ip: '192.168.1.1', mac: '00:1A:2B:3C:4D:5E', status: 'safe' },
  { id: 2, name: 'Living Room Thermostat', ip: '192.168.1.30', mac: 'A1:B2:C3:D4:E5:F6', status: 'safe' },
  { id: 3, name: 'Front Door Camera', ip: '192.168.1.42', mac: '12:34:56:78:90:AB', status: 'safe' },
  { id: 4, name: 'Garage Smart Plug', ip: '192.168.1.55', mac: 'AA:BB:CC:DD:EE:FF', status: 'safe' }
];

function renderDevices() {
  const tbody = document.getElementById('device-list');
  
  // Update System Status counter if present
  const countEl = document.getElementById('status-device-count');
  if (countEl) {
    countEl.textContent = devices.length;
  }

  if (!tbody) return;

  tbody.innerHTML = ''; // Clear current

  devices.forEach(dev => {
    const tr = document.createElement('tr');
    
    // Status formatting
    const statusClass = dev.status === 'safe' ? 'status-safe' : 'status-compromised';
    const toggleBtnText = dev.status === 'safe' ? 'Mark Compromised' : 'Mark Safe';
    const toggleBtnClass = dev.status === 'safe' ? 'btn-outline' : 'btn-primary';

    tr.innerHTML = `
      <td>
        <div class="device-name">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
          ${dev.name}
        </div>
      </td>
      <td><span style="font-family: var(--font-mono); color: var(--text2);">${dev.ip}</span></td>
      <td><span style="font-family: var(--font-mono); color: var(--text3);">${dev.mac}</span></td>
      <td><span class="status-badge ${statusClass}">${dev.status}</span></td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="${toggleBtnClass}" style="font-size: 11px; padding: 4px 8px;" onclick="toggleDeviceStatus(${dev.id})">${toggleBtnText}</button>
          <button class="btn-danger" style="font-size: 11px; padding: 4px 8px;" onclick="removeDevice(${dev.id})">Remove</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function addMockDevice() {
  const mockNames = ['Kitchen Display', 'Smart Speaker', 'Outdoor Camera', 'Smart Lock', 'Vacuum Robot'];
  const newId = devices.length ? Math.max(...devices.map(d => d.id)) + 1 : 1;
  const newName = mockNames[Math.floor(Math.random() * mockNames.length)];
  const newIp = `192.168.1.${Math.floor(Math.random() * 200) + 50}`;
  
  // Random MAC generator
  const hex = "0123456789ABCDEF";
  let mac = "";
  for (let i = 0; i < 6; i++) {
    mac += hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
    if (i < 5) mac += ":";
  }

  devices.push({
    id: newId,
    name: newName,
    ip: newIp,
    mac: mac,
    status: 'safe'
  });

  renderDevices();
  addLog('log-info', `[INFO] New device connected: ${newName} (${newIp})`);
  showToast('Device Connected', `${newName} joined the network at ${newIp}.`, 'info');
}

function removeDevice(id) {
  const dev = devices.find(d => d.id === id);
  if (dev) {
    devices = devices.filter(d => d.id !== id);
    renderDevices();
    addLog('log-info', `[INFO] Device disconnected: ${dev.name} (${dev.ip})`);
  }
}

function toggleDeviceStatus(id) {
  const dev = devices.find(d => d.id === id);
  if (dev) {
    dev.status = dev.status === 'safe' ? 'compromised' : 'safe';
    renderDevices();
    
    if (dev.status === 'compromised') {
      addLog('log-crit', `[CRIT] Device manually marked COMPROMISED: ${dev.name}`);
      showToast('Device Compromised', `${dev.name} marked as compromised.`, 'crit');
    } else {
      addLog('log-ok', `[OK] Device restored to SAFE status: ${dev.name}`);
    }
  }
}

/* ── SECTION B: THREAT SIMULATOR ────────────────
   Adds log entries to the live monitor feed.
   Each sim type fires a sequence of entries with delays.
─────────────────────────────────────────────────── */

// Helper: returns the current time as HH:MM:SS
function getTime() {
  return new Date().toTimeString().slice(0, 8);
}

// Helper: creates and appends a single log row
function addLog(cssClass, message) {
  // Always save to persistent storage
  saveLogToStorage(getTime(), cssClass, message);

  var logEl = document.getElementById('sim-log');
  if (!logEl) return;

  var row = document.createElement('div');
  row.className = 'log-entry';

  // Build the inner HTML with a timestamp + coloured message
  row.innerHTML =
    '<span class="log-time">' + getTime() + '</span>' +
    '<span class="' + cssClass + '">' + message + '</span>';

  logEl.appendChild(row);

  // Auto-scroll to keep the newest entry visible
  logEl.scrollTop = logEl.scrollHeight;
}

// Save log array to localStorage
function saveLogToStorage(time, cssClass, message) {
  let logs = [];
  try {
    const saved = localStorage.getItem('sh_logs');
    if (saved) logs = JSON.parse(saved);
  } catch (e) {
    console.error("Error reading logs", e);
  }
  
  logs.push({ time, cssClass, message });
  
  // Keep last 100 logs
  if (logs.length > 100) logs.shift();
  
  localStorage.setItem('sh_logs', JSON.stringify(logs));
}

// Download logs as TXT
function downloadLogs() {
  let logs = [];
  try {
    const saved = localStorage.getItem('sh_logs');
    if (saved) logs = JSON.parse(saved);
  } catch (e) {}

  if (logs.length === 0) {
    alert("No logs to download.");
    return;
  }

  let fileContent = "=== SMART HOME SECURITY HUB LOGS ===\r\n\r\n";
  logs.forEach(l => {
    // Strip HTML/CSS tags for plain text
    fileContent += `[${l.time}] ${l.message}\r\n`;
  });

  const blob = new Blob([fileContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `security_logs_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate web audio beep for critical alerts
function playBeep(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'crit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'warn') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Audio context may not be allowed without interaction, ignore
  }
}

// Toast notification function
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  if (type === 'crit') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    playBeep('crit');
  } else if (type === 'warn') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    playBeep('warn');
  } else {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300); // Wait for animation to finish
  }, 5000);
}

// Helper: wraps setTimeout so each delay is cumulative
function logAfter(ms, cssClass, message) {
  setTimeout(function () {
    addLog(cssClass, message);
  }, ms);
}

// Main simulation dispatcher
function simEvent(type) {
  
  // Helper to get random mock IP
  const rndIp = () => `192.168.1.${Math.floor(Math.random() * 100) + 10}`;
  
  if (type === 'portscan') {
    const target = rndIp();
    addLog('log-warn', `[WARN]  ${target} (Smart Device) → 212 SYN packets in 4s`);
    logAfter(700,  'log-crit', `[CRIT]  Port scan detected — device ${target} flagged`);
    logAfter(1300, 'log-crit', `[CRIT]  Quarantining ${target} to sandbox VLAN`);
    logAfter(2000, 'log-ok',   '[OK]    Firewall rule applied — device isolated');
    logAfter(2600, 'log-info', '[INFO]  Push notification sent to homeowner');
    
    setTimeout(() => showToast('Port Scan Detected', `Device ${target} isolated.`, 'crit'), 1300);

  } else if (type === 'brute') {
    const attacker = `203.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    addLog('log-warn', '[WARN]  5 failed SSH login attempts on hub (192.168.1.1)');
    logAfter(600,  'log-warn', `[WARN]  Threshold exceeded — source IP: ${attacker}`);
    logAfter(1200, 'log-crit', '[CRIT]  Brute-force detected — fail2ban rule triggered');
    logAfter(1800, 'log-ok',   `[OK]    IP ${attacker} blocked for 24 hours`);
    logAfter(2400, 'log-info', '[INFO]  Incident logged — 2FA enforcement nudge sent');
    
    setTimeout(() => showToast('Brute Force Blocked', `IP ${attacker} has been blocked.`, 'crit'), 1200);

  } else if (type === 'exfil') {
    const target = rndIp();
    addLog('log-warn', `[WARN]  Device (${target}) uploading 47 MB to unknown IP`);
    logAfter(700,  'log-warn', '[WARN]  Destination 185.220.101.0 — not on allowlist');
    logAfter(1300, 'log-crit', '[CRIT]  Traffic +4700% above daily baseline — anomaly flagged');
    logAfter(1900, 'log-crit', '[CRIT]  Outbound blocked — device placed in restricted mode');
    logAfter(2600, 'log-info', '[INFO]  Homeowner alert sent with full traffic report');
    
    setTimeout(() => showToast('Data Exfiltration Attempt', `Anomalous traffic from ${target} blocked.`, 'crit'), 1300);

  } else if (type === 'ok') {
    addLog('log-ok',  `[OK]    All ${devices.length} devices — traffic within normal baseline`);
    logAfter(400, 'log-ok',   '[OK]    No anomalies detected');
    logAfter(800, 'log-info', '[INFO]  Last firmware check: all devices up-to-date');
  }
}

// Clears all log entries and adds the initialised message back
function clearLog() {
  var logEl = document.getElementById('sim-log');
  if (!logEl) return;

  logEl.innerHTML =
    '<div class="log-entry">' +
      '<span class="log-time">' + getTime() + '</span>' +
      '<span class="log-ok">[OK]    Log cleared — monitor active</span>' +
    '</div>';
}
