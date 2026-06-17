import { createHmac, timingSafeEqual } from "node:crypto";
import { Errors, createClient } from "@farcaster/quick-auth";
import { getAddress } from "viem";
import { createSiweMessage, parseSiweMessage } from "viem/siwe";
import { appUrl } from "../minikit.config";
import { serverPublicClient } from "./viem";

const quickAuthClient = createClient();
const SESSION_PREFIX = "zodia";
const SESSION_TTL_SECONDS = 7 * 24 * 3600;

export class AuthError extends Error {}
export class AuthConfigError extends Error {}

export interface AppUser {
  readonly id: string;
  readonly fid: number | null;
  readonly walletAddress: string | null;
}

export interface WalletSessionPayload {
  readonly sub: string;
  readonly address: string;
  readonly domain: string;
  readonly iat: number;
  readonly exp: number;
}

function expectedDomain(): string {
  return new URL(appUrl).host;
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return "dev-only-zodia-auth-secret";
    }
    throw new AuthConfigError("AUTH_SECRET or CRON_SECRET must be set");
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function userIdForWallet(address: string): string {
  return `wallet:${getAddress(address).toLowerCase()}`;
}

export function buildWalletSignInMessage({
  address,
  domain,
  nonce,
  issuedAt = new Date()
}: {
  address: string;
  domain: string;
  nonce: string;
  issuedAt?: Date;
}): string {
  return createSiweMessage({
    address: getAddress(address),
    chainId: 8453,
    domain,
    issuedAt,
    nonce,
    statement: "Sign in to Zodia to verify your wallet for chat, profiles, and trade crediting.",
    uri: appUrl,
    version: "1"
  });
}

export function nonceFromMessage(message: string): string | null {
  try {
    return parseSiweMessage(message).nonce ?? null;
  } catch {
    return null;
  }
}

export function domainFromMessage(message: string): string | null {
  try {
    return parseSiweMessage(message).domain ?? null;
  } catch {
    return null;
  }
}

export function addressFromMessage(message: string): string | null {
  try {
    const address = parseSiweMessage(message).address;
    return address ? getAddress(address) : null;
  } catch {
    return null;
  }
}

export function createWalletSession(address: string, domain: string, now = new Date()): string {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload: WalletSessionPayload = {
    sub: userIdForWallet(address),
    address: getAddress(address).toLowerCase(),
    domain,
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  return `${SESSION_PREFIX}.${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyWalletSession(token: string, now = new Date()): AppUser {
  const [prefix, encodedPayload, signature] = token.split(".");
  if (prefix !== SESSION_PREFIX || !encodedPayload || !signature) {
    throw new AuthError("Invalid wallet session");
  }
  if (!safeEqual(signPayload(encodedPayload), signature)) {
    throw new AuthError("Invalid wallet session");
  }
  let payload: Partial<WalletSessionPayload> | null;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as
      | Partial<WalletSessionPayload>
      | null;
  } catch {
    throw new AuthError("Invalid wallet session");
  }
  if (!payload?.address || !payload.sub || !payload.exp) {
    throw new AuthError("Invalid wallet session");
  }
  if (payload.exp <= Math.floor(now.getTime() / 1000)) {
    throw new AuthError("Wallet session expired");
  }
  const address = getAddress(payload.address).toLowerCase();
  const expectedId = userIdForWallet(address);
  if (payload.sub !== expectedId) {
    throw new AuthError("Invalid wallet session");
  }
  return { id: expectedId, fid: null, walletAddress: address };
}

export async function verifyWalletSignature({
  address,
  message,
  signature
}: {
  address: string;
  message: string;
  signature: string;
}): Promise<boolean> {
  return serverPublicClient().verifyMessage({
    address: getAddress(address),
    message,
    signature: signature as `0x${string}`
  });
}

async function verifyFarcasterToken(token: string): Promise<AppUser> {
  try {
    const payload = await quickAuthClient.verifyJwt({ token, domain: expectedDomain() });
    const fid = Number(payload.sub);
    if (!Number.isInteger(fid) || fid <= 0) {
      throw new AuthError("Token has no valid fid subject");
    }
    return { id: String(fid), fid, walletAddress: null };
  } catch (error) {
    if (error instanceof Errors.InvalidTokenError) {
      throw new AuthError("Invalid Quick Auth token");
    }
    throw error;
  }
}

export async function requireUser(request: Request): Promise<AppUser> {
  const devFid = process.env.DEV_FID;
  if (process.env.NODE_ENV === "development" && devFid) {
    return { id: String(devFid), fid: Number(devFid), walletAddress: null };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    throw new AuthError("Missing bearer token");
  }
  if (token.startsWith(`${SESSION_PREFIX}.`)) {
    return verifyWalletSession(token);
  }
  return verifyFarcasterToken(token);
}

export async function optionalUser(request: Request): Promise<AppUser | null> {
  try {
    return await requireUser(request);
  } catch (error) {
    if (error instanceof AuthError || error instanceof AuthConfigError) {
      return null;
    }
    throw error;
  }
}

export async function requireFid(request: Request): Promise<number> {
  const user = await requireUser(request);
  if (!user.fid) {
    throw new AuthError("Farcaster account required");
  }
  return user.fid;
}

export async function optionalFid(request: Request): Promise<number | null> {
  return (await optionalUser(request))?.fid ?? null;
}
