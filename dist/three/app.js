'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const video = document.querySelector('#ronald-video');
const videoToggle = document.querySelector('#video-toggle');
const playLabel = document.querySelector('#play-label');
const motionToggle = document.querySelector('#motion-toggle');
const motionLabel = document.querySelector('#motion-label');
const menuToggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#main-nav');
const dialog = document.querySelector('#trailer-dialog');
const trailer = document.querySelector('#full-trailer');
let motionPaused = reducedMotion.matches;
let videoVisible = false;
let userPausedVideo = false;
let toastTimer;
let trailerOpener;

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}
function updateVideoControls() {
  const playing = !video.paused;
  playLabel.textContent = playing ? 'Ⅱ Pause' : '▶ Animation';
  videoToggle.setAttribute('aria-label', playing ? 'Flyer-Animation pausieren' : 'Flyer-Animation starten');
  videoToggle.setAttribute('aria-pressed', String(playing));
}
async function startVideo(userInitiated = false) {
  try { await video.play(); }
  catch { if (userInitiated) notify('Die Animation konnte nicht starten. Bitte versuch es noch einmal.'); }
  updateVideoControls();
}
function syncVideo() {
  if (!motionPaused && videoVisible && !userPausedVideo && !document.hidden && !dialog.open) void startVideo();
  else video.pause();
}
function updateMotion() {
  document.documentElement.classList.toggle('motion-paused', motionPaused);
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  motionToggle.setAttribute('aria-label', motionPaused ? 'Animationen einschalten' : 'Animationen pausieren');
  motionLabel.textContent = motionPaused ? 'Bewegung aus' : 'Bewegung an';
  motionToggle.querySelector('.motion-icon').textContent = motionPaused ? '▶' : 'Ⅱ';
  syncVideo();
}
motionToggle.addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
reducedMotion.addEventListener('change', event => { motionPaused = event.matches; updateMotion(); });
updateMotion();
videoToggle.addEventListener('click', () => {
  if (video.paused) { userPausedVideo = false; void startVideo(true); }
  else { userPausedVideo = true; video.pause(); }
});
video.addEventListener('play', updateVideoControls);
video.addEventListener('pause', updateVideoControls);
video.addEventListener('error', () => notify('Das Video ist gerade nicht verfügbar. Der Flyer bleibt als Bild sichtbar.'));
document.addEventListener('visibilitychange', () => { if (document.hidden) trailer.pause(); syncVideo(); });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { videoVisible = entries[0].isIntersecting; syncVideo(); }, { threshold: .2 }).observe(video);
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); reveals.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => { element.classList.add('ready'); reveals.observe(element); });
}
function closeMenu() {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('span').textContent = '＋';
}
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.querySelector('span').textContent = open ? '−' : '＋';
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menuToggle.focus(); }
});
document.addEventListener('click', event => {
  if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);
document.querySelectorAll('.trailer-trigger').forEach(button => button.addEventListener('click', async () => {
  trailerOpener = button;
  if (!trailer.getAttribute('src')) trailer.src = trailer.dataset.src;
  video.pause();
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  try { await trailer.play(); } catch { /* Native controls remain available if playback is blocked. */ }
}));
document.querySelector('#close-trailer').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  trailer.pause();
  document.body.style.overflow = '';
  trailerOpener?.focus();
  syncVideo();
});
trailer.addEventListener('error', () => notify('Der Film konnte nicht geladen werden. Bitte versuch es erneut.'));
// Count Berlin calendar dates, independent of daylight-saving offsets.
function updateCountdown() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => Number(parts.find(value => value.type === type).value);
  const today = Date.UTC(part('year'), part('month') - 1, part('day'));
  const days = Math.round((Date.UTC(2027, 3, 3) - today) / 86400000);
  document.querySelector('#countdown').textContent = days > 0 ? `NOCH ${days} ${days === 1 ? 'TAG' : 'TAGE'} VORFREUDE` : days === 0 ? 'HEUTE IST UNSER TAG!' : '03. APRIL 2027';
}
updateCountdown();
setInterval(updateCountdown, 60000);
document.querySelector('#share-event').addEventListener('click', async event => {
  const button = event.currentTarget;
  const url = new URL('/three/', window.location.href).href;
  const data = { title: 'SUPERGROOVE 2027 · Ein Rhythmus. Viele Herzen.', text: 'Am 3. April 2027 wird zusammen gegroovt! Ronald Reloaded, Festa de Samba & Workshop mit Toby von Badaue Paris. Kommst du mit?', url };
  button.disabled = true;
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(`${data.text}\n${url}`); notify('Einladung kopiert. Jetzt kannst du die Freude weiterschicken.'); }
    else copyFallback(url);
  } catch (error) { if (error.name !== 'AbortError') copyFallback(url); }
  finally { button.disabled = false; }
});
function copyFallback(url) {
  const field = document.createElement('textarea');
  field.value = url;
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* Show the URL if clipboard APIs are unavailable. */ }
  field.remove();
  document.querySelector('#share-event').focus();
  notify(copied ? 'Link kopiert. Auf zu deinen Lieblingsmenschen!' : `Zum Weitergeben: ${url}`);
}
