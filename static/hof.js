// hof.js — Renders the Hall of Fame section.
//
// Video controls (play, pause, mute, fullscreen) use a single delegated
// listener on the hof-cards container. Each control button carries a
// data-action and data-idx attribute — no inline onclick needed.

import { section } from "./state.js";
import { esc } from "./formatters.js";
import { HOF_ACCENTS } from "./config.js";

export function renderHof() {
  const cards = document.getElementById("hof-cards");
  const innovations = section("section_4").innovations || [];

  cards.innerHTML = innovations.map((item, idx) => buildHofCard(item, idx)).join("");

  setupVideoEvents(cards);
  setupVideoScroll();
}

// ── Card builder ──────────────────────────────────────────────────────────────

function buildHofCard(item, idx) {
  const accent = HOF_ACCENTS[idx % HOF_ACCENTS.length];

  return `
    <article class="hof-card" style="border-color:${accent}33" aria-label="${esc(item.name)}">
      <div class="hof-video-wrap" data-idx="${idx}">
        ${buildHofMedia(item, idx)}
      </div>
      <div class="hof-card-body">
        <h3 class="hof-card-name">${esc(item.name)}</h3>
        <p class="hof-card-desc">${esc(item.description)}</p>
      </div>
    </article>`;
}

function buildHofMedia(item, idx) {
  if (item.video) {
    return `
      <video class="hof-video" id="hof-video-${idx}"
             src="${esc(item.video)}" muted playsinline loop preload="metadata"
             aria-label="${esc(item.name)} showcase video"></video>
      <div class="hof-video-overlay" id="hof-overlay-${idx}">
        <button class="hof-play-btn"
                data-action="play" data-idx="${idx}"
                aria-label="Play ${esc(item.name)} video">
          <div class="hof-play-icon" aria-hidden="true"></div>
        </button>
      </div>
      <div class="hof-video-controls">
        <button class="hof-control-btn" data-action="pause"      data-idx="${idx}" id="hof-pause-${idx}" aria-label="Pause video">⏸</button>
        <button class="hof-control-btn" data-action="mute"       data-idx="${idx}" id="hof-mute-${idx}"  aria-label="Mute video">🔇</button>
        <button class="hof-control-btn" data-action="fullscreen" data-idx="${idx}" aria-label="Fullscreen video">⛶</button>
      </div>`;
  }

  if (item.image) {
    return `<img class="hof-video" src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy"/>`;
  }

  return `
    <div class="hof-media-placeholder">
      <span class="icon" aria-hidden="true">🎬</span>
      <span>Media coming soon</span>
    </div>`;
}

// ── Event delegation for video controls ───────────────────────────────────────

function setupVideoEvents(container) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const idx    = btn.dataset.idx;
    const action = btn.dataset.action;

    switch (action) {
      case "play":       handlePlay(idx);       break;
      case "pause":      handleTogglePause(idx); break;
      case "mute":       handleToggleMute(idx);  break;
      case "fullscreen": handleFullscreen(idx);  break;
    }
  });
}

function handlePlay(idx) {
  document.getElementById(`hof-video-${idx}`)?.play();
  document.getElementById(`hof-overlay-${idx}`)?.classList.add("hidden");
}

function handleTogglePause(idx) {
  const video = document.getElementById(`hof-video-${idx}`);
  const btn   = document.getElementById(`hof-pause-${idx}`);
  if (!video) return;

  if (video.paused) {
    video.play();
    if (btn) { btn.textContent = "⏸"; btn.setAttribute("aria-label", "Pause video"); }
  } else {
    video.pause();
    if (btn) { btn.textContent = "▶"; btn.setAttribute("aria-label", "Play video"); }
  }
}

function handleToggleMute(idx) {
  const video = document.getElementById(`hof-video-${idx}`);
  const btn   = document.getElementById(`hof-mute-${idx}`);
  if (!video) return;

  video.muted = !video.muted;
  if (btn) {
    btn.textContent = video.muted ? "🔇" : "🔊";
    btn.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
  }
}

function handleFullscreen(idx) {
  const wrap = document.querySelector(`.hof-video-wrap[data-idx="${idx}"]`);
  if (!wrap) return;
  if (!document.fullscreenElement) wrap.requestFullscreen?.();
  else document.exitFullscreen?.();
}

// ── Auto-play on scroll ───────────────────────────────────────────────────────

function setupVideoScroll() {
  const videos = document.querySelectorAll('.hof-video[id^="hof-video-"]');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const idx   = video.id.replace("hof-video-", "");
        const overlay = document.getElementById(`hof-overlay-${idx}`);

        if (entry.isIntersecting) {
          video.play().catch(() => {});
          overlay?.classList.add("hidden");
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.4 },
  );

  videos.forEach((v) => io.observe(v));
}
