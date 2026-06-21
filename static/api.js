// api.js — Fetches content from the backend. Falls back to SEED on failure.

import { API_BASE, SEED } from "./config.js";
import { setState } from "./state.js";

export async function loadData() {
  const bar = document.getElementById("loading-bar");
  if (bar) bar.style.width = "40%";

  try {
    const res = await fetch(`${API_BASE}/`);
    if (bar) bar.style.width = "80%";

    const data = await res.json();
    setState(data && Object.keys(data).length ? data : SEED);
  } catch {
    setState(SEED);
  }
}
