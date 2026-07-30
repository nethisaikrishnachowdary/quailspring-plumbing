// =============================================
//  QUAILSPRING PLUMBING — 3D INTERACTIVE SCRIPT
// =============================================

// ── Device Detection ─────────────────────────
const isMobile  = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
               || window.innerWidth <= 768;
const isTouch   = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Custom Cursor (desktop only) ─────────────
if (!isTouch) {
const cursorDot  = document.createElement('div');
const cursorRing = document.createElement('div');
cursorDot.className  = 'cursor-dot';
cursorRing.className = 'cursor-ring';
document.body.appendChild(cursorDot);
document.body.appendChild(cursorRing);

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});

(function animateCursor() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateCursor);
})();

document.querySelectorAll('a, button, .tilt-card').forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
});
} // end !isTouch cursor block


// ── Three.js 3D Background ────────────────────
(function initThreeJS() {
  const canvas = document.getElementById('bg3d');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 50);

  // Fewer particles on mobile for performance
  const particleCount = isMobile ? 45 : 120;
  const positions  = new Float32Array(particleCount * 3);
  const velocities = [];
  const particleData = [];

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 160;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 60;
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    velocities.push(
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.02
    );
    particleData.push({ x, y, z });
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xd4a017,
    size: 0.6,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── Connection lines (pipes)
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x2a7a40,
    transparent: true,
    opacity: 0.2,
  });

  // Max distance to draw a line between particles
  const maxDist = 22;
  let lineSegments = null;

  function updateLines() {
    const pos = particleGeo.attributes.position.array;
    const linePositions = [];

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = pos[i*3]   - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const dz = pos[i*3+2] - pos[j*3+2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < maxDist) {
          linePositions.push(
            pos[i*3], pos[i*3+1], pos[i*3+2],
            pos[j*3], pos[j*3+1], pos[j*3+2]
          );
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));

    if (lineSegments) {
      scene.remove(lineSegments);
      lineSegments.geometry.dispose();
    }
    lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSegments);
  }

  // Fewer/smaller rings on mobile
  const ringCount = isMobile ? 3 : 6;
  const ringGroup = new THREE.Group();
  for (let i = 0; i < ringCount; i++) {
    const r = Math.random() * 4 + 2;
    const geo = new THREE.TorusGeometry(r, 0.08, 6, 30);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xd4a017 : 0x1a6330,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.15,
      wireframe: false,
    });
    const torus = new THREE.Mesh(geo, mat);
    torus.position.set(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 30 - 10
    );
    torus.userData = {
      rotX: (Math.random() - 0.5) * 0.01,
      rotY: (Math.random() - 0.5) * 0.01,
      rotZ: (Math.random() - 0.5) * 0.008,
      floatSpeed: Math.random() * 0.002 + 0.001,
      floatOffset: Math.random() * Math.PI * 2,
    };
    ringGroup.add(torus);
  }
  scene.add(ringGroup);

  // ── Ambient + point lights
  scene.add(new THREE.AmbientLight(0x1a6330, 0.5));
  const goldLight = new THREE.PointLight(0xd4a017, 1.5, 100);
  goldLight.position.set(30, 20, 20);
  scene.add(goldLight);

  // ── Mouse parallax on scene (desktop only)
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  if (!isTouch) {
    document.addEventListener('mousemove', e => {
      targetRotY = ((e.clientX / window.innerWidth)  - 0.5) * 0.08;
      targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.05;
    });
  } else {
    // Device orientation for mobile
    window.addEventListener('deviceorientation', e => {
      if (e.gamma !== null && e.beta !== null) {
        targetRotY = (e.gamma / 90) * 0.06;
        targetRotX = ((e.beta - 40) / 90) * 0.04;
      }
    });
  }

  // ── Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animation loop
  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    const pos = particleGeo.attributes.position.array;

    // Move particles
    for (let i = 0; i < particleCount; i++) {
      pos[i*3]   += velocities[i*3];
      pos[i*3+1] += velocities[i*3+1];
      pos[i*3+2] += velocities[i*3+2];

      // Bounce off bounds
      if (Math.abs(pos[i*3])   > 80) velocities[i*3]   *= -1;
      if (Math.abs(pos[i*3+1]) > 50) velocities[i*3+1] *= -1;
      if (Math.abs(pos[i*3+2]) > 30) velocities[i*3+2] *= -1;
    }

    particleGeo.attributes.position.needsUpdate = true;

    // Update lines every 3 frames for performance
    if (frame % 3 === 0) updateLines();

    // Animate rings
    ringGroup.children.forEach((torus, i) => {
      torus.rotation.x += torus.userData.rotX;
      torus.rotation.y += torus.userData.rotY;
      torus.rotation.z += torus.userData.rotZ;
      torus.position.y += Math.sin(Date.now() * torus.userData.floatSpeed + torus.userData.floatOffset) * 0.008;
    });

    // Smooth scene rotation on mouse
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;
    scene.rotation.x = currentRotX;
    scene.rotation.y = currentRotY;

    // Gold light pulse
    goldLight.intensity = 1.2 + Math.sin(Date.now() * 0.001) * 0.4;

    renderer.render(scene, camera);
  }

  animate();
})();

// ── Hero Mouse Parallax (desktop only) ───────
const heroContent = document.getElementById('heroContent');
const depthLayer1 = document.getElementById('depthLayer1');

if (!isTouch && heroContent) {
  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    heroContent.style.transform = `
      perspective(1000px)
      rotateY(${dx * 4}deg)
      rotateX(${-dy * 3}deg)
      translateZ(10px)
    `;
    if (depthLayer1) {
      depthLayer1.style.transform = `translate(${dx * 20}px, ${dy * 15}px)`;
    }
  });

  document.documentElement.addEventListener('mouseleave', () => {
    heroContent.style.transform = '';
    if (depthLayer1) depthLayer1.style.transform = '';
  });
}

// ── VanillaTilt (desktop only) ───────────────
if (typeof VanillaTilt !== 'undefined' && !isTouch) {
  VanillaTilt.init(document.querySelectorAll('.tilt-card'), {
    max: 12,
    speed: 400,
    glare: true,
    'max-glare': 0.25,
    scale: 1.04,
    perspective: 800,
    gyroscope: false,
  });
}

// ── Sticky Header ─────────────────────────────
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Mobile Hamburger ──────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const isOpen = navLinks.classList.contains('open');
  const spans = hamburger.querySelectorAll('span');
  if (isOpen) {
    spans[0].style.cssText = 'transform: translateY(7px) rotate(45deg)';
    spans[1].style.cssText = 'opacity: 0; transform: scaleX(0)';
    spans[2].style.cssText = 'transform: translateY(-7px) rotate(-45deg)';
  } else {
    spans.forEach(s => s.style.cssText = '');
  }
});

navLinks.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => s.style.cssText = '');
  });
});

// ── 3D Scroll Reveal ─────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal-3d').forEach(el => revealObserver.observe(el));

// Service & contact cards staggered reveal
document.querySelectorAll('.service-card, .contact-card').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'perspective(600px) rotateX(20deg) translateY(40px)';
  el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'perspective(600px) rotateX(0deg) translateY(0)';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  obs.observe(el);
});

// ── Active Nav on Scroll ──────────────────────
const sections = document.querySelectorAll('section[id]');
const navItems  = document.querySelectorAll('.nav__link');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

const linkStyle = document.createElement('style');
linkStyle.textContent = `.nav__link.active { color: #fff !important; }
.nav__link.active::after { transform: scaleX(1) !important; }`;
document.head.appendChild(linkStyle);

console.log('Quailspring Plumbing 3D site loaded ✓');
