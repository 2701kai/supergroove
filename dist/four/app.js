'use strict';

// Effects in this version are plain-JavaScript takes on React Bits components (reactbits.dev);
// each section names the component it follows.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const motionOK = () => !reduceMotion.matches;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
let toastTimer;

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}

// Runs `step(seconds)` every frame while the element is on screen, the tab is visible and motion is welcome.
function animateWhileVisible(element, step, onPause) {
  let visible = false;
  let frame = 0;
  let last = 0;
  const run = now => {
    step(Math.min(0.05, (now - last) / 1000), now);
    last = now;
    frame = requestAnimationFrame(run);
  };
  const update = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden && motionOK()) {
      last = performance.now();
      frame = requestAnimationFrame(run);
    } else if (onPause) {
      onPause();
    }
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(element);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener('change', update);
}

/* ---------- Noise: fine paper grain over the page ---------- */

{
  const size = 140;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.random() * 255;
    image.data[index] = image.data[index + 1] = image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  document.documentElement.style.setProperty('--grain', `url(${canvas.toDataURL()})`);
}

/* ---------- Grainient: slow, grainy sunset gradient behind the hero (WebGL) ---------- */

{
  const canvas = document.querySelector('#grainient');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  const vertexSource = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fragmentSource = `
    precision mediump float;
    uniform vec2 uRes;
    uniform float uTime;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y);
      float t = uTime * 0.045;
      vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, -t)));
      float n = fbm(p * 1.7 + q * 1.8 + vec2(t * 0.6, 0.0));
      vec3 paper = vec3(0.984, 0.929, 0.827);
      vec3 peach = vec3(0.988, 0.820, 0.580);
      vec3 apricot = vec3(0.973, 0.729, 0.431);
      vec3 sun = vec3(0.961, 0.537, 0.165);
      vec3 ember = vec3(0.839, 0.353, 0.133);
      vec3 lagoon = vec3(0.373, 0.702, 0.659);
      float warm = uv.x * 0.85 + uv.y * 0.45 + (n - 0.5) * 0.7;
      vec3 col = mix(paper, peach, smoothstep(0.15, 0.6, warm));
      col = mix(col, apricot, smoothstep(0.5, 0.9, warm));
      col = mix(col, sun, smoothstep(0.78, 1.1, warm + q.x * 0.25) * 0.75);
      col = mix(col, ember, smoothstep(0.95, 1.25, warm + n * 0.3) * 0.45);
      col = mix(col, lagoon, smoothstep(0.6, 0.9, q.y) * (1.0 - uv.y) * 0.3);
      col += (hash(gl_FragCoord.xy + floor(uTime * 10.0)) - 0.5) * 0.05;
      gl_FragColor = vec4(col, 1.0);
    }`;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };

  let program = null;
  if (gl) {
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch {
      program = null;
    }
  }

  // Without WebGL the CSS gradient underneath stays visible.
  if (program) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, 'uRes');
    const time = gl.getUniformLocation(program, 'uTime');
    let elapsed = 40;

    // Rendered at half resolution: the gradient is soft anyway and the grain overlay stays crisp.
    const draw = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth * 0.5));
      const height = Math.max(1, Math.round(canvas.clientHeight * 0.5));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(resolution, width, height);
      gl.uniform1f(time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    draw();
    canvas.classList.add('ready');
    animateWhileVisible(canvas, seconds => {
      elapsed += seconds;
      draw();
    }, draw);
    window.addEventListener('resize', draw);
  }
}

/* ---------- Split Text: title letters spring in (CSS) and jump when touched ---------- */

for (const char of document.querySelectorAll('.title .char')) {
  char.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !motionOK()) return;
    char.animate(
      [{ transform: 'none' }, { transform: 'translateY(-16%) rotate(-6deg)' }, { transform: 'none' }],
      { duration: 520, easing: 'cubic-bezier(.34, 1.56, .64, 1)' }
    );
  });
}

/* ---------- Rotating Text ---------- */

