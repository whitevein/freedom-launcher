/* ─── Debug ─── */
window.addEventListener('error', (e) => {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#e74c3c;color:#fff;padding:8px;font-size:11px;z-index:999;font-family:monospace';
  el.textContent = e.message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
});

/* ─── Config ─── */

const API_BASE = localStorage.getItem('apiBase') || 'https://server-poe.onrender.com';
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let authToken = localStorage.getItem('authToken') || null;
let authUser = localStorage.getItem('authUser') || null;
let authIsAdmin = localStorage.getItem('authIsAdmin') === 'true';
let isRegisterMode = false;
let hwid = null;

/* ─── Sound System ─── */

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    switch (type) {
      case 'click':
        osc.frequency.value = 900;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.start(t); osc.stop(t + 0.04);
        break;
      case 'launch':
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.linearRampToValueAtTime(750, t + 0.18);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t); osc.stop(t + 0.22);
        break;
      case 'success': {
        osc.frequency.setValueAtTime(523, t);
        osc.frequency.setValueAtTime(659, t + 0.1);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.25);
        break;
      }
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.value = 180;
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.25);
        break;
      case 'kill':
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.12);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t); osc.stop(t + 0.15);
        break;
    }
  } catch (_) {}
}

/* ─── Toast Notifications ─── */

function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ─── Color Picker ─── */

const savedColor = localStorage.getItem('accentColor') || '#8B5CF6';
applyColor(savedColor, false);

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function applyColor(color, save = true) {
  document.documentElement.style.setProperty('--accent', color);
  const rgb = hexToRgb(color);
  document.documentElement.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  if (save) localStorage.setItem('accentColor', color);
}

const colorPicker = document.getElementById('color-picker');
document.querySelectorAll('.cp-swatch').forEach(el => {
  if (el.dataset.color === savedColor) el.classList.add('active');
  el.addEventListener('click', () => {
    playSound('click'); applyColor(el.dataset.color);
    document.getElementById('cp-input').value = el.dataset.color;
    document.querySelectorAll('.cp-swatch').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  });
});
document.getElementById('cp-input').addEventListener('input', (e) => applyColor(e.target.value));
document.addEventListener('click', (e) => { if (!colorPicker.contains(e.target) && !e.target.closest('#pm-color')) colorPicker.classList.remove('open'); });

/* ─── Sound Toggle ─── */

const soundBtn = document.getElementById('sound-btn');
function updateSoundBtn() {
  soundBtn.style.color = soundEnabled ? '' : '#e74c3c';
}
updateSoundBtn();
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled);
  updateSoundBtn();
  if (soundEnabled) playSound('click');
});

/* ─── Theme Toggle ─── */

let isLight = localStorage.getItem('theme') === 'light';
function applyTheme(light) {
  document.documentElement.classList.toggle('light', light);
  document.getElementById('pm-theme-val').textContent = light ? 'Light' : 'Dark';
  localStorage.setItem('theme', light ? 'light' : 'dark');
}
applyTheme(isLight);

/* ─── Profile Menu ─── */

