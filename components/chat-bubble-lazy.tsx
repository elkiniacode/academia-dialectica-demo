"use client";

import dynamic from "next/dynamic";

const ChatBubble = dynamic(
  () => import("@/components/chat-bubble").then((m) => m.ChatBubble),
  { ssr: false }
);

export function ChatBubbleLazy() {
  return <ChatBubble />;
}
