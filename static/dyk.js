// dyk.js — Renders the Did You Know section.

import { section } from "./state.js";
import { esc } from "./formatters.js";

export function renderDyk() {
  const grid  = document.getElementById("dyk-grid");
  const items = section("section_5").items || [];

  grid.innerHTML = items.map((item, idx) => buildDykItem(item, idx)).join("");
}

function buildDykItem(item, idx) {
  const benefits = (item.benefits || [])
    .map((b) => `<div class="dyk-benefit">${esc(b)}</div>`)
    .join("");

  return `
    <article class="dyk-item" aria-label="${esc(item.name)}">
      <div class="dyk-num" aria-hidden="true">${String(idx + 1).padStart(2, "0")}</div>
      <h3 class="dyk-title">${esc(item.name)}</h3>
      <p class="dyk-desc">${esc(item.description)}</p>
      ${benefits ? `<div class="dyk-benefits" aria-label="Benefits">${benefits}</div>` : ""}
    </article>`;
}
