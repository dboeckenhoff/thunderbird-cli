/**
 * Pure utility functions for outbound attachments.
 * Extracted from background.js so they can be unit-tested outside Thunderbird
 * (same pattern as thread-utils.js). The MV2 background script cannot import
 * ES modules, so background.js inlines the same logic — keep the two in sync.
 */

/**
 * Decode a base64 string to a Uint8Array.
 *
 * Throws on non-string input or characters outside the base64 alphabet —
 * a corrupted binary attachment must fail loudly, not decode to garbage.
 */
export function base64ToUint8Array(b64) {
  if (typeof b64 !== "string") {
    throw new Error("base64ToUint8Array: expected a string, got " + typeof b64);
  }
  const s = b64.replace(/\s+/g, "");
  if (s.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
    throw new Error("base64ToUint8Array: input is not valid base64");
  }
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
