// ═══════════════════════════════════════
// CropGuardianAI — Employee Dashboard JS
// ═══════════════════════════════════════
const user = JSON.parse(localStorage.getItem('cgUser') || '{"fullName":"Venkat Reddy","email":"venkat@demo.com","role":"employee","employeeId":"EMP-A4F2"}');

document.getElementById('sbName').textContent = user.fullName;
document.getElementById('sbEmail').textContent = user.email;
document.getElementById('avatarBtn').textContent = user.fullName[0];
document.getElementById('empIdBadge').textContent = 'ID: ' + (user.employeeId || 'EMP-A4F2');

// Clock
function tick() { document.getElementById('topbarTime').textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
tick(); setInterval(tick, 1000);

// ── Section nav ──
const sections = ['overview', 'sensors', 'farmers', 'alerts', 'cctv'];
function showSection(id) {
    sections.forEach(s => { const el = document.getElementById('sec-' + s); if (el) el.style.display = s === id ? 'block' : 'none'; });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const titles = { overview: 'Employee Dashboard', sensors: 'Sensor Control', farmers: 'Farmer Management', alerts: 'Alert Center', cctv: 'CCTV Monitor' };
    document.getElementById('topbarTitle').textContent = titles[id];
    if (id === 'farmers') renderFarmerTable();
    if (id === 'cctv') renderCCTV();
    if (id === 'sensors') buildSensorChart();
    if (id === 'alerts') renderAlertHistory();
}
window.showSection = showSection;

// ── Sensor sliders ──
function updateTemp(slider, valId, statusId, threshold) {
    const v = +slider.value;
    document.getElementById(valId).textContent = v.toFixed(1) + '°C';
    const el = document.getElementById(statusId);
    if (v < 2) { el.textContent = '🚨 Critical: Too Cold'; el.style.color = '#ef4444'; sendAutoAlert('temp-low'); }
    else if (v > threshold) { el.textContent = '⚠ Above optimal range'; el.style.color = '#f59e0b'; }
    else { el.textContent = '✓ Within optimal range (2–6°C)'; el.style.color = '#22c55e'; }
}
function updateHum(slider, valId, statusId, threshold) {
    const v = +slider.value;
    document.getElementById(valId).textContent = v + '%';
    const el = document.getElementById(statusId);
    if (v > threshold) { el.textContent = '🚨 Critical — above 92% triggers alert'; el.style.color = '#ef4444'; sendAutoAlert('humidity-high'); }
    else if (v < 70) { el.textContent = '⚠ Too low — may cause dehydration'; el.style.color = '#f59e0b'; }
    else { el.textContent = '✓ Normal (80–92%)'; el.style.color = '#22c55e'; }
}
window.updateTemp = updateTemp; window.updateHum = updateHum;

function sendAutoAlert(type) {
    const msgs = { 'temp-low': '🌡️ Auto-alert: Unit temperature dropped critically!', 'humidity-high': '💧 Auto-alert: Humidity exceeded safe threshold!' };
    showToast('warn', msgs[type]);
}

// ── Live sensor chart ──
let sensorChart;
function buildSensorChart() {
    const ctx = document.getElementById('sensorChart')?.getContext('2d');
    if (!ctx || sensorChart) return;
    const labels = Array.from({ length: 30 }, (_, i) => i === 29 ? 'now' : `${29 - i}s`).reverse();
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Temp U1 (°C)', data: Array.from({ length: 30 }, () => +(4.2 + (Math.random() - .5)).toFixed(2)), borderColor: '#1a6b3a', backgroundColor: 'rgba(26,107,58,.05)', borderWidth: 2, fill: true, tension: .4, pointRadius: 0 },
                { label: 'Humidity U1 (%)', data: Array.from({ length: 30 }, () => +(87 + (Math.random() - .5) * 4).toFixed(1)), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.05)', borderWidth: 2, fill: true, tension: .4, pointRadius: 0 },
                { label: 'Temp U2 (°C)', data: Array.from({ length: 30 }, () => +(3.9 + (Math.random() - .5) * 1.5).toFixed(2)), borderColor: '#c9a84c', borderWidth: 2, fill: false, tension: .4, pointRadius: 0 }
            ]
        },
        options: { responsive: true, animation: { duration: 300 }, plugins: { legend: { display: true, position: 'top' } } }
    });
    setInterval(() => {
        if (!sensorChart) return;
        sensorChart.data.datasets.forEach(ds => {
            ds.data.shift(); ds.data.push(+(parseFloat(ds.data[ds.data.length - 1]) + (Math.random() - .5) * .8).toFixed(2));
        });
        sensorChart.data.labels.shift(); sensorChart.data.labels.push('now');
        sensorChart.update('none');
    }, 5000);
}

