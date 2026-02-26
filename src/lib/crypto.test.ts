import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt, isEncrypted } from "./crypto";
import { randomBytes } from "crypto";

describe("crypto", () => {
  beforeEach(() => {
    // Generate a valid 256-bit key for testing
    process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");
  });

  it("encrypts and decrypts a string", () => {
    const plaintext = "test-oauth-token-12345";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const plaintext = "same-token";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it("detects encrypted vs plaintext strings", () => {
    const encrypted = encrypt("test");
    expect(isEncrypted(encrypted)).toBe(true);
    expect(isEncrypted("plain-text-token")).toBe(false);
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encrypt("test");
    const tampered = encrypted.slice(0, -2) + "ff";

    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws if ENCRYPTION_KEY is missing", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
  });
});
