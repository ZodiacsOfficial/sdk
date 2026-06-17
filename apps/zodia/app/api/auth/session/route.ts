import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthConfigError,
  addressFromMessage,
  createWalletSession,
  domainFromMessage,
  nonceFromMessage,
  verifyWalletSignature
} from "../../../../lib/auth";
import { hasRedis, keys, redis } from "../../../../lib/redis";

const BodySchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  message: z.string().min(1).max(2000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/)
});

export async function POST(request: Request) {
  if (!hasRedis()) {
    return NextResponse.json({ error: "wallet auth unavailable" }, { status: 503 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { address, message, signature } = parsed.data;
  const messageAddress = addressFromMessage(message);
  const nonce = nonceFromMessage(message);
  const domain = domainFromMessage(message);
  if (!messageAddress || messageAddress.toLowerCase() !== address.toLowerCase() || !nonce || !domain) {
    return NextResponse.json({ error: "invalid sign-in message" }, { status: 400 });
  }
  if (domain !== new URL(request.url).host) {
    return NextResponse.json({ error: "invalid sign-in domain" }, { status: 400 });
  }
  const storedNonce = await redis().get<string>(keys.authNonce(address));
  if (!storedNonce || storedNonce !== nonce) {
    return NextResponse.json({ error: "invalid or expired nonce" }, { status: 401 });
  }
  const valid = await verifyWalletSignature({ address, message, signature });
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  await redis().del(keys.authNonce(address));
  try {
    return NextResponse.json({ token: createWalletSession(address, domain) });
  } catch (error) {
    if (error instanceof AuthConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