{
  const rotating = document.querySelector('#rotating');
  const words = rotating.dataset.words.split('|');
  const padding = () => parseFloat(getComputedStyle(rotating).paddingLeft) * 2;
  const makeWord = word => {
    const element = document.createElement('span');
    element.className = 'rotating-word';
    [...word].forEach((letter, index) => {
      const char = document.createElement('span');
      char.className = 'rc';
      char.style.setProperty('--d', index);
      char.textContent = letter;
      element.append(char);
    });
    return element;
  };
  let index = 0;
  let current = makeWord(words[0]);
  rotating.querySelector('.rotating-word').replaceWith(current);

  document.fonts.ready.then(() => {
    if (!motionOK()) return;
    rotating.style.width = `${current.offsetWidth + padding()}px`;
    rotating.classList.add('is-rotating');
    setInterval(() => {
      if (document.hidden || !motionOK()) return;
      index = (index + 1) % words.length;
      const next = makeWord(words[index]);
      next.classList.add('enter');
      rotating.append(next);
      rotating.style.width = `${next.offsetWidth + padding()}px`;
      current.classList.add('exit');
      const previous = current;
      current = next;
      requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('enter')));
      setTimeout(() => previous.remove(), 800);
    }, 2400);
  });
}

/* ---------- Circular Text: speeds up while hovered ---------- */

{
  const badge = document.querySelector('#circular-text');
  const ring = badge.querySelector('.circular-ring');
  let angle = 0;
  let speed = 18;
  let target = 18;
  badge.addEventListener('pointerenter', () => { target = 110; });
  badge.addEventListener('pointerleave', () => { target = 18; });
  animateWhileVisible(badge, seconds => {
    speed = lerp(speed, target, 0.05);
    angle = (angle + speed * seconds) % 360;
    ring.style.transform = `rotate(${angle.toFixed(2)}deg)`;
  });
}

/* ---------- Tilted Card with Glare Hover: Ronald, eyes open ---------- */

{
  const card = document.querySelector('#tilt-card');
  const caption = document.querySelector('#tilt-caption');
  caption.textContent = 'Klick für ein Bum!';
  const current = { rx: 0, ry: 0, scale: 1 };
  const target = { rx: 0, ry: 0, scale: 1 };
  let frame = 0;
  let lastX = 0;

  const render = () => {
    current.rx = lerp(current.rx, target.rx, 0.14);
    current.ry = lerp(current.ry, target.ry, 0.14);
    current.scale = lerp(current.scale, target.scale, 0.14);
    card.style.setProperty('--rx', `${current.rx.toFixed(2)}deg`);
    card.style.setProperty('--ry', `${current.ry.toFixed(2)}deg`);
    card.style.setProperty('--s', current.scale.toFixed(3));
    const settled = Math.abs(current.rx - target.rx) + Math.abs(current.ry - target.ry) + Math.abs(current.scale - target.scale) < 0.01;
    frame = settled ? 0 : requestAnimationFrame(render);
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(render); };

  card.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !motionOK()) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    target.rx = (0.5 - y / rect.height) * 14;
    target.ry = (x / rect.width - 0.5) * 14;
    target.scale = 1.04;
    card.classList.add('hovering');
    card.style.setProperty('--glare', '1');
    card.style.setProperty('--gx', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--gy', `${(y / rect.height) * 100}%`);
    card.style.setProperty('--cx', `${x + 16}px`);
    card.style.setProperty('--cy', `${y + 18}px`);
    card.style.setProperty('--cr', `${clamp((lastX - x) * 0.8, -12, 12).toFixed(1)}deg`);
    lastX = x;
    kick();
  });
  card.addEventListener('pointerleave', () => {
    target.rx = target.ry = 0;
    target.scale = 1;
    card.classList.remove('hovering');
    card.style.setProperty('--glare', '0');
    kick();
  });
  card.addEventListener('click', () => hit('surdo'));
}

/* ---------- Magnet: buttons lean towards the pointer ---------- */

