'use strict';

const video = document.querySelector('#ronald-video');
const playButton = document.querySelector('#video-toggle');
const playLabel = document.querySelector('#play-label');
const playIcon = document.querySelector('#play-icon');
const soundButton = document.querySelector('#sound-toggle');
const soundLabel = document.querySelector('#sound-label');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let pausedByUser = false;
let pausedOffscreen = false;
let toastTimer;

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}

function updatePlayback() {
  const playing = !video.paused;
  playLabel.textContent = playing ? 'PAUSE' : 'ANIMATION AN';
  playButton.setAttribute('aria-label', playing ? 'Animation pausieren' : 'Animation starten');
  playButton.setAttribute('aria-pressed', String(playing));
  playIcon.innerHTML = playing ? '<path d="M8 5v14M16 5v14"/>' : '<path d="m9 5 11 7-11 7z"/>';
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
reducedMotion.addEventListener('change', event => {
  if (event.matches) video.pause();
});

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
document.addEventListener('visibilitychange', () => {
  if (document.hidden) video.pause();
});

// Count calendar dates in Berlin, avoiding daylight-saving offsets.
const berlinDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date());
const datePart = type => Number(berlinDate.find(part => part.type === type).value);
const today = Date.UTC(datePart('year'), datePart('month') - 1, datePart('day'));
const days = Math.round((Date.UTC(2027, 3, 3) - today) / 86400000);
const countdown = document.querySelector('#countdown');
if (days > 0) countdown.textContent = `NOCH ${days} ${days === 1 ? 'TAG' : 'TAGE'}`;
else if (days === 0) countdown.textContent = 'HEUTE IST ES SO WEIT!';
else countdown.textContent = '03. APRIL 2027';

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
        text: '03.04.2027 · Festa de Samba · Workshop mit Toby „Tamandua“ Russell von Badauê Paris. Mehr Groove. Mehr Bum!'
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
