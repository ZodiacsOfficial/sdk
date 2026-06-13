"use client";

import { AppHeader, FooterNote } from "../../../components/AppHeader";
import { ChatRoom } from "../../../components/chat/ChatRoom";

export default function ChatPage() {
  return (
    <>
      <AppHeader title="Trollbox" subtitle="One room, twelve signs. Blame retrogrades." />
      <ChatRoom />
      <FooterNote>Messages are public and rate-limited. Be kind — no financial advice.</FooterNote>
    </>
  );
}
