"use client";

import { sdk } from "@farcaster/miniapp-sdk";

/**
 * Quick Auth headers for backend writes. Outside a mini app host (plain browser dev) this
 * resolves to no auth header and the API responds 401 unless DEV_FID is configured server-side.
 * getToken() can block forever without a host, so it is gated and raced against a timeout.
 */
export async function authHeaders(): Promise<Record<string, string>> {
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

export async function authedJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "content-type": "application/json",
    ...(await authHeaders()),
    ...(init?.headers as Record<string, string> | undefined)
  };
  const response = await fetch(path, { ...init, headers });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}