if (finePointer.matches) {
  const magnets = [...document.querySelectorAll('[data-magnet]')];
  let pointer = null;
  let frame = 0;
  const pull = () => {
    frame = 0;
    for (const item of magnets) {
      const rect = item.getBoundingClientRect();
      const dx = pointer.clientX - (rect.left + rect.width / 2);
      const dy = pointer.clientY - (rect.top + rect.height / 2);
      const near = Math.abs(dx) < rect.width / 2 + 60 && Math.abs(dy) < rect.height / 2 + 60;
      item.style.translate = near && motionOK() ? `${(dx / 6).toFixed(1)}px ${(dy / 6).toFixed(1)}px` : '';
    }
  };
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    pointer = event;
    if (!frame) frame = requestAnimationFrame(pull);
  }, { passive: true });
}

/* ---------- Click Spark ---------- */

{
  const canvas = document.querySelector('#spark-canvas');
  const context = canvas.getContext('2d');
  const colors = ['#f5892a', '#c93a22', '#e3a33b', '#2f8f8a', '#2c6b3f'];
  const duration = 450;
  let sparks = [];
  let frame = 0;
  let ratio = 1;
  const resize = () => {
    ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
  };
  resize();
  window.addEventListener('resize', resize);

  const draw = now => {
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter(spark => now - spark.start < duration);
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    for (const spark of sparks) {
      const progress = (now - spark.start) / duration;
      const eased = progress * (2 - progress);
      const distance = eased * 32;
      const length = 12 * (1 - eased);
      const cos = Math.cos(spark.angle);
      const sin = Math.sin(spark.angle);
      context.strokeStyle = spark.color;
      context.beginPath();
      context.moveTo(spark.x + distance * cos, spark.y + distance * sin);
      context.lineTo(spark.x + (distance + length) * cos, spark.y + (distance + length) * sin);
      context.stroke();
    }
    frame = sparks.length ? requestAnimationFrame(draw) : 0;
  };

  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !motionOK()) return;
    const now = performance.now();
    for (let index = 0; index < 9; index++) {
      sparks.push({ x: event.clientX, y: event.clientY, start: now, color: colors[index % colors.length], angle: (Math.PI * 2 * index) / 9 + Math.random() * 0.3 });
    }
    if (!frame) frame = requestAnimationFrame(draw);
  });
}

/* ---------- Curved Loop: text running along a wave, draggable ---------- */

{
  const svg = document.querySelector('#curved-loop');
  const path = document.querySelector('#curve-path');
  const textPath = document.querySelector('#curve-textpath');
  const measure = document.querySelector('#curve-measure');
  const phrase = measure.textContent;
  let spacing = 0;
  let offset = 0;
  let direction = -1;
  let dragging = false;
  let lastX = 0;

  const place = () => {
    if (offset > 0) offset -= spacing;
    if (offset <= -spacing) offset += spacing;
    textPath.setAttribute('startOffset', offset.toFixed(1));
  };
  const build = () => {
    spacing = measure.getComputedTextLength();
    if (!spacing) return;
    textPath.textContent = phrase.repeat(Math.ceil(path.getTotalLength() / spacing) + 2);
    offset = -spacing;
    place();
  };
  build();
  document.fonts.ready.then(build);

  svg.addEventListener('pointerdown', event => {
    dragging = true;
    lastX = event.clientX;
    svg.setPointerCapture(event.pointerId);
    svg.classList.add('dragging');
  });
  svg.addEventListener('pointermove', event => {
    if (!dragging || !spacing) return;
    const unitsPerPixel = 1 / (svg.getScreenCTM()?.a || 1);
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    offset += dx * unitsPerPixel;
    if (dx) direction = Math.sign(dx);
    place();
  });
  const release = () => {
    dragging = false;
    svg.classList.remove('dragging');
  };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);

  animateWhileVisible(svg, seconds => {
    if (dragging || !spacing) return;
    offset += direction * 90 * seconds;
    place();
  });
}

/* ---------- Scroll Velocity: strips that speed up and turn with your scrolling ---------- */

