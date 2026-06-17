import { NextResponse } from "next/server";
import { hasRedis, isoDate, keys, redis } from "../../../../lib/redis";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const date = isoDate();
  const [dailySky, notificationSent, tradeFailures] = hasRedis()
    ? await Promise.all([
        redis().get(keys.horoscope(date)),
        redis().get(keys.notifSent("daily", date)),
        redis().lrange(keys.tradeFailures(), 0, 9)
      ])
    : [null, null, []];

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_URL: present("NEXT_PUBLIC_URL"),
      UPSTASH_REDIS_REST_URL: present("UPSTASH_REDIS_REST_URL"),
      UPSTASH_REDIS_REST_TOKEN: present("UPSTASH_REDIS_REST_TOKEN"),
      BASE_RPC_URL: present("BASE_RPC_URL"),
      NEXT_PUBLIC_BASE_RPC_URL: present("NEXT_PUBLIC_BASE_RPC_URL"),
      NEXT_PUBLIC_BASE_APP_ID: present("NEXT_PUBLIC_BASE_APP_ID"),
      NEXT_PUBLIC_BASE_BUILDER_CODE: present("NEXT_PUBLIC_BASE_BUILDER_CODE"),
      CRON_SECRET: present("CRON_SECRET"),
      AUTH_SECRET: present("AUTH_SECRET"),
      NEYNAR_API_KEY: present("NEYNAR_API_KEY"),
      FARCASTER_HUB_URL: present("FARCASTER_HUB_URL")
    },
    integrations: {
      walletAuthConfigured: present("AUTH_SECRET") || present("CRON_SECRET"),
      farcasterWebhookConfigured: present("NEYNAR_API_KEY") || present("FARCASTER_HUB_URL"),
      neynarSocialFeedConfigured: present("NEYNAR_API_KEY")
    },
    cron: {
      date,
      dailySkyCached: Boolean(dailySky),
      dailyNotificationSent: Boolean(notificationSent)
    },
    recent: {
      tradeFailures
    }
  });
}
