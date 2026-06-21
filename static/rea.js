// rea.js — Renders the REA Background section: narrative text + metric cards.

import { section } from "./state.js";
import { esc, splitMetricValue, humanizeKey } from "./formatters.js";
import { METRIC_ICONS } from "./config.js";

export function renderRea() {
  const s2 = section("section_2");

  document.getElementById("rea-desc-text").innerHTML = (s2.description || [])
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");

  document.getElementById("rea-closing").textContent = s2.closing || "";

  renderReaMetrics(s2.metrics || {});
}

function renderReaMetrics(metrics) {
  const col = document.getElementById("rea-metrics-col");
  if (!col) return;

  // Only show metrics that have a value
  const entries = [
    ["ideas_in_pipeline",       metrics.ideas_in_pipeline],
    ["deployed_initiatives",    metrics.deployed_initiatives],
    ["current_cost_savings",    metrics.current_cost_savings],
    ["current_man_hours_saved", metrics.current_man_hours_saved],
  ].filter(([, v]) => v != null);

  col.innerHTML = entries
    .map(([key, value], i) => {
      const { prefix, target, suffix } = splitMetricValue(key, value);
      const icon = METRIC_ICONS[i % METRIC_ICONS.length];
      return `
        <div class="rea-metric-card reveal reveal-delay-${Math.min(i + 1, 4)}">
          <div class="rea-metric-icon" aria-hidden="true">${icon}</div>
          <div class="rea-metric-data">
            <div class="rea-metric-num">
              ${prefix}<span class="counter" data-target="${target}" data-suffix="${suffix}">0</span>${suffix}
            </div>
            <div class="rea-metric-desc">${esc(humanizeKey(key))}</div>
          </div>
        </div>`;
    })
    .join("");
}
