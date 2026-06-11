import { NextResponse } from "next/server";
import { appUrl } from "../../../../minikit.config";
import type { DailySkyPayload } from "../../../../lib/horoscope/schema";
import { listNotificationTargets, sendNotifications } from "../../../../lib/notifications";
import { isoDate, keys, redis } from "../../../../lib/redis";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function upcomingEventLine(payload: DailySkyPayload, now: Date): string | null {
  const horizon = now.getTime() + 36 * 3600 * 1000;
  for (const window of payload.events.retrogrades) {
    const startsAt = Date.parse(window.startsAt);
    if (startsAt > now.getTime() && startsAt <= horizon) {
      const planet = window.planet[0]!.toUpperCase() + window.planet.slice(1);
      return `${planet} goes retrograde soon. Brace your group chats.`;
    }
  }
  for (const phase of payload.events.moonPhases) {
    const at = Date.parse(phase.at);
    if (at > now.getTime() && at <= horizon && (phase.phase === "full" || phase.phase === "new")) {
      return phase.phase === "full"
        ? "A full moon is coming. Big feelings ahead."
        : "A new moon is coming. Fresh start energy.";
    }
  }
  return null;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const date = isoDate();
  const flag = await redis().set(keys.notifSent("daily", date), "1", { nx: true, ex: 48 * 3600 });
  if (!flag) {
    return NextResponse.json({ skipped: "already sent today" });
  }

  const payload = await redis().get<DailySkyPayload>(keys.horoscope(date));
  const eventLine = payload ? upcomingEventLine(payload, new Date()) : null;
  const title = eventLine ? "Cosmic weather alert" : "Today's sky is up";
  const body =
    eventLine ?? payload?.sky.global.headline ?? "Your daily reading is ready in the Sky tab.";

  const targets = await listNotificationTargets();
  const result = await sendNotifications(targets, {
    notificationId: `daily-${date}`,
    title,
    body,
    targetUrl: `${appUrl}/sky`
  });

  return NextResponse.json({ date, targets: targets.length, ...result });
}
