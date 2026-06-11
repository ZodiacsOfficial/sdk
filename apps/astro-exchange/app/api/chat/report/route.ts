import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireFid } from "../../../../lib/auth";
import { allowRequest } from "../../../../lib/rateLimit";
import { keys, redis } from "../../../../lib/redis";

const BodySchema = z.object({ messageId: z.string().min(1).max(64) });

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

  if (!(await allowRequest("report", fid, 5, 86400))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await redis().lpush(keys.chatReports(), {
    messageId: parsed.data.messageId,
    byFid: fid,
    ts: Date.now()
  });
  return NextResponse.json({ ok: true });
}
