"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AiFileUploadProps = {
  files: File[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  disabled?: boolean;
};

export function AiFileUpload({ files, onFilesAdd, onFileRemove, disabled }: AiFileUploadProps) {
  const t = useTranslations("ai.files");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      const dropped = Array.from(e.dataTransfer.files).slice(0, 5);
      onFilesAdd(dropped);
    },
    [disabled, onFilesAdd]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []).slice(0, 5);
      onFilesAdd(selected);
      e.target.value = "";
    },
    [onFilesAdd]
  );

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 transition-colors",
          !disabled && "hover:border-brand-dark/50 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{t("dropHere")}</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={handleSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
            >
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onFileRemove(i)}
                className="text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
