// ═══════════════════════════════════════
// CropGuardianAI — Landing Page JS
// ═══════════════════════════════════════

gsap.registerPlugin(ScrollTrigger);

// ── Particles ──
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
resizeCanvas(); window.addEventListener('resize', resizeCanvas);
const COLORS = ['rgba(26,107,58,', 'rgba(34,197,94,', 'rgba(201,168,76,', 'rgba(22,163,74,'];
const dots = Array.from({ length: 60 }, () => ({
  x: Math.random() * innerWidth, y: Math.random() * innerHeight,
  r: Math.random() * 2 + .4,
  dx: (Math.random() - .5) * .2, dy: (Math.random() - .5) * .2,
  op: Math.random() * .2 + .04,
  c: COLORS[Math.floor(Math.random() * COLORS.length)]
}));
(function animLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dots.forEach(d => {
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = d.c + d.op + ')'; ctx.fill();
    d.x += d.dx; d.y += d.dy;
    if (d.x < 0 || d.x > canvas.width)  d.dx *= -1;
    if (d.y < 0 || d.y > canvas.height)  d.dy *= -1;
  });
  requestAnimationFrame(animLoop);
})();

// ── Hero entrance ──
const heroTl = gsap.timeline({ delay: .15 });
heroTl
  .to('.nav',            { opacity:1, duration:.6, ease:'power2.out' })
  .to('#heroBadge',      { opacity:1, y:0, duration:.7, ease:'power3.out' }, '-=.2')
  .to('#heroHeadline',   { opacity:1, y:0, duration:1,  ease:'power4.out' }, '-=.4')
  .to('#heroSub',        { opacity:1, y:0, duration:.8, ease:'power2.out' }, '-=.5')
  .to('#heroCta',        { opacity:1, y:0, duration:.7, ease:'power2.out' }, '-=.4')
  .to('#heroStats',      { opacity:1, y:0, duration:.7, ease:'power2.out' }, '-=.35')
  .to('#scrollIndicator',{ opacity:1, duration:1, ease:'power2.out' },       '-=.3')
  .to('.hero-float-card',{ opacity:1, x:0, duration:.7, stagger:.2, ease:'power2.out' }, '-=.5');

// ── Counter animation ──
function animateCounters() {
  document.querySelectorAll('.stat-val').forEach(el => {
    const target = +el.dataset.target;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      const display = start >= 1000 ? (start/1000).toFixed(1) + 'K' : Math.floor(start);
      el.textContent = prefix + display + suffix;
      if (start >= target) clearInterval(timer);
    }, 25);
  });
}
let countersRun = false;
const statsObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !countersRun) { countersRun=true; animateCounters(); }
}, { threshold: .4 });
const heroStats = document.getElementById('heroStats');
if (heroStats) statsObs.observe(heroStats);

// ── Scroll-based navbar ──
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', scrollY > 40);
});

// ── ScrollTrigger reveal ──
function setupReveal() {
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 88%',
      onEnter: () => el.classList.add('revealed'),
    });
  });
}
setupReveal();

// ── Hamburger ──
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;
function closeMobile() {
  menuOpen = false;
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
}
hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  mobileMenu.classList.toggle('open', menuOpen);
  hamburger.classList.toggle('open', menuOpen);
});
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  const id = l.getAttribute('href');
  document.querySelector(id)?.scrollIntoView({ behavior:'smooth' });
}));

// ── Smooth section scrolling ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    closeMobile();
  });
});

