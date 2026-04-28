"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface MessageItem {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface MessageThreadProps {
  messages: MessageItem[];
  currentUserId: string;
  onSend: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageThread({ messages, currentUserId, onSend, disabled, className }: MessageThreadProps) {
  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (messageText.trim() && !disabled) {
      onSend(messageText.trim());
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                isCurrentUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-xs px-4 py-2 rounded-lg",
                  isCurrentUser
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-[var(--surface-muted)] text-[var(--foreground)]"
                )}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        {disabled ? (
          <div className="text-center text-sm text-[var(--foreground)]/60 py-2">
            Messaging is currently disabled
          </div>
        ) : (
          <div className="flex gap-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/60 resize-none focus:outline-none focus:border-[var(--brand-primary)]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim()}
              className="bg-[var(--brand-primary)] text-white p-2 rounded-lg hover:bg-[var(--brand-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}