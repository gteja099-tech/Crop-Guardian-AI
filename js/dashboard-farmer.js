// ═══════════════════════════════════════
// CropGuardianAI — Farmer Dashboard JS
// ═══════════════════════════════════════

// ── Load user ──
const user = JSON.parse(localStorage.getItem('cgUser') || '{"fullName":"Ravi Shankar","email":"ravi@demo.com","role":"farmer","storageUnit":"Tadepalligudam Cold Storage Unit 1"}');
document.getElementById('wmName').textContent = user.fullName;
document.getElementById('wmStorage').textContent = user.storageUnit || 'Tadepalligudam Cold Storage Unit 1';
document.getElementById('sbName').textContent = user.fullName;
document.getElementById('sbEmail').textContent = user.email;
document.getElementById('greetName').textContent = user.fullName.split(' ')[0];
document.getElementById('avatarBtn').textContent = user.fullName[0];

// ── Dismiss welcome overlay ──
setTimeout(() => {
    const ov = document.getElementById('welcomeOverlay');
    ov.style.transition = 'opacity .5s ease';
    ov.style.opacity = '0';
    setTimeout(() => ov.style.display = 'none', 500);
}, 2800);

// ── Live clock ──
function tick() { document.getElementById('topbarTime').textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
tick(); setInterval(tick, 1000);

// ── Gauge animation ──
const circumference = 2 * Math.PI * 56; // 351.9
const healthScore = 87;
setTimeout(() => {
    const offset = circumference - (healthScore / 100) * circumference;
    document.getElementById('gaugeCircle').style.strokeDashoffset = offset;
    let v = 0;
    const iv = setInterval(() => {
        v = Math.min(v + 2, healthScore);
        document.getElementById('gaugeVal').textContent = v;
        if (v >= healthScore) clearInterval(iv);
    }, 18);
}, 600);

// ── Chart.js ──
let tempChart, humChart, liveChart;

function genTempData(pts, base, variance) {
    return Array.from({ length: pts }, () => +(base + (Math.random() - .5) * variance * 2).toFixed(1));
}

function buildTempChart() {
    const ctx = document.getElementById('tempChart')?.getContext('2d');
    if (!ctx) return;
    const labels24 = Array.from({ length: 24 }, (_, i) => `${String(23 - i).padStart(2, '0')}:00`).reverse();
    const data = genTempData(24, 4.3, 0.6);
    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels24,
            datasets: [{
                label: 'Temperature (°C)',
                data, borderColor: '#1a6b3a',
                backgroundColor: 'rgba(26,107,58,.08)',
                borderWidth: 2.5, fill: true, tension: .4, pointRadius: 2, pointHoverRadius: 5
            }, {
                label: 'Ideal (4°C)', data: Array(24).fill(4),
                borderColor: 'rgba(201,168,76,.5)', borderWidth: 1.5, borderDash: [6, 4],
                fill: false, pointRadius: 0
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 2, max: 7, grid: { color: 'rgba(0,0,0,.04)' } } } }
    });
}

