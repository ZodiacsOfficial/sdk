import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireFid } from "../../../lib/auth";
import { allowRequest } from "../../../lib/rateLimit";
import { keys, redis } from "../../../lib/redis";
import { upsertProfileSnapshot } from "../../../lib/trades/leaderboard";

export interface ChatMessage {
  readonly id: string;
  readonly fid: number;
  readonly username: string | null;
  readonly pfpUrl: string | null;
  readonly text: string;
  readonly ts: number;
}

const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f]", "g");

const PostSchema = z.object({
  text: z.string().min(1).max(280),
  username: z.string().max(64).optional(),
  pfpUrl: z.string().max(512).optional()
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const after = Number(url.searchParams.get("after") ?? 0);
  const raw = await redis().lrange<ChatMessage>(keys.chat(), 0, 99);
  const messages = raw.filter((message) => message.ts > after).reverse();
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  let fid: number;
  try {
    fid = await requireFid(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const blocked = await redis().sismember(keys.chatBlock(), fid);
  if (blocked) {
    return NextResponse.json({ error: "account muted" }, { status: 403 });
  }
  if (!(await allowRequest("chat", fid, 5, 60))) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }

  const parsed = PostSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const text = parsed.data.text.replace(CONTROL_CHARS, " ").trim().slice(0, 280);
  if (!text) {
    return NextResponse.json({ error: "empty message" }, { status: 400 });
  }

  const username = parsed.data.username?.trim().slice(0, 64) || null;
  const pfpUrl = parsed.data.pfpUrl?.startsWith("https://")
    ? parsed.data.pfpUrl.slice(0, 512)
    : null;

  const ts = Date.now();
  const message: ChatMessage = {
    id: `${ts.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fid,
    username,
    pfpUrl,
    text,
    ts
  };

  await redis().lpush(keys.chat(), message);
  await redis().ltrim(keys.chat(), 0, 499);
  await upsertProfileSnapshot(fid, {
    ...(username ? { username } : {}),
    ...(pfpUrl ? { pfpUrl } : {})
  });

  return NextResponse.json({ message });
}
