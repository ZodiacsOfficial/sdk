"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { authedJson } from "../../lib/clientApi";
import type { ChatMessage } from "../../app/api/chat/route";
import { EmptyState } from "../EmptyState";

export function ChatRoom() {
  const { context } = useMiniKit();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["chat"],
    queryFn: async () => {
      const response = await fetch("/api/chat");
      if (!response.ok) {
        throw new Error("chat unavailable");
      }
      return (await response.json()) as { messages: ChatMessage[] };
    },
    refetchInterval: 4000
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const user = context?.user;
      return authedJson<{ message: ChatMessage }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          text,
          ...(user?.username ? { username: user.username } : {}),
          ...(user?.pfpUrl ? { pfpUrl: user.pfpUrl } : {})
        })
      });
    },
    onSuccess: () => {
      setDraft("");
      setNotice(null);
      void queryClient.invalidateQueries({ queryKey: ["chat"] });
    },
    onError: (error: Error) => setNotice(error.message)
  });

  const report = useMutation({
    mutationFn: async (messageId: string) =>
      authedJson("/api/chat/report", { method: "POST", body: JSON.stringify({ messageId }) }),
    onSuccess: () => setNotice("Reported. Thank you.")
  });

  return (
    <section className="card" style={{ display: "grid", gap: 12 }}>
      <div className="chat-list">
        {(data?.messages ?? []).map((message) => (
          <div key={message.id} className="chat-msg">
            <span className="author row">
              {message.pfpUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="avatar" src={message.pfpUrl} alt="" />
              ) : null}
              {message.username ?? `fid ${message.fid}`}
              <button
                className="ghost"
                style={{ padding: "0 6px", fontSize: 11 }}
                title="Report message"
                onClick={() => report.mutate(message.id)}
              >
                ⚑
              </button>
            </span>
            <span className="body">{message.text}</span>
          </div>
        ))}
        {data && data.messages.length === 0 ? (
          <EmptyState
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5c0 4.1-4 7.5-9 7.5-1 0-2-.13-2.9-.38L4 20l1.2-3.4C3.8 15.3 3 13.5 3 11.5 3 7.4 7 4 12 4s9 3.4 9 7.5z" />
              </svg>
            }
            title="Quiet in here"
            hint="Say gm to the cosmos — first message sets the tone."
          />
        ) : null}
      </div>

      <div className="row">
        <input
          className="field"
          placeholder="Speak to the stars (280 max)"
          maxLength={280}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && draft.trim()) {
              send.mutate(draft.trim());
            }
          }}
        />
        <button
          className="primary"
          disabled={send.isPending || !draft.trim()}
          onClick={() => send.mutate(draft.trim())}
        >
          Send
        </button>
      </div>
      {notice ? <p className="muted">{notice}</p> : null}
    </section>
  );
}
