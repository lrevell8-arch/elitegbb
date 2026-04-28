"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ConversationList } from "@/components/ui/ConversationList";
import { MessageThread } from "@/components/ui/MessageThread";
import { SearchBar } from "@/components/ui";
import type { CoachConversation } from "@/lib/adapters/coach";

interface MessagesWorkspaceClientProps {
  conversations: CoachConversation[];
}

export function MessagesWorkspaceClient({ conversations }: MessagesWorkspaceClientProps) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const filtered = useMemo(
    () => conversations.filter((conversation) => conversation.playerName.toLowerCase().includes(query.toLowerCase())),
    [conversations, query]
  );

  const active = filtered.find((conversation) => conversation.id === activeId) ?? filtered[0] ?? null;

  const onSend = (text: string) => {
    if (!active) return;
    // Simulate sending a message locally for now.
    setDraft("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-xl border border-white/10 bg-[var(--surface)] p-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search conversations" />
        <div className="mt-3">
          <ConversationList
            conversations={filtered.map((conversation) => ({
              id: conversation.id,
              name: conversation.playerName,
              avatarUrl: conversation.avatarUrl,
              lastMessage: conversation.lastPreview,
              timestamp: conversation.timestamp,
              unread: conversation.unread,
            }))}
            selectedId={active?.id}
            onSelect={setActiveId}
          />
        </div>
      </aside>

      {!active ? (
        <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-6 text-sm text-[var(--foreground)]/70">
          Select a conversation to view messages.
        </section>
      ) : (
        <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-sm font-semibold text-white">{active.playerName}</p>
              <Link href={active.profileHref} className="text-xs text-[var(--brand-primary)]">
                View profile
              </Link>
            </div>
            <div className="text-right text-xs text-white/60">
              {active.timestamp}
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <div className="rounded-md bg-black/30 p-3 text-xs text-white/70">
              Safe messaging notice: Conversations are logged and moderated to protect players.
            </div>
            {active.pendingParentApproval && (
              <div className="rounded-md border border-amber-400/50 bg-amber-500/10 p-3 text-xs text-amber-100">
                Messages are pending parent/guardian approval.
              </div>
            )}
            {active.underReview && (
              <div className="rounded-md border border-[var(--brand-secondary)]/50 bg-[var(--brand-secondary)]/10 p-3 text-xs text-white">
                This thread is under moderator review.
              </div>
            )}
          </div>

          <div className="mt-4 h-[560px] rounded-xl border border-white/10 bg-black/20">
            <MessageThread
              messages={active.messages.map((message) => ({
                id: message.id,
                senderId: message.sender,
                text: message.text,
                timestamp: message.sentAt,
              }))}
              currentUserId="coach"
              onSend={onSend}
              disabled={active.moderationHold}
              className="h-full"
            />
          </div>
        </section>
      )}
    </div>
  );
}
