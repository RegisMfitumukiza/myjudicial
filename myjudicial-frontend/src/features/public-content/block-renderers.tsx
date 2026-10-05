import { Fragment, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ChevronDown, Clock, Globe, Heart, Info, Lock, Mail, MapPin, MessageCircle, Phone, Scale, ShieldCheck, Sparkles, Target, TriangleAlert, Users, Award } from "lucide-react";
import type { ContentBlock } from "@/lib/api/content-pages";
import type { PlatformPublicSettings } from "@/features/settings/hooks/useSocialLinks";
import { Alert } from "@/shared/components/ui/alert";
import { cn } from "@/lib/utils";
import { FormattedProse, renderTextWithLead } from "./formatted-prose";
import { LegalTable } from "./legal-table";

/**
 * Renders an ordered list of admin-authored blocks to public page markup.
 *
 * The block set is closed and layout is decided here: an admin picks content
 * and wording, never layout, so a page can never be published in a shape the
 * renderer does not understand.
 */

const sectionTitleClass = "text-lg min-[360px]:text-xl font-bold text-foreground sm:text-2xl";
const bodyTextClass =
  "text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words";
const blockGapClass = "mt-2.5 sm:mt-4";
const sectionClass = "space-y-8 sm:space-y-12";

function ProseBlock({
  block,
  settings,
}: {
  block: Extract<ContentBlock, { type: "prose" }>;
  settings?: PlatformPublicSettings | null;
}) {
  return (
    <section>
      {block.heading ? <h2 className={sectionTitleClass}>{block.heading}</h2> : null}
      <div className={cn(block.heading ? blockGapClass : "")}>
        <FormattedProse body={block.body} settings={settings} />
      </div>
    </section>
  );
}