const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.getElementById('profile-menu');
profileBtn.addEventListener('click', (e) => {
  playSound('click');
  document.getElementById('pm-username').innerHTML = `${escapeHtml(authUser || 'user')}${authIsAdmin ? ' <span style="color:var(--accent);font-size:9px;font-weight:700;letter-spacing:0.5px">ADMIN</span>' : ''}`;
  profileMenu.classList.toggle('open');
  e.stopPropagation();
});
document.getElementById('pm-theme').addEventListener('click', () => {
  playSound('click');
  isLight = !isLight;
  applyTheme(isLight);
  showToast(isLight ? 'Light theme' : 'Dark theme', 'info');
  profileMenu.classList.remove('open');
});
document.getElementById('pm-color').addEventListener('click', () => {
  playSound('click');
  profileMenu.classList.remove('open');
  colorPicker.classList.toggle('open');
});
document.getElementById('pm-about').addEventListener('click', () => {
  playSound('click');
  profileMenu.classList.remove('open');
  document.getElementById('about-overlay').style.display = 'flex';
});
document.getElementById('about-close').addEventListener('click', () => {
  document.getElementById('about-overlay').style.display = 'none';
});
document.getElementById('about-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});

document.getElementById('pm-admin').addEventListener('click', () => {
  playSound('click');
  openAdminPanel();
});
document.getElementById('admin-close').addEventListener('click', () => {
  document.getElementById('admin-overlay').style.display = 'none';
});
document.getElementById('admin-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});
document.getElementById('friend-add-btn').addEventListener('click', async () => {
  const input = document.getElementById('friend-add-input');
  const username = input.value.trim();
  if (!username) return;
  input.value = '';
  try {
    const res = await fetch(`${API_BASE}/api/friend/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: authToken, username }),
    });
    const d = await res.json();
    if (d.success) showToast(`Request sent to ${username}`, 'success');
    else showToast(d.error || 'Failed', 'error');
  } catch { showToast('Cannot reach server', 'error'); }
});
document.getElementById('friend-add-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('friend-add-btn').click(); }
});

document.getElementById('admin-grant-btn').addEventListener('click', () => {
  playSound('click');
  grantAdmin();
});
document.getElementById('admin-target').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); playSound('click'); grantAdmin(); }
});

document.getElementById('pm-check-update').addEventListener('click', () => {
  if (newVersionBtn.textContent === 'Install Now') {
    profileMenu.classList.remove('open');
    window.launcher.installUpdate();
  } else {
    window.launcher.checkUpdate();
  }
});

document.getElementById('pm-logout').addEventListener('click', () => {
  playSound('click');
  profileMenu.classList.remove('open');
  authToken = null; authUser = null;
  localStorage.removeItem('authToken'); localStorage.removeItem('authUser');
  window.launcher.setAuthToken(null);
  authOverlay.classList.add('visible');
  showToast('Logged out', 'info');
});
document.addEventListener('click', (e) => {
  if (!profileMenu.contains(e.target) && !e.target.closest('#profile-btn')) {
    profileMenu.classList.remove('open');
  }
});

/* ─── Auth ─── */

const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authEmail = document.getElementById('reg-email');
const authConfirm = document.getElementById('reg-confirm');
const authError = document.getElementById('auth-error');
const authBtn = document.getElementById('auth-btn');
const authBtnText = document.querySelector('.auth-btn-text');
const authSub = document.getElementById('auth-sub');
const emailGroup = document.getElementById('email-group');
const confirmGroup = document.getElementById('confirm-group');
const switchText = document.getElementById('auth-switch-text');
const switchBtn = document.getElementById('auth-switch-btn');

function showAuthError(msg) { authError.textContent = msg; }

function setAuthLoading(loading) {
  authBtn.classList.toggle('loading', loading);
  authBtn.disabled = loading;
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  if (isRegisterMode) {
    authSub.textContent = 'Create your account';
    authBtnText.textContent = 'Register';
    switchText.textContent = 'Already have an account?';
    switchBtn.textContent = 'Sign In';
    emailGroup.style.display = '';
    confirmGroup.style.display = '';
  } else {
    authSub.textContent = 'Sign in to continue';
    authBtnText.textContent = 'Sign In';
    switchText.textContent = "Don't have an account?";
    switchBtn.textContent = 'Register';
    emailGroup.style.display = 'none';
    confirmGroup.style.display = 'none';
  }
  authError.textContent = '';
}

switchBtn.addEventListener('click', () => { playSound('click'); toggleAuthMode(); });

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showAuthError('');
  const username = authUsername.value.trim();
  const password = authPassword.value;

  if (!username || !password) { showAuthError('Fill in all fields'); return; }

  if (isRegisterMode) {
    const email = authEmail.value.trim();
    const confirm = authConfirm.value;
    if (!email) { showAuthError('Enter your email'); return; }
    if (password !== confirm) { showAuthError('Passwords do not match'); return; }
    if (password.length < 6) { showAuthError('Password must be 6+ characters'); return; }
    await doRegister(username, email, password);
  } else {
    await doLogin(username, password);
  }
});

async function getHwid() {
  if (hwid) return hwid;
  try {
    hwid = await window.launcher.getHwid();
    return hwid;
  } catch (_) {
    hwid = 'unknown-' + Math.random().toString(36).slice(2, 10);
    return hwid;
  }
}

async function apiPost(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Cannot connect to auth server' };
  }
}

async function doRegister(username, email, password) {
  setAuthLoading(true);
  const hwidVal = await getHwid();
  const result = await apiPost('/api/register', { username, email, password, hwid: hwidVal });
  setAuthLoading(false);

  if (result.success) {
    onAuthSuccess(result.token, username, result.is_admin);
  } else {
    showAuthError(result.error || 'Registration failed');
    playSound('error');
  }
}

async function doLogin(username, password) {
  setAuthLoading(true);
  const hwidVal = await getHwid();
  const result = await apiPost('/api/login', { username, password, hwid: hwidVal });
  setAuthLoading(false);

  if (result.success) {
    onAuthSuccess(result.token, username, result.is_admin);
  } else {
    showAuthError(result.error || 'Login failed');
    playSound('error');
  }
}

async function verifyToken(token) {
  const hwidVal = await getHwid();
  const result = await apiPost('/api/verify', { token, hwid: hwidVal });
  if (result.success) {
    authIsAdmin = !!result.is_admin;
    localStorage.setItem('authIsAdmin', authIsAdmin);
  }
  return result.success;
}

function onAuthSuccess(token, username, isAdmin) {
  playSound('success');
  authToken = token;
  authUser = username;
  authIsAdmin = !!isAdmin;
  localStorage.setItem('authToken', token);
  localStorage.setItem('authUser', username);
  localStorage.setItem('authIsAdmin', authIsAdmin);
  window.launcher.setAuthToken(token);
  authOverlay.classList.remove('visible');
  showAuthError('');
  showToast(`Welcome, ${username}!`, 'success', 2500);
  sendPing();
  fetchFriends();
  toggleAdminMenu();
}

/* ─── Admin ─── */

function toggleAdminMenu() {
  const el = document.getElementById('pm-admin');
  if (el) el.style.display = authIsAdmin ? 'flex' : 'none';
}

function openAdminPanel() {
  profileMenu.classList.remove('open');
  document.getElementById('admin-overlay').style.display = 'flex';
  loadAdminUserList();
}

async function loadAdminUserList() {
  const list = document.getElementById('admin-list');
  const logsEl = document.getElementById('admin-logs');
  list.innerHTML = '<div class="admin-loading">Loading...</div>';
  logsEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  try {
    const key = localStorage.getItem('adminKey') || '';
    const [uRes, lRes] = await Promise.all([
      fetch(`${API_BASE}/admin/users?token=${encodeURIComponent(authToken)}&key=${encodeURIComponent(key)}`),
      fetch(`${API_BASE}/admin/logs?token=${encodeURIComponent(authToken)}&key=${encodeURIComponent(key)}`),
    ]);
    const uData = await uRes.json();
    const lData = await lRes.json();
    if (uData.success && uData.users) {
      list.innerHTML = uData.users.map(u =>
        `<div class="admin-user">
          <span>${escapeHtml(u.username)}</span>
          <span class="admin-tag">${u.is_active ? (u.is_admin ? 'ADMIN' : 'user') : 'disabled'}</span>
        </div>`
      ).join('');
    } else {
      list.innerHTML = '<div class="admin-loading">Failed to load users</div>';
    }
    if (lData.success && lData.logs) {
      logsEl.innerHTML = lData.logs.map(l =>
        `<div class="admin-log-row">
          <span class="log-time">${escapeHtml(l.created_at ? l.created_at.slice(11, 19) : '')}</span>
          <span class="log-level ${l.level}">${escapeHtml(l.level)}</span>
          ${l.username ? `<span class="log-user">${escapeHtml(l.username)}</span>` : ''}
          ${escapeHtml(l.message)}
        </div>`
      ).join('');
    } else {
      logsEl.innerHTML = '<div class="admin-loading">Failed to load logs</div>';
    }
  } catch {
    list.innerHTML = '<div class="admin-loading">Error loading users</div>';
    logsEl.innerHTML = '<div class="admin-loading">Error loading logs</div>';
  }
}

async function grantAdmin() {
  const input = document.getElementById('admin-target');
  const username = input.value.trim();
  if (!username) { showToast('Enter a username', 'error'); return; }
  try {
    const res = await fetch(`${API_BASE}/api/admin/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: authToken, username }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`${username} is now admin!`, 'success');
      input.value = '';
      loadAdminUserList();
    } else {
      showToast(data.error || 'Failed', 'error');
    }
  } catch {
    showToast('Cannot reach server', 'error');
  }
}


/* ─── Canvas ─── */

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let smokeBlobs = [];
let mouse = { x: -999, y: -999 };

function resizeCanvas() {
  const win = document.getElementById('window');
  canvas.width = win.clientWidth;
  canvas.height = win.clientHeight;
}

function getAccentRgb() {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--accent-rgb').trim() || '139,92,246';
}

/* ─── Smoke/Haze ─── */

class SmokeBlob {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 120 + 60;
    this.vx = (Math.random() - 0.5) * 0.15;
    this.vy = (Math.random() - 0.5) * 0.15;
    this.opacity = Math.random() * 0.08 + 0.03;
    this.hueOffset = Math.random() * 360;
    this.pulse = Math.random() * Math.PI * 2;
  }
  update(time) {
    this.x += this.vx + Math.sin(time * 0.002 + this.hueOffset) * 0.1;
    this.y += this.vy + Math.cos(time * 0.003 + this.hueOffset) * 0.1;
    this.pulse += 0.003;
    const pulseFactor = 0.85 + 0.15 * Math.sin(this.pulse);
    if (this.x < -this.radius) this.x = canvas.width + this.radius;
    if (this.x > canvas.width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = canvas.height + this.radius;
    if (this.y > canvas.height + this.radius) this.y = -this.radius;
    return pulseFactor;
  }
  draw(rgb, pulseFactor, time) {
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * pulseFactor);
    const alpha = this.opacity * (0.8 + 0.2 * Math.sin(time * 0.001 + this.hueOffset));
    grad.addColorStop(0, `rgba(${rgb},${alpha})`);
    grad.addColorStop(0.4, `rgba(${rgb},${alpha * 0.4})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulseFactor, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

/* ─── Gradient Mesh ─── */

const MESH_COLS = 12;
const MESH_ROWS = 8;

function drawGradientMesh(time) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  for (let row = 0; row < MESH_ROWS; row++) {
    for (let col = 0; col < MESH_COLS; col++) {
      const x = (col / (MESH_COLS - 1)) * w;
      const y = (row / (MESH_ROWS - 1)) * h;
      const dx = (x - cx) / w;
      const dy = (y - cy) / h;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const wave = Math.sin(dist * 4 - time * 0.3) * 0.5 + 0.5;
      const r = 15 + wave * 25;
      const g = 10 + (1 - dist) * 20;
      const b = 30 + wave * 30;
      const alpha = (0.5 + 0.5 * Math.sin(dist * 3 + time * 0.2)) * 0.06;

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      if (col < MESH_COLS - 1 && row < MESH_ROWS - 1) {
        const nx = ((col + 1) / (MESH_COLS - 1)) * w;
        const ny = ((row + 1) / (MESH_ROWS - 1)) * h;
        const alpha2 = (0.3 + 0.3 * Math.sin(dist * 2 + time * 0.15)) * 0.05;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha2})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, ny);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha2})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }
}

/* ─── Particles ─── */

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 1.6 + 0.3;
    this.opacity = Math.random() * 0.3 + 0.1;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }
  draw(rgb) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb},${this.opacity})`;
    ctx.fill();
  }
}

function connectParticles(rgb) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        const opacity = (1 - dist / 100) * 0.12;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(${rgb},${opacity})`;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
    }
  }
  if (mouse.x > 0 && mouse.y > 0 && mouse.x < canvas.width && mouse.y < canvas.height) {
    for (const p of particles) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        const opacity = (1 - dist / 100) * 0.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(${rgb},${opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function initSmoke() {
  smokeBlobs = [];
  for (let i = 0; i < 8; i++) smokeBlobs.push(new SmokeBlob());
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 55; i++) particles.push(new Particle());
}

function animateCanvas(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const rgb = getAccentRgb();
  drawGradientMesh(time);
  for (const s of smokeBlobs) { const pf = s.update(time); s.draw(rgb, pf, time); }
  for (const p of particles) { p.update(); p.draw(rgb); }
  connectParticles(rgb);
  requestAnimationFrame(animateCanvas);
}

resizeCanvas();
initSmoke();
initParticles();
requestAnimationFrame(animateCanvas);

window.addEventListener('resize', () => {
  resizeCanvas();
  smokeBlobs.forEach(s => { if (s.x > canvas.width) s.x = canvas.width * Math.random(); if (s.y > canvas.height) s.y = canvas.height * Math.random(); });
  particles.forEach(p => { if (p.x > canvas.width) p.x = canvas.width * Math.random(); if (p.y > canvas.height) p.y = canvas.height * Math.random(); });
});

/* ─── Custom Cursor ─── */

const cursor = document.getElementById('cursor');
let cursorIdleTimer = null;
document.addEventListener('mousemove', (e) => {
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  cursor.classList.remove('cursor-hidden');
  const rect = document.getElementById('window').getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  clearTimeout(cursorIdleTimer);
  cursorIdleTimer = setTimeout(() => cursor.classList.add('cursor-hidden'), 3000);
});
document.addEventListener('mouseleave', () => cursor.classList.add('cursor-hidden'));
document.querySelectorAll('.card, .ctrl-btn, .cp-swatch, .card-btn, .console-toggle, .console-clear, .auth-btn, .auth-input, .auth-switch button, .tab, .friend-item, .pm-item, .pm-logout, .new-version-btn, .about-close, .about-tg, .admin-input, .admin-btn, .admin-close, .friends-add-input, .friends-add-btn').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
});

/* ─── Ripple ─── */

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const span = document.createElement('span');
    const size = Math.max(this.offsetWidth, this.offsetHeight);
    span.style.width = span.style.height = size + 'px';
    span.style.left = (e.clientX - rect.left) + 'px';
    span.style.top = (e.clientY - rect.top) + 'px';
    this.querySelector('.card-ripple').appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  });
});

/* ─── Splash + Auth handoff ─── */

const splash = document.getElementById('splash');
const appContent = document.getElementById('app-content');
let appUnlocked = false;

function unlockApp() {
  if (appUnlocked) return;
  appUnlocked = true;
  splash.classList.add('hidden');
  appContent.classList.add('visible');
}

async function initAuth() {
  const savedToken = localStorage.getItem('authToken');
  const savedUser = localStorage.getItem('authUser');
  if (savedToken && savedUser) {
    const valid = await verifyToken(savedToken);
    if (valid) {
      authToken = savedToken;
      authUser = savedUser;
      window.launcher.setAuthToken(savedToken);
      return; // authenticated, no overlay
    }
  }
  authOverlay.classList.add('visible');
}

setTimeout(async () => {
  try { await initAuth(); } catch (_) { authOverlay.classList.add('visible'); }
  toggleAdminMenu();
  unlockApp();
}, 2200);

/* ─── Tabs ─── */

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    playSound('click');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    const target = document.getElementById('tab-' + tab.dataset.tab);
    if (target) target.classList.add('active');
    if (tab.dataset.tab === 'friends') fetchFriends();
  });
});

/* ─── Console ─── */

const consoleEl = document.getElementById('console');
const consoleToggle = document.getElementById('console-toggle');
const consoleOutput = document.getElementById('console-output');
const consoleBadge = document.getElementById('console-badge');
const consoleClear = document.getElementById('console-clear');
let consoleOpen = false;
let unreadCount = 0;

consoleToggle.addEventListener('click', () => {
  consoleOpen = !consoleOpen;
  consoleEl.classList.toggle('open', consoleOpen);
  consoleToggle.classList.toggle('open', consoleOpen);
  if (consoleOpen) { unreadCount = 0; consoleBadge.style.display = 'none'; }
});
consoleClear.addEventListener('click', () => { consoleOutput.innerHTML = ''; });

function addLogLine(name, stream, data) {
  const lines = data.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const el = document.createElement('div');
    el.className = `console-line ${stream}`;
    el.innerHTML = `<span class="log-name">${name}</span>${escapeHtml(line)}`;
    consoleOutput.appendChild(el);
  }
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
  if (!consoleOpen) {
    unreadCount += lines.length;
    consoleBadge.textContent = unreadCount;
    consoleBadge.style.display = '';
  }
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

window.launcher.onProcessLog(({ name, stream, data }) => addLogLine(name, stream, data));

/* ─── Process Management ─── */

const cardData = {
  injector: {
    el: document.getElementById('card-injector'),
    statusEl: document.getElementById('status-injector'),
    actionsEl: document.getElementById('actions-injector'),
    name: 'Injector',
    launchFn: () => window.launcher.launchInjector(),
    getStatus: () => window.launcher.getProcessStatus('Injector'),
    kill: () => window.launcher.killProcess('Injector'),
    restart: () => window.launcher.restartProcess('Injector'),
  },
  poe: {
    el: document.getElementById('card-poe'),
    statusEl: document.getElementById('status-poe'),
    actionsEl: document.getElementById('actions-poe'),
    name: 'poeNullEffects',
    launchFn: () => window.launcher.launchPoe(),
    getStatus: () => window.launcher.getProcessStatus('poeNullEffects'),
    kill: () => window.launcher.killProcess('poeNullEffects'),
    restart: () => window.launcher.restartProcess('poeNullEffects'),
  },
};

function setCardStatus(card, text, stateClass) {
  card.el.className = 'card';
  if (stateClass) card.el.classList.add(stateClass);
  const dot = card.statusEl.querySelector('.dot');
  if (dot) {
    dot.className = 'dot';
    if (stateClass === 'running') dot.classList.add('dot-success');
    else if (stateClass === 'error') dot.classList.add('dot-error');
  }
  const textEl = card.statusEl.querySelector('.status-text');
  if (textEl) textEl.textContent = ` ${text}`;
  card.actionsEl.style.display = stateClass === 'running' ? 'flex' : 'none';
}

function setFooter(text, type) {
  const el = document.getElementById('footer-status');
  if (!el) return;
  const dot = el.querySelector('.dot');
  if (dot) {
    dot.className = 'dot';
    if (type === 'green') dot.classList.add('dot-success');
    else if (type === 'red') dot.classList.add('dot-error');
  }
  const textEl = el.querySelector('.footer-text');
  if (textEl) textEl.textContent = ` ${text}`;
}

/* ─── Server Status ─── */

const serverStatusEl = document.getElementById('server-status');
const serverTextEl = serverStatusEl?.querySelector('.server-text');
const serverDot = serverStatusEl?.querySelector('.dot');

function setServerStatus(state, text) {
  if (!serverDot || !serverTextEl) return;
  serverDot.className = 'dot';
  if (state === 'online') { serverDot.classList.add('dot-success'); serverTextEl.textContent = text || 'Online'; }
  else if (state === 'offline') { serverDot.classList.add('dot-error'); serverTextEl.textContent = text || 'Offline'; }
  else { serverDot.classList.add('dot-checking'); serverTextEl.textContent = text || 'Checking...'; }
}

async function checkServerStatus() {
  setServerStatus('checking');
  const start = performance.now();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(API_BASE, { method: 'HEAD', signal: controller.signal });
    clearTimeout(t);
    const latency = Math.round(performance.now() - start);
    setServerStatus('online', `${latency}ms`);
  } catch {
    setServerStatus('offline');
  }
}

serverStatusEl?.addEventListener('click', () => { playSound('click'); checkServerStatus(); });

checkServerStatus();
setInterval(checkServerStatus, 30000);

/* ─── Auto-Updater ─── */

const updateIndicator = document.getElementById('update-indicator');
const newVersionBtn = document.getElementById('new-version-btn');
const pmCheckUpdate = document.getElementById('pm-check-update');

function resetPmCheckUpdate() { pmCheckUpdate.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg><span>Check for Updates</span>'; }

window.launcher.onUpdateStatus((status, data) => {
  if (status === 'checking') {
    updateIndicator.style.display = 'block';
    updateIndicator.className = 'update-indicator';
    updateIndicator.title = 'Checking for update...';
    pmCheckUpdate.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg><span>Checking...</span>';
  } else if (status === 'available') {
    updateIndicator.className = 'update-indicator';
    updateIndicator.title = `Update v${data} available — click to download`;
    updateIndicator.style.cursor = 'pointer';
    updateIndicator.onclick = () => { window.launcher.downloadUpdate(); showToast('Downloading update...', 'info'); };
    newVersionBtn.style.display = 'inline-flex';
    newVersionBtn.onclick = () => { window.launcher.downloadUpdate(); showToast('Downloading update...', 'info'); };
    pmCheckUpdate.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>v${data} available</span>`;
    setTimeout(resetPmCheckUpdate, 4000);
  } else if (status === 'downloaded') {
    updateIndicator.className = 'update-indicator ready';
    updateIndicator.title = 'Update ready — click to install';
    updateIndicator.style.cursor = 'pointer';
    showToast('Update downloaded! Click Install Now to install.', 'success');
    updateIndicator.onclick = () => window.launcher.installUpdate();
    newVersionBtn.textContent = 'Install Now';
    newVersionBtn.onclick = () => window.launcher.installUpdate();
    pmCheckUpdate.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Install Now</span>';
  } else if (status === 'uptodate') {
    setTimeout(() => { updateIndicator.style.display = 'none'; }, 2000);
    newVersionBtn.style.display = 'none';
    pmCheckUpdate.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Last Version</span>';
    setTimeout(resetPmCheckUpdate, 3000);
  } else if (status === 'error') {
    updateIndicator.className = 'update-indicator error';
    updateIndicator.title = 'Update check failed';
    newVersionBtn.style.display = 'none';
    pmCheckUpdate.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>Update failed</span>';
    setTimeout(resetPmCheckUpdate, 3000);
  }
});

