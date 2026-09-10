import { PublicPageShell } from "@/shared/components/public-page-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicPageShell>{children}</PublicPageShell>;
}
