import { NavBar } from "@/components/nav-bar";
import { ChatBubble } from "@/components/chat-bubble";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
      <ChatBubble />
    </>
  );
}