window.launcher.onUpdateProgress((pct) => {
  updateIndicator.title = `Downloading... ${Math.round(pct)}%`;
  newVersionBtn.textContent = `Downloading ${Math.round(pct)}%`;
});

// Check for updates 3 seconds after launch
setTimeout(() => window.launcher.checkUpdate(), 3000);

/* ─── Friends / Online List ─── */

const adminCache = {};

async function fetchFriends() {
  const list = document.getElementById('friends-list');
  const empty = document.getElementById('friends-empty');
  const incomingDiv = document.getElementById('friends-incoming');
  const incomingList = document.getElementById('friends-incoming-list');
  if (!list) return;
  try {
    const [flRes, onRes] = await Promise.all([
      fetch(`${API_BASE}/api/friend/list?token=${encodeURIComponent(authToken)}`),
      fetch(`${API_BASE}/api/friend/online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: authToken }),
      }),
    ]);
    const flData = await flRes.json();
    const onData = await onRes.json();
    if (flData.success && onData.success) {
      const inReq = flData.incoming || [];
      if (inReq.length > 0) {
        incomingDiv.style.display = 'block';
        incomingList.innerHTML = inReq.map(u => `
          <div class="friend-item" style="padding:4px 8px">
            <div class="friend-avatar" style="width:22px;height:22px;font-size:10px">${u.charAt(0).toUpperCase()}</div>
            <div class="friend-info">
              <div class="friend-name" style="font-size:11px">${escapeHtml(u)}</div>
            </div>
            <button class="friends-add-btn fr-accept" data-user="${escapeHtml(u)}" style="padding:3px 8px;font-size:9px">Accept</button>
            <button class="friends-add-btn fr-decline" data-user="${escapeHtml(u)}" style="padding:3px 8px;font-size:9px;background:#666">Decline</button>
          </div>
        `).join('');
      } else {
        incomingDiv.style.display = 'none';
      }
      const onlineUsers = onData.users || [];
      onlineUsers.forEach(u => { adminCache[u.username] = !!u.is_admin; });
      const online = onlineUsers.filter(u => u.online);
      if (online.length > 0) {
        list.innerHTML = online.map(u => `
          <div class="friend-item" data-username="${escapeHtml(u.username)}">
            <div class="friend-avatar">${u.username.charAt(0).toUpperCase()}</div>
            <div class="friend-info">
              <div class="friend-name">${escapeHtml(u.username)}${u.is_admin ? ' <span style="color:var(--accent);font-size:9px;font-weight:700;letter-spacing:0.5px">ADMIN</span>' : ''}</div>
              <div class="friend-meta">Online</div>
            </div>
            <div class="friend-dot online"></div>
          </div>
        `).join('');
        list.querySelectorAll('.friend-item').forEach(el => {
          el.addEventListener('click', () => openChat(el.dataset.username));
        });
      } else {
        list.innerHTML = '';
      }
      empty.style.display = online.length === 0 ? 'flex' : 'none';
      handleFriendReqs();
      return;
    }
    showToast('Failed to load friends', 'error');
  } catch {
    showToast('Cannot reach server', 'error');
  }
}

function handleFriendReqs() {
  document.querySelectorAll('.fr-accept').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const username = btn.dataset.user;
      try {
        const res = await fetch(`${API_BASE}/api/friend/respond`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authToken, username, accept: true }),
        });
        const d = await res.json();
        if (d.success) { showToast(`Accepted ${username}`, 'success'); fetchFriends(); }
        else showToast(d.error || 'Failed', 'error');
      } catch { showToast('Cannot reach server', 'error'); }
    });
  });
  document.querySelectorAll('.fr-decline').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const username = btn.dataset.user;
      try {
        const res = await fetch(`${API_BASE}/api/friend/respond`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authToken, username, accept: false }),
        });
        const d = await res.json();
        if (d.success) { showToast(`Declined ${username}`, 'info'); fetchFriends(); }
        else showToast(d.error || 'Failed', 'error');
      } catch { showToast('Cannot reach server', 'error'); }
    });
  });
}

/* ─── Chat ─── */

let chatPartner = null;
let chatLastId = 0;
let chatPollTimer = null;

function openChat(username) {
  if (username === authUser) return;
  chatPartner = username;
  chatLastId = 0;
  document.getElementById('friends-panel').style.display = 'none';
  document.getElementById('chat-panel').style.display = 'flex';
  document.getElementById('chat-partner').innerHTML = `${escapeHtml(username)}${adminCache[username] ? ' <span style="color:var(--accent);font-size:10px;font-weight:700;letter-spacing:0.5px">ADMIN</span>' : ''}`;
  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('chat-input').value = '';
  document.getElementById('chat-typing').style.display = 'none';
  document.getElementById('chat-input').focus();
  if (chatPollTimer) clearInterval(chatPollTimer);
  pollMessages();
  checkTyping();
  chatPollTimer = setInterval(() => { pollMessages(); checkTyping(); }, 3000);
}

function closeChat() {
  chatPartner = null;
  if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
  document.getElementById('chat-typing').style.display = 'none';
  document.getElementById('chat-panel').style.display = 'none';
  document.getElementById('friends-panel').style.display = 'flex';
  fetchFriends();
}

async function pollMessages() {
  if (!chatPartner || !authToken) return;
  try {
    const res = await fetch(`${API_BASE}/api/messages/with/${encodeURIComponent(chatPartner)}?token=${encodeURIComponent(authToken)}&after_id=${chatLastId}`);
    const data = await res.json();
    if (data.success && data.messages && data.messages.length > 0) {
      const container = document.getElementById('chat-messages');
      for (const m of data.messages) {
        if (m.id > chatLastId) chatLastId = m.id;
        const div = document.createElement('div');
        div.className = `msg ${m.sender === authUser ? 'me' : 'them'}`;
        const time = m.created_at ? m.created_at.slice(11, 16) : '';
        const adminBadge = m.sender_admin ? '<span class="msg-admin">ADMIN</span>' : '';
        div.innerHTML = `${adminBadge}${escapeHtml(m.content)}<div class="msg-time">${time}</div>`;
        container.appendChild(div);
      }
      container.scrollTop = container.scrollHeight;
    }
  } catch {}
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content || !chatPartner || !authToken) return;
  input.value = '';
  try {
    const res = await fetch(`${API_BASE}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: authToken, receiver: chatPartner, content }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.message_id > chatLastId) chatLastId = data.message_id;
      const container = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = 'msg me';
      const now = new Date();
      const time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
      div.innerHTML = `${escapeHtml(content)}<div class="msg-time">${time}</div>`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    } else {
      showToast(data.error || 'Send failed', 'error');
      input.value = content;
    }
  } catch {
    showToast('Cannot send message', 'error');
    input.value = content;
  }
}

