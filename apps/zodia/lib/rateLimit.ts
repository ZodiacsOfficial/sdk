import { keys, redis } from "./redis";

/**
 * Fixed-window rate limit per authenticated account and route.
 */
export async function allowRequest(
  route: string,
  userId: string | number,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = keys.rateLimit(route, userId, bucket);
  const count = await redis().incr(key);
  if (count === 1) {
    await redis().expire(key, windowSeconds);
  }
  return count <= limit;
}
