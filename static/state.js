// state.js — Single source of truth for all fetched content.
//
// Components call section() to read data. Nothing writes to STATE
// except api.js after a successful fetch.

import { SEED } from "./config.js";

let STATE = {};

export function setState(data) {
  STATE = data;
}

/**
 * Returns a top-level section (e.g. "section_2"), falling back to SEED
 * if the section is missing from the fetched data.
 */
export function section(key) {
  return STATE[key] || SEED[key];
}