{
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let rawSpeed = 0;
  window.addEventListener('scroll', () => {
    const now = performance.now();
    rawSpeed = ((window.scrollY - lastY) / Math.max(16, now - lastTime)) * 1000;
    lastY = window.scrollY;
    lastTime = now;
  }, { passive: true });
  const scrollSpeed = () => (performance.now() - lastTime > 120 ? 0 : rawSpeed);

  for (const row of document.querySelectorAll('.velocity-row')) {
    const track = row.querySelector('.velocity-track');
    const base = Number(row.dataset.velocity);
    let x = 0;
    let smooth = 0;
    let direction = 1;
    animateWhileVisible(row, seconds => {
      smooth = lerp(smooth, scrollSpeed(), 0.08);
      const factor = clamp((smooth / 1000) * 4, -8, 8);
      if (factor < -0.05) direction = -1;
      else if (factor > 0.05) direction = 1;
      const width = track.firstElementChild.offsetWidth;
      x -= base * direction * seconds * (1 + Math.abs(factor));
      if (x <= -width) x += width;
      if (x > 0) x -= width;
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    });
  }
}

/* ---------- Blur Text, Fade Content and Scroll Reveal ---------- */

function splitWords(node, className, counter = { index: 0 }) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(part);
        } else {
          const word = document.createElement('span');
          word.className = className;
          word.style.setProperty('--w', counter.index++);
          word.textContent = part;
          fragment.append(word);
        }
      }
      child.replaceWith(fragment);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      splitWords(child, className, counter);
    }
  }
  return node;
}

const blurTargets = [...document.querySelectorAll('[data-blur]')].map(element => splitWords(element, 'blur-word'));
const statement = splitWords(document.querySelector('.statement'), 'word');
const revealTargets = [...document.querySelectorAll('[data-reveal]'), ...blurTargets];
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('can-reveal');
  const revealer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      revealer.unobserve(entry.target);
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(target => revealer.observe(target));
}

// Scroll Reveal: words sharpen and light up as the statement scrolls through the viewport.
{
  const words = [...statement.querySelectorAll('.word')];
  let lastProgress = -1;
  const update = () => {
    if (!motionOK()) {
      lastProgress = -1;
      words.forEach(word => { word.style.opacity = ''; word.style.filter = ''; });
      statement.style.transform = '';
      return;
    }
    const rect = statement.getBoundingClientRect();
    const progress = clamp((innerHeight * 0.92 - rect.top) / (rect.height + innerHeight * 0.45), 0, 1);
    if (Math.abs(progress - lastProgress) < 0.001) return;
    lastProgress = progress;
    const span = words.length + 6;
    words.forEach((word, index) => {
      const amount = clamp((progress * span - index) / 6, 0, 1);
      word.style.opacity = (0.14 + 0.86 * amount).toFixed(3);
      word.style.filter = amount < 1 ? `blur(${(4 * (1 - amount)).toFixed(2)}px)` : '';
    });
    statement.style.transform = `rotate(${(3 * (1 - clamp(progress * 1.6, 0, 1))).toFixed(2)}deg)`;
  };
  update();
  animateWhileVisible(statement, update);
}

/* ---------- Spotlight Card and the illustration's parallax ---------- */

for (const card of document.querySelectorAll('.spotlight')) {
  card.addEventListener('pointermove', event => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
}

{
  const frame = document.querySelector('#brasil-frame');
  let shift = '';
  animateWhileVisible(frame, () => {
    const rect = frame.getBoundingClientRect();
    const position = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
    const next = `${(clamp(position, -1, 1) * -24).toFixed(1)}px`;
    if (next !== shift) frame.style.setProperty('--py', shift = next);
  });
}

{
  const route = document.querySelector('.route');
  const applyMotion = () => (motionOK() ? route.unpauseAnimations() : route.pauseAnimations());
  applyMotion();
  reduceMotion.addEventListener('change', applyMotion);
}

/* ---------- Header state and navigation highlight ---------- */

const header = document.querySelector('.site-header');
const navLinks = [...document.querySelectorAll('.main-nav a')];
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  // Watch every anchored section so sections without a nav entry clear the highlight.
  document.querySelectorAll('main section[id]').forEach(section => spy.observe(section));
}

/* ---------- Countdown with a rolling Counter (3 April 2027, 00:00 in Berlin) ---------- */

const eventStart = Date.UTC(2027, 3, 2, 22);
const eventEnd = Date.UTC(2027, 3, 3, 22);

