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

// =============================================
//  ANIMATED ROAMING PLUMBER MASCOT LOGIC
// =============================================
(function initPlumberMascot() {
  // Create Mascot Container
  const mascot = document.createElement('div');
  mascot.id = 'roamingPlumber';
  mascot.className = 'roaming';
  mascot.setAttribute('title', 'Click me!');

  mascot.innerHTML = `
    <div class="mascot-bubble" id="mascotBubble">On it! 🔧</div>
    <div class="mascot-graphic" id="mascotGraphic">
      <svg viewBox="0 0 100 120" width="100%" height="100%">
        <!-- Hardhat / Cap -->
        <path d="M 18,38 Q 50,12 82,38 Z" fill="#d4a017" stroke="#a67c0d" stroke-width="2"/>
        <rect x="12" y="36" width="76" height="8" rx="4" fill="#f0c040"/>
        <!-- Sun Emblem on Cap -->
        <circle cx="50" cy="25" r="6" fill="#1a6330"/>
        <circle cx="50" cy="25" r="3.5" fill="#d4a017"/>

        <!-- Head -->
        <circle cx="50" cy="50" r="19" fill="#ffdbac"/>
        <!-- Ears -->
        <circle cx="30" cy="50" r="4" fill="#ffdbac"/>
        <circle cx="70" cy="50" r="4" fill="#ffdbac"/>
        <!-- Eyes -->
        <ellipse cx="42" cy="47" rx="2.5" ry="3.5" fill="#1a2b1e"/>
        <ellipse cx="58" cy="47" rx="2.5" ry="3.5" fill="#1a2b1e"/>
        <circle cx="43" cy="46" r="1" fill="#ffffff"/>
        <circle cx="59" cy="46" r="1" fill="#ffffff"/>
        <!-- Cheeks -->
        <circle cx="37" cy="53" r="3.5" fill="#ffb6c1" opacity="0.65"/>
        <circle cx="63" cy="53" r="3.5" fill="#ffb6c1" opacity="0.65"/>
        <!-- Friendly Moustache & Smile -->
        <path d="M 38,55 Q 50,60 62,55 Q 50,64 38,55" fill="#4a2c11"/>
        <path d="M 43,62 Q 50,67 57,62" fill="none" stroke="#4a2c11" stroke-width="2" stroke-linecap="round"/>

        <!-- Body & Overalls -->
        <rect x="32" y="66" width="36" height="26" rx="6" fill="#1a6330"/>
        <!-- Straps -->
        <line x1="37" y1="66" x2="41" y2="92" stroke="#0c2e16" stroke-width="4.5"/>
        <line x1="63" y1="66" x2="59" y2="92" stroke="#0c2e16" stroke-width="4.5"/>
        <!-- Gold Buttons -->
        <circle cx="39" cy="74" r="2.5" fill="#d4a017"/>
        <circle cx="61" cy="74" r="2.5" fill="#d4a017"/>

        <!-- Left Arm -->
        <path d="M 32,70 Q 18,78 24,88" fill="none" stroke="#1a6330" stroke-width="7" stroke-linecap="round"/>
        <circle cx="24" cy="88" r="4.5" fill="#ffdbac"/>

        <!-- Right Arm with Wrench -->
        <g class="mascot-wrench">
          <path d="M 68,70 Q 82,76 78,86" fill="none" stroke="#1a6330" stroke-width="7" stroke-linecap="round"/>
          <circle cx="78" cy="86" r="4.5" fill="#ffdbac"/>
          <path d="M 78,86 L 90,72" stroke="#c0c0c0" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M 87,68 L 95,75 L 90,80 L 82,73 Z" fill="#e0e0e0" stroke="#808080" stroke-width="1.5"/>
        </g>

        <!-- Legs & Boots -->
        <g class="mascot-legs">
          <rect x="35" y="90" width="11" height="18" rx="4" fill="#0c2e16"/>
          <rect x="54" y="90" width="11" height="18" rx="4" fill="#0c2e16"/>
          <rect x="30" y="104" width="17" height="11" rx="4" fill="#4a2c11"/>
          <rect x="53" y="104" width="17" height="11" rx="4" fill="#4a2c11"/>
        </g>
      </svg>
    </div>
  `;

  document.body.appendChild(mascot);

  const graphic = document.getElementById('mascotGraphic');
  const bubble = document.getElementById('mascotBubble');

  let isSitting = false;
  let roamTimer = null;
  let currentX = 60;
  let currentY = 120;

  const sitPhrases = [
    "On it! 🔧",
    "Sitting on the job! 💧",
    "Right away! 🚰",
    "Quail Springs Plumbing! ⭐",
    "24/7 Emergency Ready! 🚨",
    "Call (405) 900-3380! 📞",
    "Pipes fixed fast! 🛠️",
    "10,000+ Services Done! 🏆"
  ];

  function showBubble(text) {
    bubble.textContent = text;
    bubble.classList.add('show');
    setTimeout(() => {
      bubble.classList.remove('show');
    }, 3800);
  }

  function setMascotPos(x, y, isWalking = false) {
    if (x > currentX) {
      graphic.classList.remove('facing-left');
    } else if (x < currentX) {
      graphic.classList.add('facing-left');
    }

    currentX = x;
    currentY = y;
    mascot.style.left = `${x}px`;
    mascot.style.top  = `${y}px`;

    if (isWalking) {
      mascot.classList.remove('roaming', 'sitting');
      mascot.classList.add('walking');
    }
  }

  function roamToRandomSpot() {
    if (isSitting) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const scrollY   = window.scrollY;

    const mascotW = 70;
    const mascotH = 90;

    // Pick a spot in current view area
    const newX = Math.max(20, Math.min(viewportW - mascotW - 20, Math.random() * (viewportW - mascotW)));
    const newY = Math.max(scrollY + 100, Math.min(scrollY + viewportH - mascotH - 60, scrollY + Math.random() * (viewportH - 200)));

    setMascotPos(newX, newY, true);

    setTimeout(() => {
      if (!isSitting) {
        mascot.classList.remove('walking');
        mascot.classList.add('roaming');
      }
    }, 850);
  }

  function startRoamingLoop() {
    if (roamTimer) clearInterval(roamTimer);
    roamTimer = setInterval(() => {
      if (!isSitting && Math.random() > 0.3) {
        roamToRandomSpot();
      }
    }, 5500);
  }

  // Sit on top of clicked element
  function sitOnElement(el) {
    isSitting = true;
    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const mascotW = isMobile ? 52 : 68;
    const mascotH = isMobile ? 65 : 85;

    // Position centered right on top edge of element
    const targetX = Math.max(10, Math.min(window.innerWidth - mascotW - 10, rect.left + scrollX + (rect.width / 2) - (mascotW / 2)));
    const targetY = rect.top + scrollY - mascotH + 12;

    setMascotPos(targetX, targetY, true);

    setTimeout(() => {
      mascot.classList.remove('walking', 'roaming');
      mascot.classList.add('sitting');

      const phrase = sitPhrases[Math.floor(Math.random() * sitPhrases.length)];
      showBubble(phrase);
    }, 800);

    // Stand back up after 9 seconds if undisturbed
    setTimeout(() => {
      if (isSitting) {
        isSitting = false;
        mascot.classList.remove('sitting');
        mascot.classList.add('roaming');
        roamToRandomSpot();
      }
    }, 9500);
  }

  // Bind click listeners to all buttons, links, and cards
  document.querySelectorAll('a, button, .btn, .service-card, .contact-card, .review-card, .owner-photo-card').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't override default link behavior, just sit!
      sitOnElement(el);
    });
  });

  // Click mascot directly for a fun jump & spin!
  mascot.addEventListener('click', (e) => {
    e.stopPropagation();
    mascot.style.transition = 'transform 0.4s ease, top 0.8s ease, left 0.8s ease';
    mascot.style.transform = 'scale(1.2) translateY(-30px) rotate(360deg)';
    showBubble("Quail Springs Plumbing at your service! 🚰");

    setTimeout(() => {
      mascot.style.transform = '';
      mascot.style.transition = '';
    }, 600);
  });

  // Initial placement & start roaming
  setTimeout(() => {
    setMascotPos(window.innerWidth - 120, window.scrollY + 160);
    startRoamingLoop();
    showBubble("Hi! I'm your QSP Plumber! 🔧");
  }, 1000);

})();

console.log('Quailspring Plumbing 3D site loaded ✓');

