"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Clock, Cookie, List, Mail, MapPin, Phone, Printer, Scale, ShieldCheck } from "lucide-react";
import { ContactEmailPopover } from "@/shared/components/contact-email-popover";
import { ContactPhonePopover } from "@/shared/components/contact-phone-popover";
import { cn } from "@/lib/utils";

const LEGAL_ICONS = {
  scale: Scale,
  shield: ShieldCheck,
  cookie: Cookie,
} as const;

export type LegalPageIconName = keyof typeof LEGAL_ICONS;

export interface LegalTocItem {
  id: string;
  label: string;
}

export interface LegalContactCard {
  title: string;
  desc: string;
  email: string;
  phone?: string;
  address?: string;
  poBox?: string;
  hours?: string;
}

interface LegalDocumentLayoutProps {
  iconName: LegalPageIconName;
  badge: string;
  title: string;
  updatedLabel?: string;
  tocLabel: string;
  printLabel: string;
  tocItems: LegalTocItem[];
  contact: LegalContactCard;
  children: ReactNode;
}

export function LegalDocumentLayout({
  iconName,
  badge,
  title,
  updatedLabel,
  tocLabel,
  printLabel,
  tocItems,
  contact,
  children,
}: LegalDocumentLayoutProps) {
  const Icon = LEGAL_ICONS[iconName];
  const stickyTop = "top-[calc(var(--header-offset,4rem)+1rem)]";
  const mobileDetailsRef = useRef<HTMLDetailsElement>(null);
  const tocScrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(tocItems[0]?.id ?? "");

  const printHandler = () => {
    window.print();
  };

  const handleMobileLinkClick = () => {
    if (mobileDetailsRef.current) {
      mobileDetailsRef.current.removeAttribute("open");
    }
  };

  // Active section tracking via IntersectionObserver + bottom-of-page detection
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      tocItems.length === 0 ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const headingElements = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    const visibleHeadings = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        });

        // Pick the topmost visible heading in document order
        for (const item of tocItems) {
          if (visibleHeadings.has(item.id)) {
            setActiveId(item.id);
            break;
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    // Handle bottom of page scroll boundary
    const handleScroll = () => {
      const scrollPos = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 150;
      if (scrollPos >= threshold && tocItems.length > 0) {
        setActiveId(tocItems[tocItems.length - 1].id);
        if (tocScrollRef.current) {
          tocScrollRef.current.scrollTo({
            top: tocScrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tocItems]);

  // Auto-scroll TOC container so the active section link never disappears
  useEffect(() => {
    if (!activeId || !tocScrollRef.current) return;
    const activeLink = tocScrollRef.current.querySelector<HTMLElement>(`a[href="#${activeId}"]`);
    if (!activeLink) return;

    const container = tocScrollRef.current;
    if (typeof container.getBoundingClientRect !== "function" || typeof activeLink.getBoundingClientRect !== "function") {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    if (typeof container.scrollTo !== "function") return;

    // If the active item is near or below the visible bottom of TOC
    if (linkRect.bottom > containerRect.bottom - 20) {
      container.scrollTo({
        top: container.scrollTop + (linkRect.bottom - containerRect.bottom) + 28,
        behavior: "smooth",
      });
    }
    // If the active item is near or above the visible top of TOC
    else if (linkRect.top < containerRect.top + 20) {
      container.scrollTo({
        top: container.scrollTop + (linkRect.top - containerRect.top) - 28,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-10 sm:py-16 lg:py-20">
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-brand-dark/10 blur-3xl dark:bg-white/5"
        />

        <div className="mx-auto max-w-4xl px-3 min-[360px]:px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3.5 sm:mb-5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Icon size={14} className="shrink-0 text-brand-dark dark:text-white" />
              <span className="truncate break-words">{badge}</span>
            </div>

            <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.16] sm:leading-[1.12] text-balance break-words">
              {title}
            </h1>

            {updatedLabel ? (
              <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
                {updatedLabel}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-background pb-16 pt-8 sm:pb-24 sm:pt-12">
        <div className="mx-auto max-w-6xl xl:max-w-7xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
            {/* Desktop TOC */}
            <aside className={cn("sticky z-20 hidden lg:block print:hidden", stickyTop)}>
              <nav
                className="flex flex-col max-h-[calc(100vh-var(--header-offset,4rem)-3rem)] rounded-2xl border border-border bg-card shadow-2xs"
                aria-label={tocLabel}
              >
                <div className="shrink-0 px-4 pt-4 pb-2.5 sm:px-5 sm:pt-5 border-b border-border/50">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tocLabel}</p>
                </div>

                <div
                  ref={tocScrollRef}
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2 sm:px-5 space-y-0.5"
                >
                  <ul className="space-y-0.5">
                    {tocItems.map((item) => {
                      const isActive = activeId === item.id;
                      return (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            aria-current={isActive ? "true" : undefined}
                            onClick={() => setActiveId(item.id)}
                            className={cn(
                              "block rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                            )}
                          >
                            {item.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="shrink-0 p-3 sm:p-4 border-t border-border/60 bg-card rounded-b-2xl">
                  <button
                    type="button"
                    onClick={printHandler}
                    title="Print or save as PDF"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  >
                    <Printer size={13} className="text-muted-foreground" aria-hidden="true" />
                    <span>{printLabel}</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Content Area */}
            <div className="min-w-0">
              {/* Mobile TOC + Mobile Print */}
              <div className="mb-6 lg:hidden print:hidden">
                <details
                  ref={mobileDetailsRef}
                  className="group rounded-xl border border-border bg-card shadow-2xs"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2">
                      <List size={16} className="text-muted-foreground" aria-hidden="true" />
                      {tocLabel}
                    </span>
                    <ChevronDown
                      size={16}
                      className="text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto border-t border-border px-4 py-2.5">
                    {tocItems.map((item) => {
                      const isActive = activeId === item.id;
                      return (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            aria-current={isActive ? "true" : undefined}
                            onClick={handleMobileLinkClick}
                            className={cn(
                              "block rounded-md px-2 py-1.5 text-sm transition-colors",
                              isActive
                                ? "bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                            )}
                          >
                            {item.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </details>
                {/* Mobile Print Button */}
                <button
                  type="button"
                  onClick={printHandler}
                  title="Print or save as PDF"
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-accent/70"
                >
                  <Printer size={13} className="text-muted-foreground" aria-hidden="true" />
                  <span>{printLabel}</span>
                </button>
              </div>

              <div>{children}</div>

              {/* Dynamic Legal Entity & DPO Contact Card */}
              <div className="mt-12 rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground shadow-2xs sm:p-6">
                <div>
                  <p className="text-sm font-bold text-foreground sm:text-base">{contact.title}</p>
                  <p className="mt-1 text-xs leading-relaxed sm:text-sm">{contact.desc}</p>
                </div>

                <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <ContactEmailPopover
                      email={contact.email}
                      subject={
                        iconName === "cookie"
                          ? "Cookie Governance & Technical Privacy Inquiry"
                          : iconName === "shield"
                          ? "Data Protection & Privacy Inquiry"
                          : "Legal & Regulatory Inquiry"
                      }
                      align="start"
                      side="top"
                      className="inline-flex items-center gap-2 font-medium text-foreground hover:underline"
                      iconClassName="shrink-0 text-primary dark:text-white"
                      iconSize={14}
                    />
                    {contact.phone ? (
                      <div>
                        <ContactPhonePopover
                          phone={contact.phone}
                          align="start"
                          side="top"
                          className="inline-flex items-center gap-2 font-medium text-foreground hover:underline"
                          iconClassName="shrink-0 text-primary dark:text-white"
                          iconSize={14}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    {contact.address ? (
                      <p className="flex items-start gap-2">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-primary dark:text-white" aria-hidden="true" />
                        <span>
                          {contact.address}
                          {contact.poBox ? ` (${contact.poBox})` : ""}
                        </span>
                      </p>
                    ) : null}
                    {contact.hours ? (
                      <p className="flex items-center gap-2">
                        <Clock size={14} className="shrink-0 text-primary dark:text-white" aria-hidden="true" />
                        <span>{contact.hours}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}