function createCounter(element, minPlaces) {
  let columns = [];
  const build = places => {
    element.textContent = '';
    columns = Array.from({ length: places }, () => {
      const digit = document.createElement('span');
      digit.className = 'digit';
      for (let number = 0; number < 10; number++) {
        const face = document.createElement('span');
        face.textContent = number;
        digit.append(face);
      }
      element.append(digit);
      return digit;
    });
  };
  return (value, instant) => {
    const text = String(value).padStart(minPlaces, '0');
    if (text.length !== columns.length) {
      build(text.length);
      instant = true;
    }
    [...text].forEach((char, place) => {
      const digit = Number(char);
      [...columns[place].children].forEach((face, number) => {
        let offset = (number - digit + 10) % 10;
        if (offset > 5) offset -= 10;
        const previous = Number(face.style.getPropertyValue('--o'));
        // Only faces next to the window roll; the rest jump so they never sweep across it.
        face.classList.toggle('jump', instant || !motionOK() || Math.abs(offset - previous) > 1);
        face.style.setProperty('--o', offset);
      });
    });
  };
}

{
  const counters = {
    days: createCounter(document.querySelector('#cd-days'), 1),
    hours: createCounter(document.querySelector('#cd-hours'), 2),
    minutes: createCounter(document.querySelector('#cd-minutes'), 2),
    seconds: createCounter(document.querySelector('#cd-seconds'), 2)
  };
  const status = document.querySelector('#countdown-status');
  const spoken = document.querySelector('#cd-text');
  let first = true;
  let timer;
  const tick = () => {
    const now = Date.now();
    const remaining = Math.max(0, eventStart - now);
    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor(remaining / 3600000) % 24,
      minutes: Math.floor(remaining / 60000) % 60,
      seconds: Math.floor(remaining / 1000) % 60
    };
    for (const [unit, counter] of Object.entries(counters)) counter(values[unit], first);
    first = false;
    spoken.textContent = `Noch ${values.days} Tage, ${values.hours} Stunden und ${values.minutes} Minuten.`;
    if (now >= eventEnd) status.textContent = 'Danke für den Groove!';
    else if (now >= eventStart) status.textContent = 'Heute ist es so weit!';
    else status.textContent = remaining <= 86400000 ? 'Morgen geht’s los!' : 'bis zum 3. April 2027';
    if (remaining === 0) clearInterval(timer);
  };
  tick();
  timer = setInterval(tick, 1000);
}

/* ---------- Batucada: samba drum machine with Web Audio, Elastic Slider tempo, Ronald on video ---------- */

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audio;
let master;
let noise;

function ensureAudio() {
  if (!AudioContextClass) {
    notify('Dein Browser kann hier leider keine Klänge abspielen.');
    return null;
  }
  if (!audio) {
    audio = new AudioContextClass();
    const compressor = audio.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;
    master = audio.createGain();
    master.gain.value = 0.72;
    master.connect(compressor).connect(audio.destination);
    noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
  }
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function envelope(time, peak, decay) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  gain.connect(master);
  return gain;
}

function tone(type, time, from, to, glide, peak, decay, output) {
  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, time);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, time + glide);
  osc.connect(output || envelope(time, peak, decay));
  osc.start(time);
  osc.stop(time + decay + 0.05);
}

function hiss(time, filterType, frequency, q, peak, decay) {
  const source = audio.createBufferSource();
  source.buffer = noise;
  const filter = audio.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  source.connect(filter).connect(envelope(time, peak, decay));
  source.start(time, Math.random() * 0.5);
  source.stop(time + decay + 0.05);
}

