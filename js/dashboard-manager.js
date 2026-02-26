// ═══════════════════════════════════════
// CropGuardianAI — Manager Dashboard JS
// ═══════════════════════════════════════
const user = JSON.parse(localStorage.getItem('cgUser') || '{"fullName":"Sujata Rao","email":"sujata@demo.com","role":"manager","employeeId":"MGR-B8E1"}');
document.getElementById('sbName').textContent = user.fullName;
document.getElementById('sbEmail').textContent = user.email;
document.getElementById('avatarBtn').textContent = user.fullName[0];
document.getElementById('empIdBadge').textContent = 'ID: ' + (user.employeeId || 'MGR-B8E1');

function tick() { document.getElementById('topbarTime').textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
tick(); setInterval(tick, 1000);

// ── Section nav ──
const sections = ['analytics', 'twin', 'reports', 'employees', 'energy', 'cctv'];
function showSection(id) {
    sections.forEach(s => { const el = document.getElementById('sec-' + s); if (el) el.style.display = s === id ? 'block' : 'none'; });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event.currentTarget?.classList.add('active');
    const titles = { analytics: 'Manager Analytics', twin: 'Digital Twin', reports: 'Reports', employees: 'Team Management', energy: 'Energy Optimizer', cctv: 'CCTV Access' };
    document.getElementById('topbarTitle').textContent = titles[id];
    if (id === 'employees') renderEmpTable();
    if (id === 'cctv') renderCCTV();
    if (id === 'energy') buildEnergyChart();
}
window.showSection = showSection;

// ── Analytics Charts ──
const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
function buildAnalyticsCharts() {
    const rCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (rCtx) new Chart(rCtx, { type: 'bar', data: { labels: months, datasets: [{ label: 'Revenue (₹L)', data: [5.2, 6.1, 5.8, 7.3, 6.9, 8.4], backgroundColor: 'rgba(26,107,58,.75)', borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => '₹' + v + 'L' } } } } });

    const fCtx = document.getElementById('farmerChart')?.getContext('2d');
    if (fCtx) new Chart(fCtx, { type: 'line', data: { labels: months, datasets: [{ label: 'Farmers', data: [140, 158, 175, 191, 210, 232], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.08)', borderWidth: 2.5, fill: true, tension: .4 }] }, options: { responsive: true, plugins: { legend: { display: false } } } });

    const sCtx = document.getElementById('spoilageChart')?.getContext('2d');
    if (sCtx) new Chart(sCtx, { type: 'line', data: { labels: months, datasets: [{ label: 'Spoilage %', data: [5.8, 5.1, 4.7, 4.2, 3.5, 2.3], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.06)', borderWidth: 2, fill: true, tension: .4 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 8, ticks: { callback: v => v + '%' } } } } });

    const pCtx = document.getElementById('cropPieChart')?.getContext('2d');
    if (pCtx) new Chart(pCtx, { type: 'doughnut', data: { labels: ['Potato', 'Tomato', 'Onion', 'Apple', 'Carrot', 'Other'], datasets: [{ data: [35, 22, 18, 12, 8, 5], backgroundColor: ['#1a6b3a', '#22c55e', '#c9a84c', '#3b82f6', '#7c3aed', '#888'] }] }, options: { responsive: true, plugins: { legend: { position: 'right' } } } });
}
buildAnalyticsCharts();

// ── Digital Twin ──
let twinChart;
function simUpdate() {
    const temp = +document.getElementById('twTemp').value;
    const hum = +document.getElementById('twHum').value;
    const co2 = +document.getElementById('twCO2').value;
    const dur = +document.getElementById('twDur').value;
    const light = +document.getElementById('twLight').value;
    const lightNames = ['Minimal', 'Low', 'Moderate', 'High'];

    document.getElementById('twTempVal').textContent = temp.toFixed(1) + '°C';
    document.getElementById('twHumVal').textContent = hum + '%';
    document.getElementById('twCO2Val').textContent = co2 + ' ppm';
    document.getElementById('twDurVal').textContent = dur + ' days';
    document.getElementById('twLightVal').textContent = lightNames[light];

    // ML simulation (simplified model)
    const tempDev = Math.abs(temp - 4);
    const humDev = Math.max(0, hum - 90);
    const co2Risk = Math.max(0, co2 - 500) / 50;
    const lightRisk = light * 5;
    let spoilage = Math.min(95, 5 + tempDev * 8 + humDev * 3 + co2Risk * 2 + lightRisk + (dur / 120) * 20);
    let shelfExt = Math.max(-10, 15 - tempDev * 3 - humDev - lightRisk * .5);
    let energy = Math.max(5, 25 - tempDev * 2 + (100 - hum) * .2);

    document.getElementById('simSpoilage').textContent = spoilage.toFixed(0) + '%';
    document.getElementById('simSpoilage').style.color = spoilage < 20 ? '#22c55e' : spoilage < 50 ? '#f59e0b' : '#ef4444';
    document.getElementById('simShelfLife').textContent = (shelfExt >= 0 ? '+' : '') + shelfExt.toFixed(0) + ' days';
    document.getElementById('simEnergy').textContent = energy.toFixed(0) + '%';

    const action = spoilage > 60 ? '⚠ High risk conditions. Adjust temperature closer to 4°C and reduce humidity.' :
        spoilage > 30 ? 'Moderate risk. Fine-tune conditions. Consider reducing storage duration.' :
            'Optimal conditions. Current settings are ideal for most root vegetables.';
    document.getElementById('simAction').textContent = action;

    // Update twin chart
    if (twinChart) {
        const pts = 12; const baseline = Array.from({ length: pts }, (_, i) => 30 - i * 1.5);
        const simulated = Array.from({ length: pts }, (_, i) => Math.max(0, 30 - shelfExt / 2 - i * (1.5 - shelfExt / 30)));
        twinChart.data.datasets[0].data = baseline;
        twinChart.data.datasets[1].data = simulated;
        twinChart.update('none');
    }
}
window.simUpdate = simUpdate;

function buildTwinChart() {
    const ctx = document.getElementById('twinChart')?.getContext('2d');
    if (!ctx || twinChart) return;
    const pts = 12; const labels = Array.from({ length: pts }, (_, i) => `Day ${(i + 1) * 5}`);
    twinChart = new Chart(ctx, {
        type: 'line', data: {
            labels, datasets: [
                { label: 'Baseline (Current)', data: Array.from({ length: pts }, (_, i) => 30 - i * 1.5), borderColor: 'rgba(139,92,246,.7)', borderDash: [5, 5], borderWidth: 2, fill: false, tension: .4, pointRadius: 0 },
                { label: 'Simulated', data: Array.from({ length: pts }, (_, i) => Math.max(0, 22 - i * 1.2)), borderColor: '#1a6b3a', backgroundColor: 'rgba(26,107,58,.06)', borderWidth: 2.5, fill: true, tension: .4, pointRadius: 0 }
            ]
        }, options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { title: { display: true, text: 'Shelf Life Remaining (%)' }, min: 0, max: 35 } } }
    });
}

// ── Employee table ──
const employees = [
    { name: 'Venkat Reddy', id: 'EMP-A4F2', email: 'venkat@demo.com', unit: 'Unit 1', status: 'active' },
    { name: 'Padmavathi V', id: 'EMP-C1D3', email: 'padma@demo.com', unit: 'Unit 2', status: 'active' },
    { name: 'Suresh Kumar', id: 'EMP-E5F6', email: 'suresh@demo.com', unit: 'Unit 3', status: 'active' },
    { name: 'Ramesh Babu', id: 'EMP-G7H8', email: 'ramesh@demo.com', unit: 'Unit 1', status: 'pending' },
    { name: 'Tejaswi M', id: 'EMP-I9J0', email: 'tejaswi@demo.com', unit: 'Unit 2', status: 'inactive' },
];
function renderEmpTable() {
    const el = document.getElementById('empTable');
    if (!el) return;
    el.innerHTML = employees.map(e => `<tr>
    <td class="cell-name">${e.name}</td>
    <td><span style="font-family:monospace;font-size:.8rem">${e.id}</span></td>
    <td>${e.email}</td>
    <td>${e.unit}</td>
    <td><span class="badge ${e.status === 'active' ? 'badge-active' : e.status === 'pending' ? 'badge-pending' : 'badge-withdrawn'}">${e.status}</span></td>
    <td>
      ${e.status === 'pending' ? `<button class="btn-sm solid" onclick="approveEmp(this,'${e.name}')">Approve</button>` :
            e.status === 'active' ? `<select onchange="reassign(this,'${e.name}')" style="font-size:.75rem;padding:.25rem;border-radius:6px;border:1px solid #ddd"><option>Unit 1</option><option>Unit 2</option><option>Unit 3</option></select>` : '—'}
    </td>
  </tr>`).join('');
}
function approveEmp(btn, name) {
    btn.closest('tr').querySelector('.badge').className = 'badge badge-active'; btn.closest('tr').querySelector('.badge').textContent = 'active';
    btn.remove(); showToast('success', `✓ ${name} approved.`);
}
function reassign(_, name) { showToast('success', `✓ ${name} reassigned.`); }
window.approveEmp = approveEmp; window.reassign = reassign;

// ── Energy chart ──
function buildEnergyChart() {
    const ctx = document.getElementById('energyChart')?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar', data: {
            labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], datasets: [
                { label: 'Actual (kWh)', data: [3800, 3650, 3420, 3200, 2980, 2840], backgroundColor: 'rgba(26,107,58,.75)', borderRadius: 6 },
                { label: 'Baseline (kWh)', data: [4200, 4200, 4200, 4000, 3800, 3800], backgroundColor: 'rgba(201,168,76,.4)', borderRadius: 6, borderDash: [5, 5] }
            ]
        }, options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
}

// ── CCTV ──
const cameras = [{ n: 'Unit 1 — Zone A', note: 'Optimal conditions' }, { n: 'Unit 1 — Zone B', note: 'No alerts' }, { n: 'Unit 2 — Cold Room', note: 'Door open alert' }, { n: 'Unit 2 — Loading Dock', note: 'Vehicle detected' }, { n: 'Unit 3 — Entry', note: 'Normal' }, { n: 'Security — Gate', note: 'Clear' }];
function renderCCTV() {
    const g = document.getElementById('cctvGrid');
    if (!g) return;
    g.innerHTML = cameras.map((c, i) => `<div class="cctv-cell"><div class="cctv-feed"><div class="cctv-noise"></div><div class="cctv-overlay"></div><div class="cctv-icon">📹</div><div class="cctv-info"><div class="cctv-live"><div class="live-dot"></div><span class="live-txt">LIVE</span></div><span class="cctv-ts" id="cts${i}"></span></div></div><div class="cctv-meta"><div class="cctv-name">CAM ${String(i + 1).padStart(2, '0')} · ${c.n}</div><div class="cctv-note">${c.note}</div></div></div>`).join('');
    setInterval(() => { const t = new Date().toLocaleTimeString('en-IN'); cameras.forEach((_, i) => { const e = document.getElementById('cts' + i); if (e) e.textContent = t; }); }, 1000);
}

function genReport(type) { showToast('success', '📄 Generating ' + type + ' report... Download will begin shortly (demo).'); }
window.genReport = genReport;

// ── Init ──
buildTwinChart();
