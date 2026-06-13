import { keys, redis } from "./redis";

export interface NotificationTarget {
  readonly fid: number;
  readonly token: string;
  readonly url: string;
}

export async function storeNotificationDetails(
  fid: number,
  details: { token: string; url: string }
): Promise<void> {
  await redis().hset(keys.user(fid), { notifToken: details.token, notifUrl: details.url });
  await redis().sadd(keys.notifFids(), fid);
}

export async function clearNotificationDetails(fid: number): Promise<void> {
  await redis().hdel(keys.user(fid), "notifToken", "notifUrl");
  await redis().srem(keys.notifFids(), fid);
}

export async function listNotificationTargets(): Promise<NotificationTarget[]> {
  const fids = await redis().smembers(keys.notifFids());
  const targets: NotificationTarget[] = [];
  for (const raw of fids) {
    const fid = Number(raw);
    const user = await redis().hgetall<Record<string, string>>(keys.user(fid));
    const token = user?.["notifToken"];
    const url = user?.["notifUrl"];
    if (token && url) {
      targets.push({ fid, token, url });
    }
  }
  return targets;
}

export interface NotificationContent {
  readonly notificationId: string;
  readonly title: string;
  readonly body: string;
  readonly targetUrl: string;
}

/**
 * Sends one notification to many targets, batching tokens per host notification URL (max 100
 * tokens per request, per the mini app notifications spec). Invalid tokens are pruned.
 */
export async function sendNotifications(
  targets: readonly NotificationTarget[],
  content: NotificationContent
): Promise<{ sent: number; pruned: number }> {
  const byUrl = new Map<string, NotificationTarget[]>();
  for (const target of targets) {
    const group = byUrl.get(target.url) ?? [];
    group.push(target);
    byUrl.set(target.url, group);
  }

  let sent = 0;
  let pruned = 0;
  for (const [url, group] of byUrl) {
    for (let i = 0; i < group.length; i += 100) {
      const batch = group.slice(i, i + 100);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            notificationId: content.notificationId,
            title: content.title,
            body: content.body,
            targetUrl: content.targetUrl,
            tokens: batch.map((target) => target.token)
          })
        });
        if (!response.ok) {
          continue;
        }
        const result = (await response.json().catch(() => null)) as {
          invalidTokens?: string[];
        } | null;
        const invalid = new Set(result?.invalidTokens ?? []);
        sent += batch.length - invalid.size;
        for (const target of batch) {
          if (invalid.has(target.token)) {
            await clearNotificationDetails(target.fid);
            pruned += 1;
          }
        }
      } catch {
        continue;
      }
    }
  }
  return { sent, pruned };
}
