import { Header } from "@/shared/components/header";
import LandingFooter from "@/shared/components/landing/landing-footer";
import { FloatingAiChat } from "@/shared/components/floating-ai-chat";
import { MaintenanceBanner } from "@/shared/components/maintenance-banner";

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MaintenanceBanner />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <LandingFooter />
      <FloatingAiChat />
    </div>
  );
}
