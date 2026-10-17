'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let toastTimer;

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}

/* ---------- Video ---------- */

const video = document.querySelector('#ronald-video');
const playButton = document.querySelector('#video-toggle');
const playLabel = document.querySelector('#play-label');
const playIcon = document.querySelector('#play-icon');
const soundButton = document.querySelector('#sound-toggle');
const soundLabel = document.querySelector('#sound-label');
let pausedByUser = false;
let pausedOffscreen = false;

function updatePlayback() {
  const playing = !video.paused;
  playLabel.textContent = playing ? 'PAUSE' : 'ANIMATION AN';
  playButton.setAttribute('aria-label', playing ? 'Animation pausieren' : 'Animation starten');
  playButton.setAttribute('aria-pressed', String(playing));
  playIcon.innerHTML = playing ? '<path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="3"/>' : '<path d="m9 5 11 7-11 7z"/>';
}

async function startVideo(userInitiated = false) {
  try {
    await video.play();
  } catch {
    if (userInitiated) notify('Die Animation konnte nicht starten. Bitte versuch es noch einmal.');
    updatePlayback();
  }
}

playButton.addEventListener('click', () => {
  if (video.paused) {
    pausedByUser = false;
    pausedOffscreen = false;
    void startVideo(true);
  } else {
    pausedByUser = true;
    video.pause();
  }
});
video.addEventListener('play', updatePlayback);
video.addEventListener('pause', updatePlayback);

function updateSound() {
  const audible = !video.muted;
  soundLabel.textContent = audible ? 'TON AUS' : 'TON AN';
  soundButton.setAttribute('aria-label', audible ? 'Ton ausschalten' : 'Ton einschalten');
  soundButton.setAttribute('aria-pressed', String(audible));
  soundButton.querySelector('svg').innerHTML = audible
    ? '<path d="M11 5 6 9H3v6h3l5 4zM16 8c3 2 3 6 0 8M19 5c5 4 5 10 0 14"/>'
    : '<path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/>';
}
soundButton.addEventListener('click', () => {
  video.muted = !video.muted;
  updateSound();
  if (!video.muted) stopGroove();
  if (!video.muted && video.paused) {
    pausedByUser = false;
    pausedOffscreen = false;
    void startVideo(true);
  }
});
video.addEventListener('volumechange', updateSound);
video.addEventListener('error', () => notify('Das Video ist gerade nicht verfügbar. Der Flyer bleibt als Bild sichtbar.'));

// Respect reduced motion on first load and whenever the preference changes.
if (!reducedMotion.matches) void startVideo();

// Pause video and sound outside the viewport; retain explicit pause choices.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    if (!visible && !video.paused) {
      pausedOffscreen = true;
      video.pause();
    } else if (visible && pausedOffscreen && !pausedByUser && !reducedMotion.matches && !document.hidden) {
      pausedOffscreen = false;
      void startVideo();
    }
  }, { threshold: 0.1 });
  observer.observe(video);
}

/* ---------- Motion: confetti, SVG animations, reveals, header ---------- */

const svgScenes = [document.querySelector('#brasil-scene'), document.querySelector('.route')];

function applyMotionPreference() {
  for (const scene of svgScenes) {
    if (!scene || !scene.pauseAnimations) continue;
    if (reducedMotion.matches) scene.pauseAnimations();
    else scene.unpauseAnimations();
  }
}
applyMotionPreference();
reducedMotion.addEventListener('change', () => {
  applyMotionPreference();
  if (reducedMotion.matches) video.pause();
});

const confetti = document.querySelector('#confetti');
const confettiColors = ['#ffd60a', '#ff2e88', '#3a74ff', '#fff7e6', '#46ff9a', '#ff8c1a'];
for (let index = 0; index < 34; index++) {
  const piece = document.createElement('i');
  const size = 6 + Math.random() * 9;
  const round = Math.random() < 0.35;
  piece.style.cssText = [
    `--x:${(Math.random() * 100).toFixed(1)}%`,
    `--w:${size.toFixed(1)}px`,
    `--h:${(round ? size : size * 0.45).toFixed(1)}px`,
    `--r:${round ? '50%' : '2px'}`,
    `--c:${confettiColors[index % confettiColors.length]}`,
    `--d:${(9 + Math.random() * 9).toFixed(1)}s`,
    `--delay:${(-Math.random() * 18).toFixed(1)}s`,
    `--sway:${(Math.random() * 160 - 80).toFixed(0)}px`,
    `--rot:${(Math.random() * 900 - 450).toFixed(0)}deg`
  ].join(';');
  confetti.append(piece);
}

