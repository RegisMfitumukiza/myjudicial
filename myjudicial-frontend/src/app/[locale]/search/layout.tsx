import { FloatingAiChat } from "@/shared/components/floating-ai-chat";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingAiChat />
    </>
  );
}
