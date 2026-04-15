"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadLogo, removeLogo } from "@/lib/actions/logo";

export function LogoUpload({
  initialUrl,
  onChange,
}: {
  initialUrl: string | null;
  onChange?: (url: string | null) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(file: File) {
    const fd = new FormData();
    fd.set("logo", file);
    startTransition(async () => {
      const res = await uploadLogo(fd);
      if (res.ok) {
        setUrl(res.data.url);
        onChange?.(res.data.url);
        toast.success("Logo uploaded");
      } else {
        toast.error(res.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onRemove() {
    startTransition(async () => {
      const res = await removeLogo();
      if (res.ok) {
        setUrl(null);
        onChange?.(null);
        toast.success("Logo removed");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {url ? (
          <Image
            src={url}
            alt="Company logo"
            width={80}
            height={80}
            className="size-full object-contain"
            unoptimized
          />
        ) : (
          <ImageUp className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="logo-input" className="text-sm font-medium">
            Company logo
          </Label>
          <p className="text-xs text-muted-foreground">
            Shown on every invoice PDF. PNG, JPEG, WebP, or SVG, up to 2MB.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="logo-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {url ? "Replace" : "Upload logo"}
          </Button>
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