const voices = {
  surdo(time, velocity = 1, open = true) {
    tone('sine', time, 120, 52, 0.12, 0.95 * velocity, open ? 0.85 : 0.22);
    tone('triangle', time, 240, 90, 0.05, 0.18 * velocity, 0.08);
    hiss(time, 'lowpass', 900, 0.7, 0.12 * velocity, 0.03);
  },
  caixa(time, velocity = 1) {
    hiss(time, 'bandpass', 3200, 0.9, 0.55 * velocity, 0.11);
    hiss(time, 'highpass', 6500, 0.5, 0.18 * velocity, 0.06);
    tone('triangle', time, 330, 220, 0.04, 0.16 * velocity, 0.05);
  },
  tamborim(time, velocity = 1) {
    tone('triangle', time, 1150, 760, 0.03, 0.5 * velocity, 0.07);
    hiss(time, 'highpass', 5000, 0.7, 0.2 * velocity, 0.025);
  },
  agogo(time, velocity = 1, high = true) {
    const base = high ? 940 : 705;
    const bell = envelope(time, 0.34 * velocity, 0.42);
    tone('sine', time, base, base, 0, 0, 0.42, bell);
    tone('sine', time, base * 2.02, base * 2.02, 0, 0, 0.42, bell);
    tone('triangle', time, base * 3.96, base * 3.96, 0, 0, 0.2, envelope(time, 0.05 * velocity, 0.2));
  },
  chocalho(time, velocity = 1) {
    hiss(time, 'highpass', 7000, 0.6, 0.16 * velocity, 0.05);
  }
};

// Two bars of 2/4 in sixteenth notes: surdo heartbeat, caixa carpet, teleco-teco tamborim, agogô call.
const pattern = {
  surdo: { 0: [0.55, false], 4: [1, true], 8: [0.55, false], 12: [1, true], 14: [0.35, false] },
  caixa: [0.9, 0.22, 0.45, 0.7, 0.9, 0.22, 0.45, 0.7, 0.9, 0.22, 0.45, 0.7, 0.9, 0.22, 0.6, 0.8],
  tamborim: { 0: 0.8, 3: 0.7, 6: 0.8, 10: 0.75, 12: 0.8 },
  agogo: { 0: true, 3: false, 6: true, 8: false, 10: true, 11: false, 14: true },
  chocalho: [0.5, 0.25, 0.7, 0.25, 0.5, 0.25, 0.7, 0.25, 0.5, 0.25, 0.7, 0.25, 0.5, 0.25, 0.7, 0.25]
};
const baseTempo = 104;
let tempo = baseTempo;
let stepLength = 60 / tempo / 4;

const video = document.querySelector('#ronald-video');
const pads = Object.fromEntries([...document.querySelectorAll('.pad')].map(pad => [pad.dataset.voice, pad]));
const steps = document.querySelector('#steps');
for (let index = 0; index < 16; index++) steps.append(document.createElement('i'));
const stepLights = [...steps.children];
const grooveButton = document.querySelector('#groove-toggle');
const grooveLabel = document.querySelector('#groove-label');
const grooveIcon = document.querySelector('#groove-icon');
let schedulerTimer = null;
let nextStepTime = 0;
let currentStep = 0;
let queue = [];
let drawFrame;

function flash(voice) {
  const pad = pads[voice];
  if (!pad) return;
  pad.classList.add('hit');
  clearTimeout(pad.hitTimer);
  pad.hitTimer = setTimeout(() => pad.classList.remove('hit'), 110);
}

function hit(voice) {
  if (!ensureAudio()) return;
  const time = audio.currentTime + 0.005;
  if (voice === 'surdo') voices.surdo(time, 1, true);
  else if (voice === 'agogo') voices.agogo(time, 1, !pads.agogo.lowNext);
  else voices[voice](time, 1);
  if (voice === 'agogo') pads.agogo.lowNext = !pads.agogo.lowNext;
  flash(voice);
}

function scheduleStep(step, time) {
  const surdo = pattern.surdo[step];
  if (surdo) voices.surdo(time, surdo[0], surdo[1]);
  voices.caixa(time, pattern.caixa[step] * 0.7);
  if (pattern.tamborim[step]) voices.tamborim(time, pattern.tamborim[step]);
  if (step in pattern.agogo) voices.agogo(time, 0.8, pattern.agogo[step]);
  voices.chocalho(time, pattern.chocalho[step]);
}

function scheduler() {
  while (nextStepTime < audio.currentTime + 0.12) {
    scheduleStep(currentStep, nextStepTime);
    queue.push({ step: currentStep, time: nextStepTime });
    nextStepTime += stepLength;
    currentStep = (currentStep + 1) % 16;
  }
}

