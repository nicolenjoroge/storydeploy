// hero.js — Renders the hero section: glass metric cards + sub-text.
//
// Event handling: clicks on the ideas card and REA links use
// addEventListener on the rendered elements directly after innerHTML is set,
// so no globals or inline onclick attributes are needed.

import { section } from "./state.js";
import { esc, splitMetricValue } from "./formatters.js";

export function renderHero() {
  const s2 = section("section_2");

  // Sub-headline text
  const sub = document.getElementById("hero-sub-text");
  if (sub) sub.textContent = s2.description?.[0] || "";

  const metricsEl = document.getElementById("hero-metrics");
  if (!metricsEl) return;

  const { metrics = {} } = s2;

  metricsEl.innerHTML = buildHeroDashboard(metrics);

  // Wire up click events after the HTML is in the DOM
  document.getElementById("hero-ideas-card")?.addEventListener("click", () => {
    window.location.href = "/ideas-journey";
  });


  document.querySelectorAll("[data-hero-link]").forEach((el) => {
    el.addEventListener("click", () => {
      window.location.href = el.dataset.heroLink;
    });
  });
}

// ── Private helpers ───────────────────────────────────────────────────────────

function buildHeroDashboard(metrics) {
  const ideasHtml  = buildIdeasCard(metrics.ideas_submitted);
  const deployedHtml = buildDeployedCard(metrics.deployed_initiatives);
  const smallRowHtml = buildSmallRow(metrics);

  return `
    ${ideasHtml}
    ${deployedHtml}
    ${smallRowHtml}
  `;
}

function buildIdeasCard(value) {
  const { prefix, target, suffix } = splitMetricValue("ideas_submitted", value ?? 0);
  return `
    <div class="glass-card card-ideas" role="listitem" tabindex="0"
         aria-label="Ideas submitted: ${value ?? 0}" id="hero-ideas-card">
      <div class="glass-card-icon" aria-hidden="true">💡</div>
      <div class="glass-card-tap" aria-hidden="true">↗</div>
      <div class="glass-card-val">
        ${prefix}<span class="counter" data-target="${target}" data-suffix="${suffix}">0</span>${suffix}
      </div>
      <div class="glass-card-label">Ideas Submitted</div>
    </div>`;
}

function buildDeployedCard(value) {
  if (value == null) return "";
  const { prefix, target, suffix } = splitMetricValue("deployed_initiatives", value);
  return `
    <div class="glass-card card-deployed" role="listitem" tabindex="0"
         aria-label="Deployed initiatives: ${value}"
         data-hero-link="deployed.html">
      <div class="glass-card-icon" aria-hidden="true">🚀</div>
      <div class="glass-card-tap" aria-hidden="true">↗</div>
      <div class="glass-card-val">
        ${prefix}<span class="counter" data-target="${target}" data-suffix="${suffix}">0</span>${suffix}
      </div>
      <div class="glass-card-label" style="font-size:10.5px">Deployed</div>
    </div>`;
}

function buildSmallRow(metrics) {
  const costHtml  = buildSmallCard("current_cost_savings",  metrics.cost_savings_identified_kes,  "💰", "Expected Cost Saved",  "/cost-savings");
  const hoursHtml = buildSmallCard("current_man_hours_saved", metrics.man_hours_saved, "⏱️", "Expected Hrs Saved", "/man-hours");

  if (!costHtml && !hoursHtml) return "";
  return `<div class="hero-dashboard-small-row">${costHtml}${hoursHtml}</div>`;
}

function buildSmallCard(key, value, icon, label, link) {
  if (value == null) return "";
  const { prefix, target, suffix } = splitMetricValue(key, value);
  return `
    <div class="glass-card card-small card-${key.includes("cost") ? "cost" : "hours"}"
         role="listitem" tabindex="0"
         aria-label="${label}: ${value}"
         data-hero-link="${esc(link)}">
      <div class="glass-card-icon" aria-hidden="true">${icon}</div>
      <div class="glass-card-tap" aria-hidden="true">↗</div>
      <div class="glass-card-val">
        ${prefix}<span class="counter" data-target="${target}" data-suffix="${suffix}">0</span>${suffix}
      </div>
      <div class="glass-card-label">${label}</div>
    </div>`;
}
