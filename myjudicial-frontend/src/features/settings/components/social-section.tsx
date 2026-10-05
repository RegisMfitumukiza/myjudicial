"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import { DEFAULT_SOCIAL, type SettingsData, type SocialLinks } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function SocialMediaSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState<SocialLinks>({
    ...DEFAULT_SOCIAL,
    ...settings.socialLinks,
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const set = (key: keyof SocialLinks, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await saveSettingsSection({ socialLinks: draft });
      setSaved({ ...draft });
      onSaved(updated);
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("settingsUnavailable"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSection
      icon={Share2}
      title={t("socialLinksTitle")}
      description={t("socialLinksDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="social-x" className="text-xs font-semibold">
            X (Twitter)
          </Label>
          <Input
            id="social-x"
            placeholder="https://x.com/myjudicial"
            value={draft.x ?? ""}
            onChange={(e) => set("x", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="social-linkedin" className="text-xs font-semibold">
            LinkedIn
          </Label>
          <Input
            id="social-linkedin"
            placeholder="https://linkedin.com/company/myjudicial"
            value={draft.linkedin ?? ""}
            onChange={(e) => set("linkedin", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="social-facebook" className="text-xs font-semibold">
            Facebook
          </Label>
          <Input
            id="social-facebook"
            placeholder="https://facebook.com/myjudicial"
            value={draft.facebook ?? ""}
            onChange={(e) => set("facebook", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="social-instagram" className="text-xs font-semibold">
            Instagram
          </Label>
          <Input
            id="social-instagram"
            placeholder="https://instagram.com/myjudicial"
            value={draft.instagram ?? ""}
            onChange={(e) => set("instagram", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="social-youtube" className="text-xs font-semibold">
            YouTube
          </Label>
          <Input
            id="social-youtube"
            placeholder="https://youtube.com/@myjudicial"
            value={draft.youtube ?? ""}
            onChange={(e) => set("youtube", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="social-whatsapp" className="text-xs font-semibold">
            WhatsApp Link
          </Label>
          <Input
            id="social-whatsapp"
            placeholder="https://wa.me/250788312456"
            value={draft.whatsapp ?? ""}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </div>
      </div>
    </SettingsSection>
  );
}