import { NavBar } from "@/components/nav-bar";
import { ChatBubbleLazy } from "@/components/chat-bubble-lazy";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
      <ChatBubbleLazy />
      <footer className="h-24" />
    </>
  );
}
