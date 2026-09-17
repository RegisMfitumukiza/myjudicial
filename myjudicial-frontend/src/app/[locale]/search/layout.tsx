import { Header } from "@/shared/components/header";
import { FloatingAiChat } from "@/shared/components/floating-ai-chat";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>
      <FloatingAiChat />
    </div>
  );
}
