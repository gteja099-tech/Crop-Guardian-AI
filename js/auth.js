// ═══════════════════════════════════════
// CropGuardianAI — Shared Auth Utilities
// ═══════════════════════════════════════

// Toast notification system
function showToast(type, msg, duration = 3500) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    stack.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

// Show/hide field error
function showErr(id, show) {
    const el = document.getElementById(id);
    if (el) el.className = show ? 'field-error show' : 'field-error';
}

// Toggle password visibility
function togglePw(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Page navigation helper
function go(url) {
    const ov = document.getElementById('pgOverlay');
    if (ov) { ov.classList.add('show'); setTimeout(() => window.location.href = url, 380); }
    else { window.location.href = url; }
}

// Auth guard: call on dashboard pages to verify login
function requireAuth(requiredRole) {
    const raw = localStorage.getItem('cgUser');
    if (!raw) { window.location.href = '../pages/login.html'; return null; }
    const user = JSON.parse(raw);
    if (requiredRole && user.role !== requiredRole) {
        // Redirect to correct dashboard
        const map = {
            farmer: './farmer-dashboard.html', employee: './employee-dashboard.html',
            manager: './manager-dashboard.html', admin: './admin-dashboard.html'
        };
        window.location.href = map[user.role] || '../pages/login.html';
        return null;
    }
    return user;
}

// Format date nicely
function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Generate random sensor reading
function randSensor(base, variance) {
    return +(base + (Math.random() - .5) * variance * 2).toFixed(1);
}

// Logout — plays cinematic sign-out animation then redirects to login
function logout() {
    localStorage.removeItem('cgUser');
    if (typeof playSignOutAnimation === 'function') {
        playSignOutAnimation('../pages/login.html');
    } else {
        window.location.href = '../pages/login.html';
    }
}
window.logout = logout;
