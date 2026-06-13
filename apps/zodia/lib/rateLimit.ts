import { keys, redis } from "./redis";

/**
 * Fixed-window rate limit per fid and route. Returns true when the request is allowed.
 */
export async function allowRequest(
  route: string,
  fid: number,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = keys.rateLimit(route, fid, bucket);
  const count = await redis().incr(key);
  if (count === 1) {
    await redis().expire(key, windowSeconds);
  }
  return count <= limit;
}
