"use client";

import { ChatRoom } from "../../../components/chat/ChatRoom";

export default function ChatPage() {
  return (
    <>
      <section className="card">
        <h2>Trollbox</h2>
        <p className="muted">
          One global room for all twelve signs. Blame retrogrades, not each other.
        </p>
      </section>
      <ChatRoom />
      <p className="disclaimer">
        Be kind. Messages are public, rate-limited, and removable. No financial advice — cosmic or
        otherwise.
      </p>
    </>
  );
}
