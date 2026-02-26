// ═══════════════════════════════════════════════════════
// CropGuardianAI — Cinematic Page Transition Animations
// ═══════════════════════════════════════════════════════

/* ─────────────────────────────────────────────────────
 * SHARED: inject a full-screen overlay canvas + center card
 * ───────────────────────────────────────────────────── */
function _createTransitionStage(bgColor) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed;inset:0;z-index:9999;pointer-events:all;
    background:${bgColor};display:flex;align-items:center;
    justify-content:center;flex-direction:column;gap:1.2rem;
    font-family:'Space Grotesk',sans-serif;
  `;
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'position:absolute;inset:0;';
    wrap.appendChild(canvas);
    document.body.appendChild(wrap);
    return { wrap, canvas, ctx: canvas.getContext('2d') };
}

function _centerCard(wrap, html) {
    const card = document.createElement('div');
    card.style.cssText = `
    position:relative;z-index:2;text-align:center;
    pointer-events:none;
  `;
    card.innerHTML = html;
    wrap.appendChild(card);
    return card;
}

/* ═══════════════════════════════════════════════════════
 * 1.  SIGN-OUT  ─ vortex implosion → navigate to login
 * ═══════════════════════════════════════════════════════ */
function playSignOutAnimation(redirectUrl) {
    const { wrap, canvas, ctx } = _createTransitionStage('rgba(5,13,7,0.97)');

    // Center card text
    const card = _centerCard(wrap, `
    <div style="font-size:3rem;margin-bottom:.4rem;animation:soa-spin 1.2s cubic-bezier(.4,0,.6,1) forwards">🌿</div>
    <div style="font-size:1.3rem;font-weight:800;color:#fff;letter-spacing:.05em;opacity:0;animation:soa-title 1.8s ease .2s forwards">Signing Out</div>
    <div style="font-size:.82rem;color:rgba(34,197,94,.6);letter-spacing:.18em;text-transform:uppercase;opacity:0;animation:soa-sub 1.8s ease .5s forwards">See you soon ✦</div>
  `);

    // Inject card keyframes
    const kf = document.createElement('style');
    kf.textContent = `
    @keyframes soa-spin  { 0%{transform:scale(1) rotate(0);filter:drop-shadow(0 0 20px #22c55e)} 60%{transform:scale(1.4) rotate(-20deg);filter:drop-shadow(0 0 60px #22c55e)} 100%{transform:scale(0) rotate(-360deg);filter:drop-shadow(0 0 0px #22c55e)} }
    @keyframes soa-title { 0%{opacity:0;letter-spacing:.3em} 30%{opacity:1} 80%{opacity:1;letter-spacing:.05em} 100%{opacity:0;transform:translateY(-10px)} }
    @keyframes soa-sub   { 0%{opacity:0;transform:translateY(8px)} 30%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
  `;
    document.head.appendChild(kf);

    // Spiral vortex particles
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const particles = Array.from({ length: 120 }, (_, i) => {
        const angle = (i / 120) * Math.PI * 2;
        const radius = 80 + Math.random() * Math.max(W, H) * .45;
        return {
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
            tx: cx, ty: cy,
            color: Math.random() > .5 ? '#22c55e' : (Math.random() > .5 ? '#c9a84c' : '#86efac'),
            size: 1.5 + Math.random() * 3,
            speed: .025 + Math.random() * .02,
            progress: 0,
            delay: Math.random() * .4,
        };
    });

    let start = null;
    function draw(ts) {
        if (!start) start = ts;
        const elapsed = (ts - start) / 1000; // seconds
        ctx.clearRect(0, 0, W, H);

        // Radial gradient glow at center
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
        grd.addColorStop(0, 'rgba(34,197,94,.18)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        let done = 0;
        particles.forEach(p => {
            if (elapsed < p.delay) return;
            p.progress = Math.min(1, p.progress + p.speed);
            // Ease-in spiral: lerp toward center + rotate
            const t = p.progress;
            const ease = t * t * (3 - 2 * t);
            const spiralAngle = ease * Math.PI * 3;
            const r = (1 - ease) * Math.hypot(p.x - cx, p.y - cy);
            const baseAngle = Math.atan2(p.y - cy, p.x - cx);
            const ax = cx + Math.cos(baseAngle + spiralAngle) * r;
            const ay = cy + Math.sin(baseAngle + spiralAngle) * r;

            ctx.beginPath();
            ctx.arc(ax, ay, p.size * (1 - ease * .7), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = (1 - ease) * .9 + .05;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;

            if (p.progress >= 1) done++;
        });

        // Center flash when all converge
        if (done > particles.length * .9) {
            const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * (1 - (done / particles.length - .9) * 10));
            flash.addColorStop(0, 'rgba(34,197,94,.6)');
            flash.addColorStop(1, 'transparent');
            ctx.fillStyle = flash;
            ctx.fillRect(0, 0, W, H);
        }

        if (elapsed < 2.2) {
            requestAnimationFrame(draw);
        } else {
            // Fade out wrap and redirect
            wrap.style.transition = 'opacity .5s ease';
            wrap.style.opacity = '0';
            setTimeout(() => { window.location.href = redirectUrl; }, 500);
        }
    }
    requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════════
 * 2.  SIGN-IN SUCCESS  ─ expanding portal rings + checkmark
 * ═══════════════════════════════════════════════════════ */
function playSignInSuccess(userName, role, redirectUrl) {
    const { wrap, canvas, ctx } = _createTransitionStage('rgba(5,13,7,0.96)');

    const roleEmoji = { farmer: '🌾', employee: '👨‍💻', manager: '👔', admin: '👑' };
    const emoji = roleEmoji[role] || '✅';

    const card = _centerCard(wrap, `
    <div class="sis-check" style="font-size:3.5rem;opacity:0;animation:sis-pop .6s cubic-bezier(.34,1.56,.64,1) .5s forwards">${emoji}</div>
    <div style="font-size:1.5rem;font-weight:800;color:#fff;letter-spacing:-.01em;opacity:0;animation:sis-rise .6s ease .8s forwards">Welcome, ${userName.split(' ')[0]}!</div>
    <div style="font-size:.82rem;color:rgba(34,197,94,.7);letter-spacing:.12em;text-transform:uppercase;opacity:0;animation:sis-rise .5s ease 1.1s forwards">Loading your dashboard →</div>
  `);

    const kf = document.createElement('style');
    kf.textContent = `
    @keyframes sis-pop  { 0%{opacity:0;transform:scale(0) rotate(-30deg)} 70%{transform:scale(1.2) rotate(5deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
    @keyframes sis-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  `;
    document.head.appendChild(kf);

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const rings = Array.from({ length: 6 }, (_, i) => ({ radius: 0, maxR: 120 + i * 90, speed: 3.5 + i * .8, alpha: .9 - i * .12, color: i % 2 === 0 ? '#22c55e' : '#c9a84c', delay: i * 80 }));
    const sparks = Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        return { x: cx, y: cy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, alpha: 1, size: 1.5 + Math.random() * 2.5, color: Math.random() > .5 ? '#22c55e' : '#86efac', born: false, bornAt: 400 + Math.random() * 200 };
    });

    let startTs = null;
    function draw(ts) {
        if (!startTs) startTs = ts;
        const elapsed = ts - startTs;
        ctx.clearRect(0, 0, W, H);

        // Deep glow
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
        grd.addColorStop(0, 'rgba(34,197,94,.1)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

        // Expanding rings
        rings.forEach((r, i) => {
            if (elapsed < r.delay) return;
            r.radius += r.speed;
            if (r.radius < r.maxR) {
                ctx.beginPath();
                ctx.arc(cx, cy, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = r.color;
                ctx.lineWidth = 2.5 - i * .3;
                ctx.globalAlpha = r.alpha * (1 - r.radius / r.maxR);
                ctx.shadowBlur = 20;
                ctx.shadowColor = r.color;
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            }
        });

        // Explosion sparks
        sparks.forEach(s => {
            if (elapsed < s.bornAt) return;
            if (!s.born) s.born = true;
            s.x += s.vx; s.y += s.vy;
            s.vy += .06;
            s.alpha -= .018;
            if (s.alpha <= 0) return;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.shadowBlur = 8;
            ctx.shadowColor = s.color;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        });

        if (elapsed < 2000) {
            requestAnimationFrame(draw);
        } else {
            // 4-panel curtain CLOSE (reverse) before redirect
            _curtainClose(wrap, redirectUrl);
        }
    }
    requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════════
 * 3.  ACCOUNT CREATED  ─ confetti burst + welcome card
 * ═══════════════════════════════════════════════════════ */
function playAccountCreated(userName, role, redirectUrl) {
    const roleLabel = { farmer: 'Farmer', employee: 'Employee', manager: 'Manager', admin: 'Admin' };
    const roleColor = { farmer: '#22c55e', employee: '#3b82f6', manager: '#8b5cf6', admin: '#f59e0b' };
    const bgColor = 'rgba(5,13,7,0.97)';

    const { wrap, canvas, ctx } = _createTransitionStage(bgColor);

    const card = _centerCard(wrap, `
    <div style="font-size:4rem;opacity:0;animation:ac-bounce .7s cubic-bezier(.34,1.56,.64,1) .3s forwards">🎉</div>
    <div style="font-size:1.6rem;font-weight:900;color:#fff;letter-spacing:-.02em;opacity:0;animation:ac-rise .6s ease .7s forwards">Welcome, ${userName.split(' ')[0]}!</div>
    <div style="font-size:.95rem;color:${roleColor[role] || '#22c55e'};font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:0;animation:ac-rise .5s ease .95s forwards">${roleLabel[role] || 'User'} Account Created ✓</div>
    <div style="font-size:.78rem;color:rgba(255,255,255,.35);letter-spacing:.1em;text-transform:uppercase;opacity:0;animation:ac-rise .5s ease 1.3s forwards">Taking you to your dashboard…</div>
  `);

    const kf = document.createElement('style');
    kf.textContent = `
    @keyframes ac-bounce { 0%{opacity:0;transform:scale(0) rotate(-40deg)} 60%{transform:scale(1.3) rotate(8deg)} 80%{transform:scale(.95)} 100%{opacity:1;transform:scale(1) rotate(0)} }
    @keyframes ac-rise   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  `;
    document.head.appendChild(kf);

    const W = canvas.width, H = canvas.height;
    const colors = ['#22c55e', '#c9a84c', '#86efac', '#fff', '#34d399', '#3b82f6', '#f59e0b', '#ec4899'];

    // Confetti pieces
    const confetti = Array.from({ length: 90 }, () => {
        const fromTop = Math.random() < .5;
        return {
            x: Math.random() * W,
            y: fromTop ? -10 - Math.random() * 60 : H + 10,
            w: 6 + Math.random() * 8,
            h: 3 + Math.random() * 5,
            rot: Math.random() * Math.PI * 2,
            rotV: (.02 + Math.random() * .06) * (Math.random() < .5 ? 1 : -1),
            vy: fromTop ? 2.5 + Math.random() * 3.5 : -(2.5 + Math.random() * 3.5),
            vx: (Math.random() - .5) * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            shape: Math.random() < .3 ? 'circle' : 'rect',
        };
    });

    // Burst rings from center
    const rings = Array.from({ length: 4 }, (_, i) => ({ r: 0, maxR: 200 + i * 100, done: false, delay: i * 120 }));

    let startTs = null;
    function draw(ts) {
        if (!startTs) startTs = ts;
        const elapsed = ts - startTs;
        ctx.clearRect(0, 0, W, H);

        const cx = W / 2, cy = H / 2;

        // Center glow
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
        grd.addColorStop(0, `rgba(${role === 'farmer' ? '34,197,94' : role === 'manager' ? '139,92,246' : role === 'employee' ? '59,130,246' : '245,158,11'},.12)`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

        // Burst rings
        rings.forEach((rng, i) => {
            if (elapsed < rng.delay) return;
            rng.r += 4;
            if (rng.r < rng.maxR) {
                const alpha = (1 - rng.r / rng.maxR) * .7;
                ctx.beginPath();
                ctx.arc(cx, cy, rng.r, 0, Math.PI * 2);
                ctx.strokeStyle = colors[i % colors.length];
                ctx.lineWidth = 2;
                ctx.globalAlpha = alpha;
                ctx.shadowBlur = 16; ctx.shadowColor = colors[i % colors.length];
                ctx.stroke();
                ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            }
        });

        // Confetti
        confetti.forEach(c => {
            c.x += c.vx; c.y += c.vy;
            c.rot += c.rotV;
            if (c.y > H + 20 || c.y < -20) { c.alpha -= .03; }

            if (c.alpha <= 0) return;
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.fillStyle = c.color;
            ctx.globalAlpha = c.alpha;
            ctx.shadowBlur = 4; ctx.shadowColor = c.color;
            if (c.shape === 'circle') {
                ctx.beginPath(); ctx.arc(0, 0, c.w / 2, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            }
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            ctx.restore();
        });

        if (elapsed < 2400) {
            requestAnimationFrame(draw);
        } else {
            _curtainClose(wrap, redirectUrl);
        }
    }
    requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════════
 * SHARED: 4-panel curtain CLOSE (panels sweep IN)
 * ═══════════════════════════════════════════════════════ */
function _curtainClose(existingWrap, redirectUrl) {
    // Fade out existing wrap first
    existingWrap.style.transition = 'opacity .3s ease';
    existingWrap.style.opacity = '0';

    setTimeout(() => {
        existingWrap.remove();
        // Build 4-panel close curtain
        const curtain = document.createElement('div');
        curtain.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;pointer-events:all;';

        const panels = [
            { from: 'translate(-101%,-101%)', label: 'tl' },
            { from: 'translate(101%,-101%)', label: 'tr' },
            { from: 'translate(-101%,101%)', label: 'bl' },
            { from: 'translate(101%,101%)', label: 'br' },
        ];

        const kf = document.createElement('style');
        kf.textContent = panels.map(p => `@keyframes cc-${p.label} { from{transform:${p.from}} to{transform:translate(0,0)} }`).join('');
        document.head.appendChild(kf);

        panels.forEach((p, i) => {
            const panel = document.createElement('div');
            panel.style.cssText = `background:#050d07;animation:cc-${p.label} .7s cubic-bezier(.77,0,.18,1) ${i % 2 === 0 ? '0s' : '.06s'} forwards;transform:${p.from};`;
            curtain.appendChild(panel);
        });

        document.body.appendChild(curtain);
        setTimeout(() => { window.location.href = redirectUrl; }, 750);
    }, 320);
}

// Expose globally
window.playSignOutAnimation = playSignOutAnimation;
window.playSignInSuccess = playSignInSuccess;
window.playAccountCreated = playAccountCreated;
