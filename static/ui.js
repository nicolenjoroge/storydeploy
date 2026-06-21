// ui.js — Reusable DOM utilities: counter animation, scroll reveal,
//          filter bar, hamburger menu, active nav highlight.
//
// setupDragScroll() has been removed — the new gallery uses CSS transform
// auto-slide instead of a scrollable container.

/**
 * Animates all .counter elements inside `root` that haven't been counted yet.
 * Reads data-target (number) from the element.
 */
export function animateCounters(root) {
  root.querySelectorAll(".counter:not(.counted)").forEach((el) => {
    el.classList.add("counted");
    const target   = parseFloat(el.dataset.target);
    const isFloat  = !Number.isInteger(target);
    const duration = 1600;
    const start    = performance.now();

    function step(now) {
      const pct  = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      const val  = target * ease;
      el.textContent = isFloat
        ? val.toFixed(2)
        : Math.round(val).toLocaleString();
      if (pct < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

/**
 * Adds `.visible` to `.reveal` elements as they scroll into view,
 * and triggers counter animation on their parent.
 */
export function observeReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          animateCounters(e.target.parentElement || e.target);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".reveal:not(.visible)").forEach((el) => io.observe(el));
}

/**
 * Highlights the nav link matching the currently visible section.
 */
export function setupActiveNav() {
  const sections = ["hero", "rea", "portfolio", "hof", "testimonials", "dyk"];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        document.querySelectorAll(".nav-link, .nav-mobile-link").forEach((l) => {
          l.classList.toggle(
            "active",
            l.dataset.section === id || l.getAttribute("href") === `#${id}`,
          );
        });
      });
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}

/**
 * Wires the filter buttons in the portfolio header.
 * Calls `onFilterChange(filterValue)` when a button is clicked.
 */
export function setupFilters(onFilterChange) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onFilterChange(btn.dataset.filter);
    });
  });
}

/**
 * Wires up the mobile hamburger toggle.
 */
export function setupHamburger() {
  const btn  = document.getElementById("hamburger-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    btn.textContent = open ? "✕" : "☰";
  });

  document.querySelectorAll(".nav-mobile-link").forEach((l) =>
    l.addEventListener("click", () => {
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = "☰";
    }),
  );
}
