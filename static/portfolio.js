// portfolio.js — Innovation Portfolio section.
//
// "Innovations That Shaped Us" — viewport-clipped image carousel with
//   slide-up drawers. Replaces the old scrollable .init-card track.
// "Innovations In Action" — sticky stacked scroll slider (unchanged).
// Closing blockquote — pulled from section_3.closing.
//
// HTML expectations:
//   #gallery-track-outer  — clipping wrapper (replaces old gallery-track-outer)
//   #gallery-track        — the moving strip (position:absolute, CSS transform)
//   #gallery-prev / #gallery-next — nav buttons below the viewport
//   #rea-ideas-grid       — REA in-action slider track
//   #rea-slider-nav       — dot nav for the slider
//   #portfolio-closing    — closing blockquote
//   #modal-backdrop etc.  — modal (wired in modal.js)
//
// Event handling: delegated listeners on #gallery-track-outer and #gallery-track.
// No inline onclick anywhere.

import { section } from "./state.js";
import {
  esc, formatBenefitValue, benefitLabel,
  badgeClass, typeIcon, cardBg, typeAccent, formatBenefit,
} from "./formatters.js";
import { openModal } from "./modal.js";

// ── Carousel internal state ───────────────────────────────────────────────────

let _currentList  = [];
let _galleryIndex = 0;
let _autoTimer    = null;
let _autoPaused   = false;

const CARD_STEP = 500; // card width (480) + gap (20)

// ── Public: render ────────────────────────────────────────────────────────────

export function renderGallery(filter) {
  const track = document.getElementById("gallery-track");
  if (!track) return;

  const all = section("section_3").initiatives || [];

  // Only show initiatives that are NOT tagged "in_action" (those go in the slider)
  const shaped = all.filter((i) => (i.category || "") !== "in_action");
  _currentList  = filter === "all"
    ? shaped
    : shaped.filter((i) => i.solution_type === filter);

  track.innerHTML = _currentList.length
    ? _currentList.map((item, idx) => buildCard(item, idx)).join("")
    : `<div class="empty-state">No initiatives found for this filter.</div>`;

  _galleryIndex = 0;
  _slide(0);
}

export function renderReaInAction() {
  const track = document.getElementById("rea-ideas-grid");
  if (!track) return;

  const items = (section("section_3").initiatives || []).filter(
    (i) => i.category === "in_action",
  );

  track.innerHTML = items
    .map((item, idx) => buildReaCard(item, idx, items.length))
    .join("");

  initReaSlider();
}

export function renderPortfolioClosing() {
  const el = document.getElementById("portfolio-closing");
  if (el) el.textContent = section("section_3").closing || "";
}

// ── Public: event wiring ──────────────────────────────────────────────────────

/**
 * Delegated listener on the gallery track outer wrapper.
 * Handles drawer open/close and "View in detail" (modal) clicks.
 * Call once after DOM is ready.
 */
export function setupGalleryEvents() {
  const outer = document.getElementById("gallery-track-outer");
  const track = document.getElementById("gallery-track");
  if (!outer || !track) return;

  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const idx    = parseInt(btn.dataset.idx, 10);
    const action = btn.dataset.action;

    if (action === "open-drawer")  _openDrawer(idx);
    if (action === "close-drawer") _closeDrawer(idx);
    if (action === "open-modal") {
      const item = _currentList[idx];
      if (item) openModal(item);
    }
  });

  // Pause autoplay on hover
  outer.addEventListener("mouseenter", () => { _autoPaused = true; });
  outer.addEventListener("mouseleave", () => {
    if (!track.querySelector(".init-card.unrolled")) _autoPaused = false;
  });
}

/**
 * Wires prev/next buttons and starts autoplay.
 * Call once after DOM is ready.
 */
