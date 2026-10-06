import { Header } from "@/shared/components/header";

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
