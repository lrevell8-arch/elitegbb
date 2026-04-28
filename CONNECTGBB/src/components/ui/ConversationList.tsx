"use client";

import { cn } from "@/lib/cn";
import { ProfileAvatar } from "./ProfileAvatar";

interface ConversationItem {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function ConversationList({ conversations, selectedId, onSelect, className }: ConversationListProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[var(--surface-muted)] transition-colors",
            selectedId === conversation.id && "bg-[var(--surface-muted)] border-l-2 border-[var(--brand-primary)]"
          )}
          onClick={() => onSelect(conversation.id)}
        >
          <ProfileAvatar
            src={conversation.avatarUrl}
            initials={conversation.name.split(" ").map(n => n[0]).join("")}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-[var(--foreground)] truncate">{conversation.name}</p>
              <span className="text-xs text-[var(--foreground)]/60">{conversation.timestamp}</span>
            </div>
            <p className="text-sm text-[var(--foreground)]/80 truncate">{conversation.lastMessage}</p>
          </div>
          {conversation.unread > 0 && (
            <div className="bg-[var(--brand-secondary)] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {conversation.unread}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}