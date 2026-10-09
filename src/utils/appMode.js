// No authenticated operational backend is present in this checkout.
// Unknown/missing modes deliberately do not mount the local business store.
export function isDemoMode(mode) { return mode === 'demo'; }
export const DEMO_MODE = isDemoMode(import.meta.env?.VITE_APP_MODE);
