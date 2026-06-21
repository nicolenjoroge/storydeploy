// testimonials.js — Static testimonial deck carousel.
//
// The cards are authored directly in HTML (static content, not from the API).
// This module reads them from the DOM and wires up the up/down navigation,
// dot indicators, and the CSS variable accent colour that drives the glow
// and eyebrow text.
//
// Event handling: addEventListener on the up/down buttons and dots.
// No inline onclick. No globals.

export function setupTestimonials() {
  const cards   = document.querySelectorAll("#testimonials .floating-card");
  const eyebrow = document.getElementById("testimonials-eyebrow");
  const glow    = document.getElementById("testimonials-glow");
  const dotsWrap = document.getElementById("testimonials-dots");
  const upBtn   = document.getElementById("testimonials-up");
  const downBtn = document.getElementById("testimonials-down");

  if (!cards.length || !upBtn || !downBtn) return;

  let activeIdx = 0;

  // Build dot indicators to match the number of cards
  dotsWrap.innerHTML = Array.from(cards)
    .map((_, i) => `<span class="testimonials-dot" data-idx="${i}"></span>`)
    .join("");

  const dots = dotsWrap.querySelectorAll(".testimonials-dot");

  function goTo(idx) {
    // Remove all position classes
    cards.forEach((c) => c.classList.remove("active", "prev-stacked", "next-stacked"));

    activeIdx = idx;
    const card   = cards[activeIdx];
    const total  = cards.length;
    const prevIdx = (activeIdx - 1 + total) % total;
    const nextIdx = (activeIdx + 1) % total;

    card.classList.add("active");
    cards[prevIdx].classList.add("prev-stacked");
    cards[nextIdx].classList.add("next-stacked");

    // Update accent colour from the card's data attribute
    const color  = card.dataset.color  || "var(--sky)";
    const stream = card.dataset.stream || "";
    document.documentElement.style.setProperty("--active-accent", color);
    if (glow)    glow.style.background    = color;
    if (eyebrow) eyebrow.textContent      = stream;

    // Sync dots
    dots.forEach((d, i) => d.classList.toggle("active", i === activeIdx));
  }

  // Navigation buttons
  downBtn.addEventListener("click", () =>
    goTo((activeIdx + 1) % cards.length),
  );
  upBtn.addEventListener("click", () =>
    goTo((activeIdx - 1 + cards.length) % cards.length),
  );

  // Dot clicks
  dots.forEach((dot) =>
    dot.addEventListener("click", () => goTo(parseInt(dot.dataset.idx, 10))),
  );

  // Initialise to first card
  goTo(0);
}