function BulletsBlock({
  block,
  settings,
}: {
  block: Extract<ContentBlock, { type: "bullets" }>;
  settings?: PlatformPublicSettings | null;
}) {
  return (
    <section>
      {block.heading ? <h2 className={sectionTitleClass}>{block.heading}</h2> : null}
      <ul className={cn(block.heading ? blockGapClass : "", "my-3 space-y-2.5 ps-1 sm:ps-2")}>
        {block.items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 dark:bg-primary" />
            <div className={cn(bodyTextClass, "flex-1 min-w-0")}>
              {renderTextWithLead(item, settings)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StepsBlock({
  block,
  settings,
}: {
  block: Extract<ContentBlock, { type: "steps" }>;
  settings?: PlatformPublicSettings | null;
}) {
  return (
    <section>
      {block.heading ? <h2 className={sectionTitleClass}>{block.heading}</h2> : null}
      <ol className={cn(block.heading ? blockGapClass : "", "my-3 space-y-3 ps-1 sm:ps-2")}>
        {block.items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary mt-0.5">
              {index + 1}
            </span>
            <div className={cn(bodyTextClass, "flex-1 min-w-0")}>
              {renderTextWithLead(item, settings)}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CalloutBlock({ block }: { block: Extract<ContentBlock, { type: "callout" }> }) {
  const Icon = block.tone === "warning" ? TriangleAlert : Info;
  return (
    <Alert variant={block.tone === "warning" ? "warning" : "info"}>
      <Icon className="text-current" />
      <div className="col-start-2 min-w-0 space-y-1">
        {block.heading ? (
          <p className="font-medium leading-tight tracking-tight text-foreground">{block.heading}</p>
        ) : null}
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{block.body}</p>
      </div>
    </Alert>
  );
}

function TableBlock({ block }: { block: Extract<ContentBlock, { type: "table" }> }) {
  return (
    <section>
      {block.heading ? <h2 className={sectionTitleClass}>{block.heading}</h2> : null}
      <LegalTable
        columns={block.columns}
        rows={block.rows}
        className={cn(block.heading ? blockGapClass : "")}
      />
    </section>
  );
}

const VALUE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Users,
  Scale,
  ShieldCheck,
  Lock,
  Heart,
  Target,
  Award,
  Globe,
  Sparkles,
  Clock,
};

function CoreValuesIcon({ name }: { name: string }) {
  const Icon = VALUE_ICON_MAP[name] ?? ShieldCheck;
  return <Icon size={20} />;
}

function CoreValuesBlock({ block }: { block: Extract<ContentBlock, { type: "coreValues" }> }) {
  return (
    <section>
      {block.heading ? <h2 className={sectionTitleClass}>{block.heading}</h2> : null}
      <div className={cn(block.heading ? blockGapClass : "", "grid gap-3 sm:grid-cols-2")}>
        {block.values.map((value) => (
          <div
            key={value.id}
            className="rounded-xl border border-border bg-card p-4 shadow-2xs sm:p-5"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark shadow-2xs dark:bg-white/10 dark:text-white">
              <CoreValuesIcon name={value.icon} />
            </div>
            <h3 className="text-sm font-bold text-foreground sm:text-base break-words">{value.title}</h3>
            <p className={cn(bodyTextClass, "mt-1.5")}>{value.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MilestonesBlock({ block }: { block: Extract<ContentBlock, { type: "milestones" }> }) {
  return (
    <section>
      {block.heading ? <h2 className={sectionTitleClass}>{block.heading}</h2> : null}
      <div className={cn(block.heading ? blockGapClass : "", "grid gap-3 md:grid-cols-2")}>
        {block.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-2xs sm:p-5"
          >
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-accent font-mono text-xs font-bold text-foreground">
                {item.year}
              </span>
              <h3 className="mt-3 text-sm font-bold text-foreground break-words sm:text-base">
                {item.title}
              </h3>
              <p className={cn(bodyTextClass, "mt-1.5")}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function ContactCardBlock({
  settings,
  locale,
}: {
  block: Extract<ContentBlock, { type: "contactCard" }>;
  settings: PlatformPublicSettings | null;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "publicContent" });

  const rows: Array<{ icon: typeof Mail; label: string; href?: string; value: string }> = [];
  if (settings) {
    if (settings.supportEmail) {
      rows.push({ icon: Mail, label: t("contactCard.email"), href: `mailto:${settings.supportEmail}`, value: settings.supportEmail });
    }
    if (settings.hotlinePhone) {
      const digits = settings.hotlinePhone.replace(/[^\d+]/g, "");
      rows.push({ icon: Phone, label: t("contactCard.phone"), href: `tel:${digits}`, value: settings.hotlinePhone });
    }
    if (settings.whatsappNumber) {
      rows.push({
        icon: MessageCircle,
        label: t("contactCard.whatsapp"),
        href: `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, "")}`,
        value: settings.whatsappNumber,
      });
    }
    const address = [settings.officeBuilding, settings.officeStreet, settings.officeDistrict]
      .filter(Boolean)
      .join(", ");
    if (address) rows.push({ icon: MapPin, label: t("contactCard.address"), value: address });
    if (settings.officePoBox) {
      rows.push({ icon: MapPin, label: t("contactCard.poBox"), value: settings.officePoBox });
    }
    if (settings.supportWorkingHours) {
      rows.push({ icon: Clock, label: t("contactCard.hours"), value: settings.supportWorkingHours });
    }
    if (settings.dpoContactEmail) {
      rows.push({ icon: ShieldCheck, label: t("contactCard.dpo"), href: `mailto:${settings.dpoContactEmail}`, value: settings.dpoContactEmail });
    }
  }

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-2xs sm:p-6">
      <p className="font-semibold text-foreground">{t("contactCard.title")}</p>
      <dl className="mt-3 space-y-3">
        {rows.map((row) => {
          const content = (
            <>
              <dt className="sr-only">{row.label}</dt>
              <dd className="flex min-w-0 items-start gap-2.5">
                <row.icon size={14} className="mt-0.5 shrink-0 text-primary dark:text-white" />
                <span className="min-w-0 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  <span className="font-medium text-foreground">{row.label}: </span>
                  <span className="break-all">{row.value}</span>
                </span>
              </dd>
            </>
          );
          return row.href ? (
            <a key={row.label} href={row.href} className="block hover:opacity-80">
              {content}
            </a>
          ) : (
            <div key={row.label}>{content}</div>
          );
        })}
      </dl>
    </section>
  );
}

async function JobsBlock({
  settings,
  locale,
}: {
  block: Extract<ContentBlock, { type: "jobs" }>;
  settings: PlatformPublicSettings | null;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "publicContent" });
  const email = settings?.careersEmail || "support@myjudicial.com";
  const roles = (settings?.careersOpenRoles || []).filter((role) => role.published !== false);

  return (
    <section>
      <h2 className={sectionTitleClass}>{t("jobs.heading")}</h2>
      <div className={cn(blockGapClass, "space-y-3 sm:space-y-4")}>
        {roles.length === 0 ? (
          <p className={bodyTextClass}>
            {t("jobs.empty")}{" "}
            <a
              href={`mailto:${email}`}
              className="font-semibold text-foreground underline decoration-primary underline-offset-2 hover:opacity-80"
            >
              {email}
            </a>
          </p>
        ) : (
          roles.map((role) => {
            const detailGroups = [
              { key: "responsibilities", items: role.responsibilities || [] },
              { key: "requirements", items: role.requirements || [] },
              { key: "niceToHave", items: role.niceToHave || [] },
            ].filter((group) => group.items.length > 0);

            return (
              <div key={role.id} className="rounded-xl border border-border bg-card p-4 shadow-2xs sm:p-5">
                <p className="text-sm font-semibold text-foreground sm:text-base">{role.title}</p>
                {role.department || role.location || role.type ? (
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {[role.department, role.location, role.type].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {role.summary ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {role.summary}
                  </p>
                ) : null}
                {role.description ? (
                  <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {role.description}
                  </p>
                ) : null}
                {detailGroups.length > 0 ? (
                  <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                    {detailGroups.map((group) => (
                      <div key={group.key}>
                        <dt className="text-xs font-semibold text-foreground">{t(`jobs.${group.key}`)}</dt>
                        <ul className="mt-1.5 list-disc ps-4 space-y-1">
                          {group.items.map((item, i) => (
                            <li key={i} className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {role.applicationInstructions ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    <span className="font-semibold text-foreground">{t("jobs.applyInstructions")}: </span>
                    {role.applicationInstructions}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {role.applyUrl && /^https?:\/\//i.test(role.applyUrl) && (
                    <a
                      href={role.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-brand shadow-2xs hover:opacity-90"
                    >
                      {t("jobs.apply")}
                    </a>
                  )}
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(role.title)}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/60"
                  >
                    {t("jobs.emailContact")}
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

async function FaqBlock({
  settings,
  locale,
}: {
  block: Extract<ContentBlock, { type: "faq" }>;
  settings: PlatformPublicSettings | null;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "publicContent" });
  const faqs = settings?.supplementalFaqs || [];

  return (
    <section>
      <h2 className={sectionTitleClass}>{t("faq.heading")}</h2>
      {faqs.length === 0 ? (
        <p className={cn(blockGapClass, bodyTextClass)}>{t("faq.empty")}</p>
      ) : (
        <div className={cn(blockGapClass, "space-y-2.5")}>
          {faqs.map((faq) => (
            <details key={faq.id} className="group rounded-xl border border-border bg-card shadow-2xs">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground sm:px-5 sm:text-base [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">{faq.question}</span>
                <ChevronDown
                  size={16}
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5 sm:text-sm">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function HeroBlock({ block }: { block: Extract<ContentBlock, { type: "hero" }> }) {
  return (
    <section
      className="flex min-h-[240px] flex-col items-start justify-center gap-4 rounded-3xl border border-border bg-card p-6 shadow-2xs sm:min-h-[300px] sm:p-10"
      aria-label={block.title}
    >
      {block.badge ? (
        <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
          {block.badge}
        </span>
      ) : null}
      <h1 className="max-w-2xl text-2xl min-[420px]:text-3xl font-extrabold leading-tight text-foreground sm:text-4xl break-words">
        {block.title}
      </h1>
      {block.subtitle ? (
        <p className="max-w-2xl text-sm min-[360px]:text-base leading-relaxed text-muted-foreground sm:text-lg break-words">
          {block.subtitle}
        </p>
      ) : null}
      {block.ctaLabel && block.ctaHref ? (
        <a
          href={block.ctaHref}
          className="inline-flex items-center justify-center rounded-lg bg-brand-dark px-5 py-2.5 text-sm font-semibold text-on-brand"
        >
          {block.ctaLabel}
        </a>
      ) : null}
    </section>
  );
}

function StatsBandBlock({ block }: { block: Extract<ContentBlock, { type: "statsBand" }> }) {
  return (
    <section className="rounded-3xl bg-muted p-5 sm:p-8">
      {block.heading ? <p className="text-sm font-semibold text-foreground sm:text-base">{block.heading}</p> : null}
      <dl
        className={cn(
          block.heading ? "mt-5" : "",
          "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4"
        )}
      >
        {block.stats.map((stat) => (
          <div key={stat.id} className="min-w-0">
            <dd className="text-2xl font-extrabold text-foreground sm:text-3xl">{stat.value}</dd>
            <dt className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CtaBandBlock({ block }: { block: Extract<ContentBlock, { type: "ctaBand" }> }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-2xs sm:p-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {block.heading ? (
            <h2 className="text-lg min-[360px]:text-xl font-bold text-foreground sm:text-2xl break-words">
              {block.heading}
            </h2>
          ) : null}
          {block.body ? (
            <p className="max-w-2xl text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words">
              {block.body}
            </p>
          ) : null}
        </div>
        {block.ctaLabel && block.ctaHref ? (
          <a
            href={block.ctaHref}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-dark px-5 py-2.5 text-sm font-semibold text-on-brand"
          >
            {block.ctaLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function ImageBlock({ block }: { block: Extract<ContentBlock, { type: "image" }> }) {
  return (
    <section>
      <img
        src={block.src}
        alt={block.alt}
        loading="lazy"
        className="mx-auto max-h-[560px] w-auto max-w-full rounded-2xl border border-border shadow-2xs"
      />
      {block.caption ? (
        <p className="mt-2.5 text-center text-xs leading-relaxed text-muted-foreground">{block.caption}</p>
      ) : null}
    </section>
  );
}

export function ContentBlocks({
  blocks,
  settings,
  locale,
  anchorIdsByBlockId,
}: {
  blocks: ContentBlock[];
  settings: PlatformPublicSettings | null;
  locale: string;
  anchorIdsByBlockId?: Record<string, string>;
}) {
  return (
    <div className={sectionClass}>
      {blocks.map((block) => {
        let element: ReactNode = null;
        switch (block.type) {
          case "prose":
            element = <ProseBlock block={block} settings={settings} />;
            break;
          case "bullets":
            element = <BulletsBlock block={block} settings={settings} />;
            break;
          case "steps":
            element = <StepsBlock block={block} settings={settings} />;
            break;
          case "callout":
            element = <CalloutBlock block={block} />;
            break;
          case "table":
            element = <TableBlock block={block} />;
            break;
          case "coreValues":
            element = <CoreValuesBlock block={block} />;
            break;
          case "milestones":
            element = <MilestonesBlock block={block} />;
            break;
          case "contactCard":
            element = <ContactCardBlock block={block} settings={settings} locale={locale} />;
            break;
          case "jobs":
            element = <JobsBlock block={block} settings={settings} locale={locale} />;
            break;
          case "faq":
            element = <FaqBlock block={block} settings={settings} locale={locale} />;
            break;
          case "hero":
            element = <HeroBlock block={block} />;
            break;
          case "statsBand":
            element = <StatsBandBlock block={block} />;
            break;
          case "ctaBand":
            element = <CtaBandBlock block={block} />;
            break;
          case "image":
            element = <ImageBlock block={block} />;
            break;
          default:
            element = null;
        }
        const anchorId = anchorIdsByBlockId?.[block.id];
        return (
          <Fragment key={block.id}>
            {anchorId ? (
              <div id={anchorId} className="scroll-mt-[calc(var(--header-offset,4rem)+1rem)]">
                {element}
              </div>
            ) : (
              element
            )}
          </Fragment>
        );
      })}
    </div>
  );
}