// ── Farmer table ──
let farmers = [
    { name: 'Ravi Shankar', email: 'ravi@demo.com', phone: '9876543210', unit: 'Unit 1', batches: 3, status: 'active' },
    { name: 'Krishna Murthy', email: 'krishna@demo.com', phone: '9812345670', unit: 'Unit 2', batches: 2, status: 'active' },
    { name: 'Lakshmi Devi', email: 'lakshmi@demo.com', phone: '9923456781', unit: 'Unit 1', batches: 1, status: 'active' },
    { name: 'Prasad Rao', email: 'prasad@demo.com', phone: '9834567892', unit: 'Unit 3', batches: 4, status: 'active' },
    { name: 'Srinivas Chary', email: 'srinivas@demo.com', phone: '9745678903', unit: 'Unit 2', batches: 2, status: 'inactive' },
];
function renderFarmerTable() {
    const el = document.getElementById('farmerTable');
    if (!el) return;
    el.innerHTML = farmers.map(f => `<tr>
    <td class="cell-name">${f.name}</td>
    <td>${f.email}</td>
    <td>${f.phone}</td>
    <td>${f.unit}</td>
    <td><span class="badge badge-blue">${f.batches}</span></td>
    <td><span class="badge ${f.status === 'active' ? 'badge-active' : 'badge-withdrawn'}">${f.status}</span></td>
    <td><button class="btn-sm" onclick="showToast('success','📲 SMS sent to ${f.name}')">Send Alert</button></td>
  </tr>`).join('');
}
function openAddFarmer() { document.getElementById('addFarmerModal').style.display = 'flex'; }
function addFarmer() {
    const name = document.getElementById('nfName').value.trim();
    const email = document.getElementById('nfEmail').value.trim();
    const phone = document.getElementById('nfPhone').value.trim();
    const unit = document.getElementById('nfUnit').value;
    if (!name || !email || !phone) { showToast('error', '✗ Fill all required fields.'); return; }
    farmers.unshift({ name, email, phone, unit, batches: 0, status: 'active' });
    renderFarmerTable();
    document.getElementById('addFarmerModal').style.display = 'none';
    showToast('success', '✓ Farmer added to the system.');
}
window.openAddFarmer = openAddFarmer; window.addFarmer = addFarmer;

// ── Alert system ──
const alertLog = [
    { type: 'sms', msg: 'Temperature alert: Unit 2 above 6°C', farmers: 'Lakshmi Devi, Krishna Murthy', time: '2:14 PM' },
    { type: 'wa', msg: 'Humidity warning: Unit 1 - 94%', farmers: 'Ravi Shankar', time: 'Yesterday 9:30 AM' },
    { type: 'voice', msg: 'Batch expiry: Onion B6 - 4 days remaining', farmers: 'Prasad Rao', time: 'Feb 23, 2026' },
];
function renderAlertHistory() {
    const el = document.getElementById('alertHistory');
    if (!el) return;
    el.innerHTML = alertLog.map(a => `<div style="background:var(--off-white);border-radius:10px;padding:.9rem;border-left:3px solid ${a.type === 'sms' ? '#3b82f6' : a.type === 'wa' ? '#22c55e' : '#7c3aed'}">
    <div style="font-size:.78rem;font-weight:800;color:var(--charcoal)">${a.type.toUpperCase().replace('WA', 'WHATSAPP')} Alert</div>
    <div style="font-size:.82rem;color:var(--text-2);margin:.2rem 0">${a.msg}</div>
    <div style="font-size:.72rem;color:var(--text-3)">Sent to: ${a.farmers} · ${a.time}</div>
  </div>`).join('');
}

function sendQuickAlert(type) {
    const unit = document.getElementById('alertUnit')?.value || 'All Units';
    const alertType = document.getElementById('alertType')?.value || 'General';
    const labels = { sms: '📱 SMS sent', wa: '📲 WhatsApp message sent', voice: '📞 Voice call initiated' };
    showToast('success', `${labels[type]} — ${unit}`);
    alertLog.unshift({ type, msg: `${alertType} — ${unit}`, farmers: 'All assigned farmers', time: 'Just now' });
    renderAlertHistory();
}
window.sendQuickAlert = sendQuickAlert;

// ── CCTV ──
const cameras = [
    { name: 'Unit 1 — Main Entrance', note: 'No motion detected' },
    { name: 'Unit 1 — Storage Zone A', note: 'Normal activity' },
    { name: 'Unit 2 — Loading Dock', note: 'Forklift detected 2m ago' },
    { name: 'Unit 2 — Cold Room', note: 'Door open 12s' },
    { name: 'Unit 3 — Perimeter', note: 'Clear' },
    { name: 'Office — Reception', note: '1 person detected' },
];
function renderCCTV() {
    const grid = document.getElementById('cctvGrid');
    if (!grid) return;
    grid.innerHTML = cameras.map((cam, i) => `<div class="cctv-cell">
    <div class="cctv-feed">
      <div class="cctv-noise"></div>
      <div class="cctv-overlay"></div>
      <div class="cctv-icon">📹</div>
      <div class="cctv-info">
        <div class="cctv-live"><div class="live-dot"></div><span class="live-txt">LIVE</span></div>
        <span class="cctv-ts" id="ts${i}">00:00:00</span>
      </div>
    </div>
    <div class="cctv-meta">
      <div class="cctv-name">CAM ${String(i + 1).padStart(2, '0')} · ${cam.name}</div>
      <div class="cctv-note">${cam.note}</div>
    </div>
  </div>`).join('');

    // Live timestamps
    setInterval(() => {
        const now = new Date().toLocaleTimeString('en-IN');
        cameras.forEach((_, i) => { const el = document.getElementById('ts' + i); if (el) el.textContent = now; });
    }, 1000);
}

// Init
renderAlertHistory();
