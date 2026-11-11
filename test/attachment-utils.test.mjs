#!/usr/bin/env node
/**
 * Unit tests for extension/src/attachment-utils.js
 *
 * The outbound-attachment payload travels CLI → bridge → extension as base64.
 * The extension must decode it byte-exactly (attachments are often binary);
 * these tests pin the decode so the copy inlined in background.js stays correct.
 */

import { base64ToUint8Array } from "../extension/src/attachment-utils.js";

let passed = 0, failed = 0;
function test(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    expected: ${JSON.stringify(expected)}`);
    console.log(`    actual:   ${JSON.stringify(actual)}`);
  }
}
function testThrows(name, fn) {
  try {
    fn();
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name} (did not throw)`);
  } catch {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  }
}

console.log("\n\x1b[1m=== attachment-utils unit tests ===\x1b[0m\n");

// "SGVsbG8=" is the classic base64 for "Hello"
test("decodes a known vector", [...base64ToUint8Array("SGVsbG8=")], [72, 101, 108, 108, 111]);
test("empty string decodes to empty", [...base64ToUint8Array("")], []);

// Binary round-trip: 4096 random bytes through base64 and back
const random = new Uint8Array(4096);
for (let i = 0; i < random.length; i++) random[i] = (i * 37 + 11) % 256;
const b64 = Buffer.from(random).toString("base64");
test("round-trips 4096 pseudo-random binary bytes", [...base64ToUint8Array(b64)], [...random]);

// UTF-8 multibyte content (what a text attachment actually is)
test("round-trips UTF-8 multibyte text", [...base64ToUint8Array(Buffer.from("héllo 你好").toString("base64"))],
  [...Buffer.from("héllo 你好")]);

// Missing padding is legal base64
test("accepts missing padding", [...base64ToUint8Array("SGVsbG8")], [72, 101, 108, 108, 111]);
test("tolerates whitespace (defensive)", [...base64ToUint8Array("SGVs\nbG8=\r")], [72, 101, 108, 108, 111]);

// Invalid input must throw, not decode to garbage
testThrows("rejects non-string", () => base64ToUint8Array(123));
testThrows("rejects null", () => base64ToUint8Array(null));
testThrows("rejects non-base64 characters", () => base64ToUint8Array("SGVs bG8!"));
testThrows("rejects wrong-length input", () => base64ToUint8Array("SGVsb"));
testThrows("rejects invalid padding", () => base64ToUint8Array("SGVsbG8==="));

console.log(`\n\x1b[1m${"─".repeat(40)}\x1b[0m`);
console.log(`\x1b[1m${passed} passed, ${failed} failed, ${passed + failed} total\x1b[0m\n`);
process.exit(failed > 0 ? 1 : 0);