export function setupGalleryCarousel() {
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");

  if (prevBtn) prevBtn.addEventListener("click", () => { _galleryPrev(); _restartAutoplay(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { _galleryNext(); _restartAutoplay(); });

  window.addEventListener("resize", () => _slide(_galleryIndex));
  _startAutoplay();
}

// ── Card builders ─────────────────────────────────────────────────────────────

function buildCard(item, idx) {
  const mediaHtml = item.image
    ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy"/>`
    : `<div class="init-card-media-placeholder"
            style="background:${cardBg(item.solution_type)}"
            aria-hidden="true">${typeIcon(item.solution_type)}</div>`;

  const benefits = (item.tangible_benefits || []).filter((b) => Number(b.value) > 0);
  const benefitsHtml = benefits.length
    ? benefits.map((b) => `
        <span class="benefit-chip">
          <strong>${esc(formatBenefitValue(b))}</strong>${esc(benefitLabel(b))}
        </span>`).join("")
    : `<span class="benefit-chip"
            style="color:rgba(57,48,45,.45);background:var(--off-white);border-color:var(--border)">
         Impact being tracked
       </span>`;

  return `
    <article class="init-card"
             id="gallery-card-${idx}"
             style="--item-accent:${typeAccent(item.solution_type)}"
             aria-label="${esc(item.name)}">

      <span class="badge ${badgeClass(item.solution_type)} init-card-badge">
        ${esc(item.solution_type)}
      </span>

      <div class="init-card-frame" data-action="open-drawer" data-idx="${idx}">
        ${mediaHtml}
        <div class="init-card-title-overlay">
          <h3 class="init-card-title">${esc(item.name)}</h3>
        </div>
      </div>

      <div class="init-card-drawer">
        <div class="init-card-drawer-scroll">
          <h3 class="init-card-drawer-title">${esc(item.name)}</h3>
          <div class="init-card-drawer-segment">
            <strong>${esc(item.business_area)}</strong>
            ${esc(item.description)}
          </div>
          <div class="init-card-drawer-benefits">${benefitsHtml}</div>
        </div>
        <button class="init-card-drawer-close"
                data-action="close-drawer"
                data-idx="${idx}">
          ✕ Return to image
        </button>
      </div>
    </article>`;
}

function buildReaCard(item, idx, total) {
  const benefits = (item.tangible_benefits || []).filter((b) => b.value);
  return `
    <article class="rea-idea-card" aria-label="${esc(item.name)}">
      <div class="rea-idea-media">
        ${item.image
          ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">`
          : `<div class="rea-idea-media-fallback" aria-hidden="true">
               ${esc(item.solution_type || "")}
             </div>`}
      </div>
      <div class="rea-idea-content">
        <div class="rea-idea-index">
          ${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}
        </div>
        <div class="rea-idea-badges">
          <span class="badge ${badgeClass(item.solution_type)}">${esc(item.solution_type)}</span>
          ${item.business_area ? `<span class="badge">${esc(item.business_area)}</span>` : ""}
        </div>
        <h3 class="rea-idea-name">${esc(item.name)}</h3>
        <div class="rea-idea-row-text">${esc(item.description)}</div>
        ${benefits.length
          ? `<div class="rea-idea-impact">
               💰 ${benefits.map((b) => esc(formatBenefit(b))).join(" · ")}
             </div>`
          : ""}
      </div>
    </article>`;
}

// ── Drawer open / close ───────────────────────────────────────────────────────

function _openDrawer(idx) {
  _autoPaused = true;
  document.getElementById(`gallery-card-${idx}`)?.classList.add("unrolled");
}

function _closeDrawer(idx) {
  const card = document.getElementById(`gallery-card-${idx}`);
  if (!card) return;
  setTimeout(() => {
    card.classList.remove("unrolled");
    const track = document.getElementById("gallery-track");
    if (track && !track.querySelector(".init-card.unrolled")) _autoPaused = false;
  }, 50);
}

// ── Carousel engine ───────────────────────────────────────────────────────────

function _slide(targetIdx) {
  const track = document.getElementById("gallery-track");
  if (!track) return;
  track.querySelectorAll(".init-card.unrolled").forEach((c) => c.classList.remove("unrolled"));
  _galleryIndex = targetIdx;
  track.style.transform = `translateX(-${_galleryIndex * CARD_STEP}px)`;
}

function _maxIndex() {
  const outer = document.getElementById("gallery-track-outer");
  if (!outer) return 0;
  const inView = Math.max(1, Math.floor(outer.offsetWidth / CARD_STEP));
  return Math.max(0, _currentList.length - inView);
}

function _galleryNext() {
  const next = _galleryIndex + 1;
  _slide(next > _maxIndex() ? 0 : next);
}

function _galleryPrev() {
  const prev = _galleryIndex - 1;
  _slide(prev < 0 ? _maxIndex() : prev);
}

function _startAutoplay() {
  if (_autoTimer) clearInterval(_autoTimer);
  _autoTimer = setInterval(() => { if (!_autoPaused) _galleryNext(); }, 4500);
}

function _restartAutoplay() { _startAutoplay(); }

// ── REA in-action slider ──────────────────────────────────────────────────────

function initReaSlider() {
  const track = document.getElementById("rea-ideas-grid");
  const nav   = document.getElementById("rea-slider-nav");
  if (!track || !nav) return;

  const cards = [...track.querySelectorAll(".rea-idea-card")];
  cards.forEach((card, i) => card.style.setProperty("--stack-i", i));

  nav.innerHTML = cards
    .map((_, i) => `<button class="rea-slider-dot" data-index="${i}" aria-label="Go to item ${i + 1}"></button>`)
    .join("");

  const dots = [...nav.querySelectorAll(".rea-slider-dot")];
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () =>
      cards[i].scrollIntoView({ behavior: "smooth", block: "start" }),
    ),
  );

  let ticking = false;
  function updateStack() {
    const trackRect = track.getBoundingClientRect();
    let activeIndex = 0;

    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const next = cards[i + 1];
      let progress = 0;
      if (next) {
        const nr = next.getBoundingClientRect();
        progress = Math.min(1, Math.max(0, (rect.top + rect.height - nr.top) / rect.height));
      }
      card.style.setProperty("--depth-scale", (1 - progress * 0.06).toFixed(3));
      card.style.setProperty("--depth-y", `${(-progress * 18).toFixed(1)}px`);
      card.classList.toggle("is-stacked", progress > 0.05);
      if (rect.top - trackRect.top <= 44) activeIndex = i;
    });

    cards.forEach((c, i) => c.classList.toggle("is-active", i === activeIndex));
    dots.forEach((d, i)  => d.classList.toggle("is-active", i === activeIndex));
    ticking = false;
  }

  track.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(updateStack); ticking = true; }
  });
  updateStack();
}
