"use client";

import { sdk } from "@farcaster/miniapp-sdk";

export interface WalletAuth {
  readonly address?: `0x${string}`;
  readonly signMessage?: (args: { message: string }) => Promise<`0x${string}` | string>;
}

function sessionStorageKey(address: string): string {
  return `zodia:wallet-session:${address.toLowerCase()}`;
}

function tokenExpired(token: string): boolean {
  const [, payload] = token.split(".");
  if (!payload) {
    return true;
  }
  try {
    const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as {
      exp?: number;
    };
    return !parsed.exp || parsed.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return true;
  }
}

async function walletAuthHeaders(auth?: WalletAuth): Promise<Record<string, string>> {
  if (!auth?.address || !auth.signMessage || typeof window === "undefined") {
    return {};
  }
  const key = sessionStorageKey(auth.address);
  const cached = window.localStorage.getItem(key);
  if (cached && !tokenExpired(cached)) {
    return { Authorization: `Bearer ${cached}` };
  }

  const nonceResponse = await fetch(`/api/auth/nonce?address=${encodeURIComponent(auth.address)}`);
  if (!nonceResponse.ok) {
    return {};
  }
  const noncePayload = (await nonceResponse.json()) as { message?: string };
  if (!noncePayload.message) {
    return {};
  }
  const signature = await auth.signMessage({ message: noncePayload.message });
  const sessionResponse = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: auth.address, message: noncePayload.message, signature })
  });
  if (!sessionResponse.ok) {
    return {};
  }
  const sessionPayload = (await sessionResponse.json()) as { token?: string };
  if (!sessionPayload.token) {
    return {};
  }
  window.localStorage.setItem(key, sessionPayload.token);
  return { Authorization: `Bearer ${sessionPayload.token}` };
}

async function farcasterAuthHeaders(): Promise<Record<string, string>> {
  try {
    const inMiniApp = await sdk.isInMiniApp();
    if (!inMiniApp) {
      return {};
    }
    const result = await Promise.race([
      sdk.quickAuth.getToken(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
    ]);
    return result ? { Authorization: `Bearer ${result.token}` } : {};
  } catch {
    return {};
  }
}

export async function authHeaders(auth?: WalletAuth): Promise<Record<string, string>> {
  const wallet = await walletAuthHeaders(auth);
  if (wallet.Authorization) {
    return wallet;
  }
  return farcasterAuthHeaders();
}

export async function authedJson<T>(
  path: string,
  init?: RequestInit,
  auth?: WalletAuth
): Promise<T> {
  const headers = {
    "content-type": "application/json",
    ...(await authHeaders(auth)),
    ...(init?.headers as Record<string, string> | undefined)
  };
  const response = await fetch(path, { ...init, headers });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}