function drawSteps() {
  while (queue.length && queue[0].time <= audio.currentTime) {
    const { step } = queue.shift();
    stepLights.forEach((light, index) => light.classList.toggle('on', index === step));
    if (pattern.surdo[step]) flash('surdo');
    if (pattern.tamborim[step]) flash('tamborim');
    if (step in pattern.agogo) flash('agogo');
    if (pattern.caixa[step] >= 0.7) flash('caixa');
  }
  drawFrame = requestAnimationFrame(drawSteps);
}

function startGroove() {
  if (!ensureAudio()) return;
  currentStep = 0;
  queue = [];
  nextStepTime = audio.currentTime + 0.08;
  scheduler();
  schedulerTimer = setInterval(scheduler, 25);
  drawFrame = requestAnimationFrame(drawSteps);
  document.body.classList.add('grooving');
  grooveButton.setAttribute('aria-pressed', 'true');
  grooveLabel.textContent = 'BATERIA STOPPEN';
  grooveIcon.innerHTML = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
  // Ronald drums along, muted, at the bateria's tempo.
  if (motionOK()) {
    video.playbackRate = tempo / baseTempo;
    video.play().catch(() => {});
  }
}

function stopGroove() {
  if (!schedulerTimer) return;
  clearInterval(schedulerTimer);
  schedulerTimer = null;
  cancelAnimationFrame(drawFrame);
  stepLights.forEach(light => light.classList.remove('on'));
  document.body.classList.remove('grooving');
  grooveButton.setAttribute('aria-pressed', 'false');
  grooveLabel.textContent = 'BATERIA STARTEN';
  grooveIcon.innerHTML = '<path d="m9 5 11 7-11 7z"/>';
  // Back to the first frame, where Ronald looks straight at you.
  video.pause();
  if (video.readyState) video.currentTime = 0;
}

grooveButton.addEventListener('click', () => (schedulerTimer ? stopGroove() : startGroove()));

for (const [voice, pad] of Object.entries(pads)) {
  // Once audio runs, play on press for a tight feel. Browsers only unlock audio on click or
  // pointerup for touch, so the first tap (and keyboard activation) plays from the click.
  pad.addEventListener('pointerdown', event => {
    pad.pointerPlayed = event.button === 0 && audio?.state === 'running';
    if (pad.pointerPlayed) hit(voice);
  });
  pad.addEventListener('click', event => {
    if (event.detail !== 0 && pad.pointerPlayed) return;
    hit(voice);
  });
}

document.addEventListener('keydown', event => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || !/^[1-4]$/.test(event.key)) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const pad = document.querySelector(`.pad[data-key="${event.key}"]`);
  if (pad) hit(pad.dataset.voice);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopGroove();
});