document.getElementById('chat-back').addEventListener('click', () => { playSound('click'); closeChat(); });
document.getElementById('chat-send').addEventListener('click', () => { playSound('click'); sendMessage(); });
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); playSound('click'); sendMessage(); }
});

/* ─── Typing Indicator ─── */

let typingTimer = null;
let typingLastSent = 0;

document.getElementById('chat-input').addEventListener('input', () => {
  if (!chatPartner || !authToken) return;
  const now = Date.now();
  if (now - typingLastSent < 2000) return;
  typingLastSent = now;
  clearTimeout(typingTimer);
  fetch(`${API_BASE}/api/typing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: authToken, receiver: chatPartner }),
  }).catch(() => {});
});

async function checkTyping() {
  if (!chatPartner || !authToken) return;
  try {
    const res = await fetch(`${API_BASE}/api/typing/check?token=${encodeURIComponent(authToken)}&partner=${encodeURIComponent(chatPartner)}`);
    const data = await res.json();
    const el = document.getElementById('chat-typing');
    if (data.success && data.typing) {
      document.getElementById('chat-typing-text').textContent = chatPartner + ' typing';
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  } catch {}
}

/* ─── Periodic ping to keep online status ─── */

async function sendPing() {
  if (!authToken) return;
  try {
    await fetch(`${API_BASE}/api/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: authToken }),
    });
  } catch {}
}