function switchChart(period, btn) {
    document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const pts = period === '24h' ? 24 : period === '7d' ? 7 : 30;
    const labels = period === '24h' ? Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`) :
        period === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
            Array.from({ length: 30 }, (_, i) => `Jan ${i + 1}`);
    if (tempChart) {
        tempChart.data.labels = labels;
        tempChart.data.datasets[0].data = genTempData(pts, 4.3, 0.8);
        tempChart.data.datasets[1].data = Array(pts).fill(4);
        tempChart.update('active');
    }
}
window.switchChart = switchChart;

function buildHumChart() {
    const ctx = document.getElementById('humChart')?.getContext('2d');
    if (!ctx) return;
    const labels = Array.from({ length: 20 }, (_, i) => `${19 - i}m ago`).reverse();
    const data = genTempData(20, 87, 2.5);
    humChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Humidity (%)',
                data, borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,.08)',
                borderWidth: 2, fill: true, tension: .5, pointRadius: 1
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 75, max: 100, grid: { color: 'rgba(0,0,0,.04)' } } } }
    });
}

function buildLiveChart() {
    const ctx = document.getElementById('liveChart')?.getContext('2d');
    if (!ctx) return;
    const labels = Array.from({ length: 15 }, (_, i) => `-${14 - i}s`);
    const tempDataLive = genTempData(15, 4.3, 0.5);
    const humDataLive = genTempData(15, 87, 2);
    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Temp °C', data: tempDataLive,
                borderColor: '#1a6b3a', backgroundColor: 'rgba(26,107,58,.06)',
                borderWidth: 2, fill: true, tension: .4, pointRadius: 0, yAxisID: 'y'
            }, {
                label: 'Humidity %', data: humDataLive,
                borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.06)',
                borderWidth: 2, fill: true, tension: .4, pointRadius: 0, yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true, animation: { duration: 400 },
            scales: {
                y: { type: 'linear', position: 'left', min: 0, max: 10, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { callback: v => v + '°C' } },
                y1: { type: 'linear', position: 'right', min: 60, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: v => v + '%' } }
            }
        }
    });
}

// ── Live sensor update ──
let sensorNames = [
    { n: 'Compressor Temp', l: 'Unit 1 · Zone A', base: 4.2, var: .5, icon: '🌡️', unit: '°C' },
    { n: 'Ambient Humidity', l: 'Unit 1 · Zone A', base: 87, var: 2, icon: '💧', unit: '%' },
    { n: 'Cold Room Temp', l: 'Unit 2 · Zone B', base: 3.9, var: .7, icon: '❄️', unit: '°C' },
    { n: 'Door Sensor', l: 'Unit 2 · Entry', base: 5.1, var: .3, icon: '🚪', unit: '°C' },
    { n: 'CO₂ Level', l: 'Unit 1 · All Zones', base: 420, var: 30, icon: '🌬️', unit: 'ppm' },
    { n: 'Power Draw', l: 'Compressor A', base: 3.2, var: .4, icon: '⚡', unit: 'kW' }
];

function renderSensors() {
    const el = document.getElementById('sensorList');
    if (!el) return;
    el.innerHTML = sensorNames.map((s, i) => {
        const val = +(s.base + (Math.random() - .5) * s.var * 2).toFixed(1);
        const pct = Math.min(100, Math.max(0, (val / s.base) * 100 - 50));
        const ok = Math.abs(val - s.base) < s.var * 1.5;
        return `<div class="sensor-item">
      <span class="sensor-icon">${s.icon}</span>
      <div class="sensor-info"><div class="sensor-name">${s.n}</div><div class="sensor-loc">${s.l}</div></div>
      <div class="sensor-bar"><div class="sensor-fill" style="width:${Math.min(pct, 95)}%;background:${ok ? '#22c55e' : '#f59e0b'}"></div></div>
      <div class="sensor-val" style="color:${ok ? '#15803d' : '#d97706'}">${val}${s.unit}</div>
      <div class="status-dot ${ok ? 's-ok' : 's-warn'}"></div>
    </div>`;
    }).join('');
}

function updateLiveChart() {
    if (!liveChart) return;
    const t = +(4.3 + (Math.random() - .5) * 1.2).toFixed(2);
    const h = +(87 + (Math.random() - .5) * 5).toFixed(1);
    liveChart.data.datasets[0].data.shift(); liveChart.data.datasets[0].data.push(t);
    liveChart.data.datasets[1].data.shift(); liveChart.data.datasets[1].data.push(h);
    liveChart.data.labels.shift(); liveChart.data.labels.push('now');
    liveChart.update('none');

    // Update KPI
    const kpiEl = document.getElementById('kpiTemp');
    const kpiEm = document.getElementById('kpiHumidity');
    if (kpiEl) { kpiEl.textContent = t; }
    if (kpiEm) { kpiEm.textContent = h; }
}
setInterval(() => { renderSensors(); updateLiveChart(); }, 5000);

// ── Crop data ──
const crops = [
    { name: 'Potato', unit: 'Unit 1', qty: '500 kg', stored: 'Jan 10, 2026', expires: 'Mar 10, 2026', cost: '₹12,500', risk: 'low', status: 'active' },
    { name: 'Tomato', unit: 'Unit 2', qty: '320 kg', stored: 'Jan 20, 2026', expires: 'Feb 20, 2026', cost: '₹6,400', risk: 'high', status: 'active' },
    { name: 'Onion', unit: 'Unit 1', qty: '240 kg', stored: 'Jan 25, 2026', expires: 'Mar 25, 2026', cost: '₹3,600', risk: 'low', status: 'active' },
    { name: 'Carrot', unit: 'Unit 3', qty: '180 kg', stored: 'Feb 01, 2026', expires: 'Apr 01, 2026', cost: '₹2,700', risk: 'med', status: 'active' },
    { name: 'Apple', unit: 'Unit 2', qty: '400 kg', stored: 'Feb 08, 2026', expires: 'May 08, 2026', cost: '₹36,000', risk: 'low', status: 'active' },
    { name: 'Grapes', unit: 'Unit 1', qty: '150 kg', stored: 'Feb 12, 2026', expires: 'Mar 12, 2026', cost: '₹9,000', risk: 'med', status: 'active' },
    { name: 'Cabbage', unit: 'Unit 3', qty: '220 kg', stored: 'Dec 28, 2025', expires: 'Feb 15, 2026', cost: '₹2,200', risk: 'low', status: 'withdrawn' },
    { name: 'Potato', unit: 'Unit 2', qty: '300 kg', stored: 'Dec 15, 2025', expires: 'Feb 01, 2026', cost: '₹7,500', risk: 'low', status: 'withdrawn' },
];

function renderCropTable() {
    const el = document.getElementById('cropTableBody');
    if (!el) return;
    const riskBadge = { low: 'badge-risk-low', med: 'badge-risk-med', high: 'badge-risk-high' };
    const riskLabel = { low: 'Low Risk', med: 'Med Risk', high: 'High Risk' };
    el.innerHTML = crops.map(c => `<tr>
    <td class="cell-name">${c.name}</td>
    <td>${c.unit}</td>
    <td>${c.qty}</td>
    <td>${c.stored}</td>
    <td>${c.expires}</td>
    <td>${c.cost}</td>
    <td><span class="badge ${riskBadge[c.risk]}">${riskLabel[c.risk]}</span></td>
    <td><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-withdrawn'}">${c.status === 'active' ? 'Active' : 'Withdrawn'}</span></td>
    <td>${c.status === 'active' ? `<button class="btn-sm" onclick="withdrawBatch(this,'${c.name}')">Withdraw</button>` : ''}</td>
  </tr>`).join('');
}

function openAddCropModal() { document.getElementById('addCropModal').style.display = 'flex'; }
window.openAddCropModal = openAddCropModal;

function addCrop() {
    const type = document.getElementById('cropType').value;
    const qty = document.getElementById('cropQty').value;
    const cost = document.getElementById('cropCost').value;
    const unit = document.getElementById('cropUnit').value;
    if (!qty || !cost) { showToast('error', '✗ Enter quantity and cost.'); return; }
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const exp = new Date(Date.now() + 60 * 24 * 3600000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    crops.unshift({ name: type, unit, qty: qty + 'kg', stored: today, expires: exp, cost: '₹' + (+qty * +cost).toLocaleString(), risk: 'low', status: 'active' });
    renderCropTable();
    document.getElementById('addCropModal').style.display = 'none';
    showToast('success', '✓ Crop batch added successfully!');
}
window.addCrop = addCrop;

function withdrawBatch(btn, name) {
    const row = btn.closest('tr');
    const idx = crops.findIndex(c => c.name === name && c.status === 'active');
    if (idx !== -1) { crops[idx].status = 'withdrawn'; renderCropTable(); }
    showToast('success', `✓ ${name} batch marked as withdrawn.`);
}
window.withdrawBatch = withdrawBatch;

// ── AI Predictions cards ──
function renderPredictions() {
    const el = document.getElementById('predictionCards');
    if (!el) return;
    const activeCrops = crops.filter(c => c.status === 'active');
    el.innerHTML = activeCrops.map(c => {
        const risk = c.risk;
        const safeDays = risk === 'high' ? 3 : risk === 'med' ? 10 : 22;
        const prob = risk === 'high' ? 78 : risk === 'med' ? 28 : 10;
        const color = risk === 'high' ? '#ef4444' : risk === 'med' ? '#f59e0b' : '#22c55e';
        const action = risk === 'high' ? 'URGENT: Transfer batch immediately. Consider early withdrawal to prevent total loss.' :
            risk === 'med' ? 'Monitor closely. Reduce humidity by 3% and verify seal integrity.' :
                'Conditions optimal. No action needed.';
        return `<div class="section-card" style="margin-bottom:1rem">
      <div class="card-header">
        <div><div class="card-title">${c.name} · ${c.unit}</div><div class="card-sub">${c.qty} stored since ${c.stored}</div></div>
        <span class="badge badge-risk-${risk}">${risk.toUpperCase()} RISK</span>
      </div>
      <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1.5rem">
        <div><div style="font-size:.72rem;color:var(--text-3);font-weight:700;text-transform:uppercase;margin-bottom:.3rem">Safe Days Remaining</div>
          <div style="font-size:2rem;font-weight:900;color:${color}">${safeDays}</div></div>
        <div><div style="font-size:.72rem;color:var(--text-3);font-weight:700;text-transform:uppercase;margin-bottom:.3rem">Spoilage Probability</div>
          <div style="font-size:2rem;font-weight:900;color:${color}">${prob}%</div>
          <div style="height:6px;background:#f3f4f6;border-radius:3px;margin-top:.4rem;overflow:hidden">
            <div style="width:${prob}%;height:100%;background:${color};border-radius:3px;transition:width 1s ease"></div>
          </div></div>
        <div style="grid-column:span 2"><div style="font-size:.72rem;color:var(--text-3);font-weight:700;text-transform:uppercase;margin-bottom:.3rem">AI Recommendation</div>
          <div style="background:var(--off-white);border-radius:8px;padding:.8rem;font-size:.85rem;color:var(--text-2);line-height:1.6">${action}</div></div>
      </div>
    </div>`;
    }).join('');
}

// ── Section navigation ──
const sections = ['dashboard', 'crops', 'monitoring', 'predictions', 'reports', 'chat', 'alerts'];
function showSection(id) {
    sections.forEach(s => { const el = document.getElementById('sec-' + s); if (el) el.style.display = s === id ? 'block' : 'none'; });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const titles = {
        dashboard: 'Farmer Dashboard', crops: 'My Crop Batches', monitoring: 'Real-Time Monitoring',
        predictions: 'AI Predictions', reports: 'Reports', chat: 'AI Assistant', alerts: 'Alerts'
    };
    document.getElementById('topbarTitle').textContent = titles[id] || id;
    if (id === 'crops') renderCropTable();
    if (id === 'monitoring') { renderSensors(); if (!liveChart) buildLiveChart(); }
    if (id === 'predictions') renderPredictions();
}
window.showSection = showSection;

// ── Alert sender ──
function sendAlert(type) {
    const msgs = { sms: '📱 SMS alert sent to registered numbers!', wa: '📲 WhatsApp message sent!', voice: '📞 Voice call initiated!' };
    showToast('success', msgs[type] || 'Alert sent!');
}
window.sendAlert = sendAlert;

// ── Download report (demo) ──
function downloadReport(type) { showToast('success', '📄 Report generation started. Download will begin shortly (demo mode).'); }
window.downloadReport = downloadReport;

// ── AI Chat ──
let chatLang = 'en';
function setLang(l) {
    chatLang = l;
    document.getElementById('langEn').classList.toggle('active', l === 'en');
    document.getElementById('langTe').classList.toggle('active', l === 'te');
}
window.setLang = setLang;

const botResponses = {
    en: [
        'Based on current sensor data, your potato batch has a low spoilage risk. Temperature is ideal at 4.2°C.',
        'High humidity (>90%) can cause fungal growth on vegetables. I recommend checking the cooling unit in Unit 2.',
        'Tomatoes stored between 10–13°C have a typical shelf life of 14–21 days. Your Unit 2 temperature is currently 3.9°C — too cold for tomatoes.',
        'For high temperature alerts: (1) Check compressor operation, (2) Verify door seals, (3) Reduce batch load density.',
        'Your energy consumption this month is 15% lower than average — excellent efficiency.',
    ],
    te: [
        'మీ బంగాళాదుంప బ్యాచ్ కు తక్కువ పోయే ప్రమాదం ఉంది. ఉష్ణోగ్రత 4.2°C వద్ద అనువైనది.',
        'అధిక తేమ (>90%) కూరగాయలపై శిలీంద్రాల పెరుగుదలకు కారణం అవుతుంది. Unit 2 లో కూలింగ్ యూనిట్ తనిఖీ చేయండి.',
        'టమాటాలను 10–13°C వద్ద నిల్వ చేస్తే 14–21 రోజులు నిలబడతాయి.',
        'అధిక ఉష్ణోగ్రత హెచ్చరికలకు: కంప్రెసర్ పని చేస్తుందో తనిఖీ చేయండి.',
        'ఈ నెల మీ శక్తి వినిమయం సగటు కంటే 15% తక్కువగా ఉంది.',
    ]
};
let botIdx = 0;

function askBot(q) {
    document.getElementById('chatInput').value = q;
    sendChat();
}
window.askBot = askBot;

function sendChat() {
    const inp = document.getElementById('chatInput');
    const msgs = document.getElementById('chatMessages');
    const txt = inp.value.trim();
    if (!txt) return;
    msgs.innerHTML += `<div class="chat-msg msg-user">${txt}</div>`;
    inp.value = '';
    setTimeout(() => {
        const responses = chatLang === 'te' ? botResponses.te : botResponses.en;
        const resp = responses[botIdx % responses.length];
        botIdx++;
        msgs.innerHTML += `<div class="chat-msg msg-bot"><div class="msg-header">🤖 CropGuardian AI</div>${resp}</div>`;
        msgs.scrollTop = msgs.scrollHeight;
    }, 900);
    msgs.scrollTop = msgs.scrollHeight;
}
window.sendChat = sendChat;

// ── Sidebar mobile toggle ──
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}
window.toggleSidebar = toggleSidebar;

// ── Init ──
buildTempChart();
buildHumChart();
renderSensors();
renderCropTable();
