import { Header } from "@/shared/components/header";
import LandingFooter from "@/shared/components/landing/landing-footer";
import { FloatingAiChat } from "@/shared/components/floating-ai-chat";

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <LandingFooter />
      <FloatingAiChat />
    </div>
  );
}
