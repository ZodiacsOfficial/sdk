"use client";

import { AppHeader, FooterNote } from "../../../components/AppHeader";
import { AstroTalk } from "../../../components/chat/AstroTalk";

export default function ChatPage() {
  return (
    <>
      <AppHeader title="AstroTalk" subtitle="A public Farcaster window into Zodia." />
      <AstroTalk />
      <FooterNote>Farcaster casts are public. Be kind — no financial advice.</FooterNote>
    </>
  );
}
