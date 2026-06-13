import { NextResponse } from "next/server";
import {
  createVerifyAppKeyWithHub,
  parseWebhookEvent,
  verifyAppKeyWithNeynar
} from "@farcaster/miniapp-node";
import { clearNotificationDetails, storeNotificationDetails } from "../../../lib/notifications";

function verifier() {
  if (process.env.NEYNAR_API_KEY) {
    return verifyAppKeyWithNeynar;
  }
  const hubUrl = process.env.FARCASTER_HUB_URL?.trim();
  if (!hubUrl) {
    return null;
  }
  return createVerifyAppKeyWithHub(hubUrl);
}

export async function POST(request: Request) {
  const verifyAppKey = verifier();
  if (!verifyAppKey) {
    return NextResponse.json(
      { error: "webhook verification not configured (set FARCASTER_HUB_URL or NEYNAR_API_KEY)" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = await parseWebhookEvent(body, verifyAppKey);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { fid, event } = parsed;
  switch (event.event) {
    case "miniapp_added":
      if (event.notificationDetails) {
        await storeNotificationDetails(fid, event.notificationDetails);
      }
      break;
    case "notifications_enabled":
      await storeNotificationDetails(fid, event.notificationDetails);
      break;
    case "miniapp_removed":
    case "notifications_disabled":
      await clearNotificationDetails(fid);
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