sendPing();
setInterval(sendPing, 60000);

async function checkProcessStatus(card) {
  try {
    const status = await card.getStatus();
    if (status.running) setCardStatus(card, `Running (pid: ${status.pid})`, 'running');
    else if (!card._launching) setCardStatus(card, 'Idle', '');
  } catch (_) {}
}

async function launchCard(card) {
  if (card._launching) return;
  card._launching = true;
  playSound('launch');
  card.el.classList.add('loading');
  setCardStatus(card, 'Launching...', '');
  setFooter(`Launching ${card.name}...`, '');
  let result;
  try {
    result = await card.launchFn();
  } catch (err) {
    card._launching = false;
    card.el.classList.remove('loading');
    setCardStatus(card, 'Error', 'error');
    setFooter('Error: ' + err.message, 'red');
    return;
  }
  card._launching = false;
  card.el.classList.remove('loading');
  if (!result) {
    setCardStatus(card, 'No result', 'error');
    setFooter(`${card.name}: no result from IPC`, 'red');
    return;
  }
  if (result.success) {
    playSound('success');
    setCardStatus(card, `Running (pid: ${result.pid})`, 'running');
    setFooter(`${card.name} launched`, 'green');
  } else {
    playSound('error');
    setCardStatus(card, result.error, 'error');
    setFooter(result.error, 'red');
  }
}

