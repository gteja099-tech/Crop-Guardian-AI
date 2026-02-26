// splash.js — WELCOME TO CROP GUARDIAN AI

// Particle canvas
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + .5,
    dx: (Math.random() - .5) * .4,
    dy: (Math.random() - .5) * .4,
    opacity: Math.random() * .5 + .1,
    color: ['rgba(34,197,94,', 'rgba(249,115,22,', 'rgba(168,224,99,', 'rgba(234,179,8,'][Math.floor(Math.random() * 4)]
}));

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.opacity + ')';
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();

// GSAP headline animation
const tl = gsap.timeline({ delay: .3 });

tl.to('.mask', {
    yPercent: 0, opacity: 1, stagger: .2, duration: 1,
    ease: 'power4.out',
    onStart: () => gsap.set('.mask', { yPercent: 100, opacity: 0 })
})
    .to('.tagline', { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, '-=.2')
    .to('.cta-group', { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, '-=.4');

// Prepare initial states
gsap.set(['.tagline', '.cta-group'], { opacity: 0, y: 20 });
