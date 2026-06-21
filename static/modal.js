// modal.js — Initiative detail modal.
//
// openModal() is called by portfolio.js via event delegation on the gallery
// track — no inline onclick needed anywhere.

import { esc, formatBenefitValue, benefitLabel, badgeClass, cardBg, typeIcon } from "./formatters.js";

export function openModal(item) {
  setModalMedia(item);
  setModalMeta(item);
  setModalBody(item);

  document.getElementById("modal-backdrop").classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
  document.body.style.overflow = "";
}

export function setupModal() {
  document.getElementById("modal-close").addEventListener("click", closeModal);

  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-backdrop")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// ── Private helpers ───────────────────────────────────────────────────────────

function setModalMedia(item) {
  const mediaEl = document.getElementById("modal-media");

  // Remove any previously injected media nodes, leaving the meta overlay
  mediaEl.querySelectorAll("img, .modal-media-placeholder").forEach((n) => n.remove());

  if (item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name;
    mediaEl.prepend(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "modal-media-placeholder";
    ph.style.background = cardBg(item.solution_type);
    ph.textContent = typeIcon(item.solution_type);
    ph.setAttribute("aria-hidden", "true");
    mediaEl.prepend(ph);
  }
}

function setModalMeta(item) {
  document.getElementById("modal-media-meta").innerHTML = `
    <span class="badge ${badgeClass(item.solution_type)}">${esc(item.solution_type)}</span>
    <span class="modal-area-pill">${esc(item.business_area)}</span>`;
}

function setModalBody(item) {
  document.getElementById("modal-title").textContent = item.name;
  document.getElementById("modal-desc").textContent  = item.description || "";

  const benefits = (item.tangible_benefits || []).filter((b) => Number(b.value) > 0);
  const labelEl  = document.getElementById("modal-benefits-label");
  const benefitsEl = document.getElementById("modal-benefits");

  if (benefits.length) {
    labelEl.style.display = "block";
    benefitsEl.innerHTML = benefits
      .map(
        (b) => `
        <div class="modal-benefit-chip">
          <strong>${esc(formatBenefitValue(b))}</strong>
          <span>${esc(benefitLabel(b))}</span>
        </div>`,
      )
      .join("");
  } else {
    labelEl.style.display = "none";
    benefitsEl.innerHTML = "";
  }

  document.getElementById("modal-footer").innerHTML = `
    <span class="modal-footer-label">Business area</span>
    <span class="badge ${badgeClass(item.solution_type)}" style="font-size:11px">${esc(item.business_area)}</span>`;
}