async function killCard(card) {
  playSound('kill');
  setFooter(`Killing ${card.name}...`, '');
  const result = await card.kill();
  if (result.success) { setCardStatus(card, 'Idle', ''); setFooter(`${card.name} stopped`, ''); }
  else { setFooter(`Kill failed: ${result.error}`, 'red'); }
}

async function restartCard(card) {
  if (card._launching) return;
  playSound('launch');
  setFooter(`Restarting ${card.name}...`, '');
  card._launching = true;
  card.el.classList.add('loading');
  const result = await card.restart();
  card._launching = false;
  card.el.classList.remove('loading');
  if (result.success) { playSound('success'); setCardStatus(card, `Running (pid: ${result.pid})`, 'running'); setFooter(`${card.name} restarted`, 'green'); }
  else { playSound('error'); setCardStatus(card, result.error, 'error'); setFooter(result.error, 'red'); }
}

Object.values(cardData).forEach(card => {
  card.el.addEventListener('click', async (e) => {
    if (e.target.closest('.card-btn')) return;
    if (card.actionsEl.style.display === 'flex') return;
    setFooter(`Clicked ${card.name}`, 'green');
    card.el.style.transition = 'background 0.1s';
    card.el.style.background = 'rgba(139,92,246,0.15)';
    setTimeout(() => { card.el.style.background = ''; }, 200);
    try { await launchCard(card); }
    catch (err) {
      card._launching = false;
      card.el.classList.remove('loading');
      setCardStatus(card, 'Error', 'error');
      setFooter('Error: ' + err.message, 'red');
    }
  });
  card.el.querySelectorAll('.card-btn.kill').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); killCard(card); }));
  card.el.querySelectorAll('.card-btn.restart').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); restartCard(card); }));
});

window.launcher.onProcessStatus(({ name, running }) => {
  const card = name === 'Injector' ? cardData.injector : cardData.poe;
  if (!running && !card._launching) { setCardStatus(card, 'Idle', ''); setFooter(`${name} exited`, ''); }
});

setInterval(() => { Object.values(cardData).forEach(checkProcessStatus); }, 3000);

/* ─── Window Resize ─── */

const win = document.getElementById('window');
const observer = new ResizeObserver(() => resizeCanvas());
observer.observe(win);

/* ─── Animation delays ─── */

document.querySelectorAll('.hero .char').forEach((el, i) => { el.style.animationDelay = `${0.05 * i + 2.6}s`; });
document.querySelector('#card-injector').style.animationDelay = '2.9s';
document.querySelector('#card-poe').style.animationDelay = '3.05s';
document.querySelector('.hero-sub').style.animationDelay = '3.3s';

/* ─── Minimize & Close ─── */

document.getElementById('minimize-btn').addEventListener('click', () => { playSound('click'); window.launcher.minimize(); });
document.getElementById('close-btn').addEventListener('click', () => { playSound('click'); window.launcher.close(); });