// Split the statement into words so they can light up one after another.
const statement = document.querySelector('[data-words]');
let wordIndex = 0;
function splitWords(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(part);
        } else {
          const word = document.createElement('span');
          word.className = 'word';
          word.style.setProperty('--w', wordIndex++);
          word.textContent = part;
          fragment.append(word);
        }
      }
      child.replaceWith(fragment);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      splitWords(child);
    }
  }
}
splitWords(statement);

const revealTargets = [...document.querySelectorAll('[data-reveal]'), statement];
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

const header = document.querySelector('.site-header');
const navLinks = [...document.querySelectorAll('.main-nav a')];
function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 40);
}
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

/* ---------- Countdown (3 April 2027, 00:00 in Berlin = 22:00 UTC the day before) ---------- */

const eventStart = Date.UTC(2027, 3, 2, 22);
const eventEnd = Date.UTC(2027, 3, 3, 22);
const countdownParts = {
  days: document.querySelector('#cd-days'),
  hours: document.querySelector('#cd-hours'),
  minutes: document.querySelector('#cd-minutes'),
  seconds: document.querySelector('#cd-seconds')
};
const countdownStatus = document.querySelector('#countdown-status');
let countdownTimer;

function tick() {
  const now = Date.now();
  const remaining = Math.max(0, eventStart - now);
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor(remaining / 3600000) % 24,
    minutes: Math.floor(remaining / 60000) % 60,
    seconds: Math.floor(remaining / 1000) % 60
  };
  for (const [key, element] of Object.entries(countdownParts)) {
    element.textContent = key === 'days' ? String(values[key]) : String(values[key]).padStart(2, '0');
  }
  if (now >= eventEnd) countdownStatus.textContent = 'Danke für den Groove!';
  else if (now >= eventStart) countdownStatus.textContent = 'Heute ist es so weit!';
  else countdownStatus.textContent = remaining <= 86400000 ? 'Morgen geht’s los!' : 'bis zum 3. April 2027';
  if (remaining === 0) clearInterval(countdownTimer);
}
tick();
countdownTimer = setInterval(tick, 1000);

/* ---------- Batucada: tiny samba drum machine with Web Audio ---------- */

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
const tempo = 104;
const stepLength = 60 / tempo / 4;
document.documentElement.style.setProperty('--beat', `${(60 / tempo).toFixed(3)}s`);

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
let frame;

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

function draw() {
  while (queue.length && queue[0].time <= audio.currentTime) {
    const { step } = queue.shift();
    stepLights.forEach((light, index) => light.classList.toggle('on', index === step));
    if (pattern.surdo[step]) flash('surdo');
    if (pattern.tamborim[step]) flash('tamborim');
    if (step in pattern.agogo) flash('agogo');
    if (pattern.caixa[step] >= 0.7) flash('caixa');
  }
  frame = requestAnimationFrame(draw);
}

function startGroove() {
  if (!ensureAudio()) return;
  if (!video.muted) {
    video.muted = true;
    updateSound();
  }
  currentStep = 0;
  queue = [];
  nextStepTime = audio.currentTime + 0.08;
  scheduler();
  schedulerTimer = setInterval(scheduler, 25);
  frame = requestAnimationFrame(draw);
  document.body.classList.add('grooving');
  grooveButton.setAttribute('aria-pressed', 'true');
  grooveLabel.textContent = 'BATERIA STOPPEN';
  grooveIcon.innerHTML = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
}

function stopGroove() {
  if (!schedulerTimer) return;
  clearInterval(schedulerTimer);
  schedulerTimer = null;
  cancelAnimationFrame(frame);
  stepLights.forEach(light => light.classList.remove('on'));
  document.body.classList.remove('grooving');
  grooveButton.setAttribute('aria-pressed', 'false');
  grooveLabel.textContent = 'BATERIA STARTEN';
  grooveIcon.innerHTML = '<path d="m9 5 11 7-11 7z"/>';
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
  if (!document.hidden) return;
  video.pause();
  stopGroove();
});

/* ---------- Share flyer ---------- */

function downloadFlyer() {
  const link = document.createElement('a');
  link.href = 'assets/supergroove-flyer.jpg';
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
      const response = await fetch('assets/supergroove-flyer.jpg');
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
