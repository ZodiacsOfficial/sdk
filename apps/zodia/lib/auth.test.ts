import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AuthError,
  addressFromMessage,
  buildWalletSignInMessage,
  createWalletSession,
  domainFromMessage,
  nonceFromMessage,
  userIdForWallet,
  verifyWalletSession
} from "./auth";

const originalAuthSecret = process.env.AUTH_SECRET;
const originalCronSecret = process.env.CRON_SECRET;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  process.env.AUTH_SECRET = "test-auth-secret";
  delete process.env.CRON_SECRET;
});

afterEach(() => {
  restoreEnv("AUTH_SECRET", originalAuthSecret);
  restoreEnv("CRON_SECRET", originalCronSecret);
});

describe("wallet auth", () => {
  const address = "0x000000000000000000000000000000000000dEaD";

  it("builds and parses the wallet sign-in message", () => {
    const message = buildWalletSignInMessage({
      address,
      domain: "sdk-zodia.vercel.app",
      nonce: "abc12345",
      issuedAt: new Date("2026-06-16T00:00:00.000Z")
    });

    expect(domainFromMessage(message)).toBe("sdk-zodia.vercel.app");
    expect(addressFromMessage(message)).toBe("0x000000000000000000000000000000000000dEaD");
    expect(nonceFromMessage(message)).toBe("abc12345");
    expect(message).toContain("Chain ID: 8453");
  });

  it("creates a wallet session bound to the normalized wallet id", () => {
    const now = new Date("2026-06-16T00:00:00.000Z");
    const token = createWalletSession(address, "sdk-zodia.vercel.app", now);
    const user = verifyWalletSession(token, new Date("2026-06-16T00:01:00.000Z"));

    expect(user).toEqual({
      id: userIdForWallet(address),
      fid: null,
      walletAddress: "0x000000000000000000000000000000000000dead"
    });
  });

  it("rejects expired or tampered wallet sessions", () => {
    const now = new Date("2026-06-16T00:00:00.000Z");
    const token = createWalletSession(address, "sdk-zodia.vercel.app", now);
    const expiredAt = new Date("2026-06-24T00:00:01.000Z");

    expect(() => verifyWalletSession(token, expiredAt)).toThrow(AuthError);
    expect(() => verifyWalletSession(`${token}x`, now)).toThrow(AuthError);
  });
});
