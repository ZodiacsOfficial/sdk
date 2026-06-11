import { Errors, createClient } from "@farcaster/quick-auth";
import { appUrl } from "../minikit.config";

const quickAuthClient = createClient();

export class AuthError extends Error {}

function expectedDomain(): string {
  return new URL(appUrl).host;
}

/**
 * Resolves the verified FID for a request from its Quick Auth bearer token.
 * MiniKit context values are display-only and never trusted here.
 */
export async function requireFid(request: Request): Promise<number> {
  const devFid = process.env.DEV_FID;
  if (process.env.NODE_ENV === "development" && devFid) {
    return Number(devFid);
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    throw new AuthError("Missing bearer token");
  }

  try {
    const payload = await quickAuthClient.verifyJwt({ token, domain: expectedDomain() });
    const fid = Number(payload.sub);
    if (!Number.isInteger(fid) || fid <= 0) {
      throw new AuthError("Token has no valid fid subject");
    }
    return fid;
  } catch (error) {
    if (error instanceof Errors.InvalidTokenError) {
      throw new AuthError("Invalid Quick Auth token");
    }
    throw error;
  }
}

export async function optionalFid(request: Request): Promise<number | null> {
  try {
    return await requireFid(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return null;
    }
    throw error;
  }
}
