/**
 * Data-source switch (Phase 3 strangler).
 *
 * VITE_DATA_SOURCE=local  → existing localStorage behavior (default, unchanged)
 * VITE_DATA_SOURCE=api    → backend API via ./api.js (requires VITE_API_URL)
 *
 * Modules are rewired one by one: each adapter exposes the same state/action
 * shape as the local implementation, so components never change.
 */

// Vite injects import.meta.env at build time; guard for non-Vite test runs.
function env(name, fallback) {
  try {
    const v = import.meta.env && import.meta.env[name];
    return v !== undefined && v !== '' ? v : fallback;
  } catch {
    return fallback;
  }
}

export const DATA_SOURCE = env('VITE_DATA_SOURCE', 'local');
export const API_URL = env('VITE_API_URL', 'http://localhost:3000');

export function isApiMode() {
  return DATA_SOURCE === 'api';
}
