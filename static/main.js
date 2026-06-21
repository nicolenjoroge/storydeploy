// main.js — Boot sequence.

import { loadData }   from "./api.js";
import { renderHero } from "./hero.js";
import { renderRea }  from "./rea.js";
import {
  renderGallery,
  renderReaInAction,
  renderPortfolioClosing,
  setupGalleryEvents,
  setupGalleryCarousel,
} from "./portfolio.js";
import { renderHof }         from "./hof.js";
import { renderDyk }         from "./dyk.js";
import { setupModal }        from "./modal.js";
import { setupTestimonials } from "./testimonials.js";
import {
  observeReveal,
  setupActiveNav,
  setupFilters,
  setupHamburger,
} from "./ui.js";

async function boot() {
  const loadingEl   = document.getElementById("loading");
  const bar         = document.getElementById("loading-bar");
  const MIN_LOAD_MS = 3000;
  const start       = Date.now();

  if (bar) bar.style.width = "20%";
  await loadData();
  if (bar) bar.style.width = "95%";

  // Render data-driven sections
  renderHero();
  renderRea();
  renderGallery("all");
  renderReaInAction();
  renderPortfolioClosing();
  renderHof();
  renderDyk();

  // Wire interactivity
  setupModal();
  setupGalleryEvents();
  setupGalleryCarousel();
  setupFilters(renderGallery);
  setupTestimonials();   // reads static cards from DOM — safe no-op if section absent
  setupHamburger();
  setupActiveNav();
  observeReveal();

  if (bar) bar.style.width = "100%";
  const elapsed   = Date.now() - start;
  const remaining = MIN_LOAD_MS - elapsed;
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

  loadingEl?.classList.add("fade-out");
  setTimeout(() => loadingEl?.remove(), 500);
}

boot();