// ── Page navigation with leaf burst ──
function goTo(url) {
  // Burst leaves
  const lc = document.getElementById('leavesContainer');
  const emojis = ['🍃','🌿','🍀','🌱'];
  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      const dur = 1.4 + Math.random() * 1.2;
      el.style.cssText = `
        position:fixed; top:-40px; left:${Math.random()*100}vw; z-index:9999;
        font-size:${.7 + Math.random()*.8}rem; pointer-events:none; opacity:0;
        animation:leaf-fall ${dur}s linear forwards;
        --d: ${(Math.random()-.5)*180}px;
      `;
      el.textContent = emojis[Math.floor(Math.random()*4)];
      lc.appendChild(el);
      setTimeout(() => el.remove(), (dur+1)*1000);
    }, i * 45);
  }
  // Exit animation
  const exitTl = gsap.timeline({ onComplete: () => {
    const ov = document.getElementById('pgOverlay');
    ov.classList.add('active');
    setTimeout(() => window.location.href = url, 350);
  }});
  exitTl
    .to('#scrollIndicator', { opacity:0, duration:.2 })
    .to('#heroStats',   { opacity:0, y:-25, duration:.35, ease:'power2.in' }, '-=.1')
    .to('#heroCta',     { opacity:0, y:-35, duration:.35, ease:'power2.in' }, '-=.2')
    .to('#heroSub',     { opacity:0, y:-25, duration:.3,  ease:'power2.in' }, '-=.2')
    .to('#heroHeadline',{ opacity:0, y:-60, duration:.45, ease:'power3.in' }, '-=.2')
    .to('#heroBadge',   { opacity:0, y:-16, duration:.3,  ease:'power2.in' }, '-=.3')
    .to('.nav',         { opacity:0, duration:.25 }, '-=.2');
}
window.goTo = goTo;

// ── Terminal typewriter ──
const termBody = document.getElementById('termBody');
const typeLines = [
  { type:'cmd',  text:'$ POST /api/predict' },
  { type:'json', text:'{ "unit_id": "TDG-003", "temp_history": [3.8, 4.1, 4.5], "humidity_history": [82, 84, 86] }' },
  { type:'res',  text:'→ Response (142ms)' },
  { type:'json', text:'{ "spoilage_probability": 0.11, "remaining_safe_days": 22, "risk_class": "Low", "action": "Maintain current settings" }' },
];
let tIdx = 0;
function typeNextLine() {
  if (tIdx >= typeLines.length) { tIdx = 0; termBody.innerHTML = ''; setTimeout(typeNextLine, 1500); return; }
  const line = typeLines[tIdx++];
  const div = document.createElement('div');
  div.className = line.type === 'cmd' ? 'term-line' : line.type === 'res' ? 'term-line term-res' : 'term-line term-json';
  termBody.appendChild(div);
  let i = 0;
  const interval = setInterval(() => {
    div.textContent = (line.type === 'cmd' ? '' : '') + line.text.substring(0, ++i);
    if (i >= line.text.length) { clearInterval(interval); setTimeout(typeNextLine, 600); }
  }, 18);
}
// Start typing after terminal enters viewport
const termObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { termObs.disconnect(); setTimeout(typeNextLine, 800); }
}, { threshold: .3 });
if (termBody) termObs.observe(termBody);

// ── Leaf fall animation injection ──
const leafStyle = document.createElement('style');
leafStyle.textContent = `
@keyframes leaf-fall {
  0%  { opacity:0; transform:translateY(0) rotate(0deg) translateX(0); }
  10% { opacity:1; }
  90% { opacity:.9; }
  100%{ opacity:0; transform:translateY(105vh) rotate(600deg) translateX(var(--d)); }
}`;
document.head.appendChild(leafStyle);

// ── Ambient leaves ──
function spawnLeaf() {
  const lc = document.getElementById('leavesContainer');
  if (!lc) return;
  const el = document.createElement('div');
  const dur = 9 + Math.random() * 7;
  el.style.cssText = `
    position:fixed; top:-40px; left:${Math.random()*100}vw; z-index:0;
    font-size:${.5+Math.random()*.6}rem; pointer-events:none; opacity:0;
    animation:leaf-fall ${dur}s linear forwards; --d:${(Math.random()-.5)*120}px;
  `;
  el.textContent = ['🍃','🌿','🍀'][Math.floor(Math.random()*3)];
  lc.appendChild(el);
  setTimeout(() => el.remove(), (dur+1)*1000);
}
setTimeout(() => { spawnLeaf(); setInterval(spawnLeaf, 3000); }, 3000);