// Elastic Slider: the tempo track stretches when you pull past its ends and springs back.
{
  const input = document.querySelector('#tempo');
  const output = document.querySelector('#tempo-value');
  const elastic = document.querySelector('#elastic');
  const track = elastic.querySelector('.elastic-track');
  const icons = elastic.querySelectorAll('.elastic-icon');
  const setTempo = () => {
    tempo = Number(input.value);
    stepLength = 60 / tempo / 4;
    const share = (tempo - Number(input.min)) / (Number(input.max) - Number(input.min));
    input.style.setProperty('--fill', `${(share * 100).toFixed(1)}%`);
    output.textContent = `${tempo} BPM`;
    input.setAttribute('aria-valuetext', `${tempo} Schläge pro Minute`);
    document.documentElement.style.setProperty('--beat', `${(60 / tempo).toFixed(3)}s`);
    if (schedulerTimer && !video.paused) video.playbackRate = tempo / baseTempo;
  };
  input.addEventListener('input', setTempo);
  setTempo();

  let stretching = false;
  let rect;
  input.addEventListener('pointerdown', () => {
    stretching = true;
    rect = track.getBoundingClientRect();
    track.classList.add('dragging');
  });
  window.addEventListener('pointermove', event => {
    if (!stretching || !motionOK()) return;
    const overLeft = rect.left - event.clientX;
    const overRight = event.clientX - rect.right;
    const over = Math.max(overLeft, overRight, 0);
    const stretch = 1 + Math.min(over, 140) / 500;
    track.style.transformOrigin = overLeft > 0 ? 'right center' : 'left center';
    track.style.transform = over ? `scaleX(${stretch.toFixed(3)})` : '';
    icons[0].style.transform = overLeft > 0 ? `translateX(${(-Math.min(overLeft, 140) / 6).toFixed(1)}px) scale(1.3)` : '';
    icons[1].style.transform = overRight > 0 ? `translateX(${(Math.min(overRight, 140) / 6).toFixed(1)}px) scale(1.3)` : '';
  });
  const release = () => {
    if (!stretching) return;
    stretching = false;
    track.classList.remove('dragging');
    track.style.transform = '';
    icons.forEach(icon => { icon.style.transform = ''; });
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
}

/* ---------- Stack: drag the top picture away to see the next one ---------- */

{
  const stack = document.querySelector('#stack');
  const nextButton = document.querySelector('#stack-next');
  const tilts = [-7, 5, -2];
  let cards = [...stack.querySelectorAll('.stack-card')];

  const layout = () => {
    cards.forEach((card, index) => {
      card.style.zIndex = index + 1;
      card.style.setProperty('--r', `${tilts[index % tilts.length]}deg`);
      card.style.setProperty('--x', '0px');
      card.style.setProperty('--y', '0px');
      card.style.setProperty('--drag-r', '0deg');
      card.classList.toggle('top', index === cards.length - 1);
    });
  };
  const sendToBack = () => {
    cards = [cards.pop(), ...cards];
    layout();
  };
  layout();
  nextButton.addEventListener('click', sendToBack);

  let drag = null;
  stack.addEventListener('pointerdown', event => {
    const card = event.target.closest('.stack-card.top');
    if (!card || event.button !== 0) return;
    drag = { card, startX: event.clientX, startY: event.clientY, moved: false };
    card.setPointerCapture(event.pointerId);
    card.classList.add('dragging');
  });
  stack.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    drag.card.style.setProperty('--x', `${dx}px`);
    drag.card.style.setProperty('--y', `${dy}px`);
    drag.card.style.setProperty('--drag-r', `${clamp(dx / 12, -18, 18)}deg`);
  });
  const release = event => {
    if (!drag) return;
    const { card, moved } = drag;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    card.classList.remove('dragging');
    drag = null;
    if (!moved || distance > 110) sendToBack();
    else layout();
  };
  stack.addEventListener('pointerup', release);
  stack.addEventListener('pointercancel', release);
}

/* ---------- Share flyer ---------- */

function downloadFlyer() {
  const link = document.createElement('a');
  link.href = '/assets/supergroove-flyer.jpg';
  link.download = 'SUPERGROOVE-2.0-Flyer.jpg';
  document.body.append(link);
  link.click();
  link.remove();
}
document.querySelector('#share-flyer').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    if (navigator.share && navigator.canShare) {
      const response = await fetch('/assets/supergroove-flyer.jpg');
      if (!response.ok) throw new Error('Flyer unavailable');
      const file = new File([await response.blob()], 'SUPERGROOVE-2.0-Flyer.jpg', { type: 'image/jpeg' });
      const data = {
        files: [file], title: 'SUPERGROOVE 2.0 · Ronald Reloaded',
        text: '03.04.2027 · Festa de Samba · Workshop mit Toby von Badaue Paris. Mehr Groove. Mehr Bum. Mehr Herz!'
      };
      if (navigator.canShare({ files: [file] })) {
        await navigator.share(data);
        return;
      }
    }
    downloadFlyer();
    notify('Flyer heruntergeladen. Jetzt kannst du ihn weiterschicken.');
  } catch (error) {
    if (error.name !== 'AbortError') {
      downloadFlyer();
      notify('Teilen nicht verfügbar. Der Flyer wird als Bild heruntergeladen.');
    }
  } finally {
    button.disabled = false;
  }
});
