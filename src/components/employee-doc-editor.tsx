"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileDown, RotateCcw, Save } from "lucide-react";
import type { DocType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  generateEmployeeDoc,
  saveTemplateAsDefault,
  resetTemplateToDefault,
  buildPrefilledDoc,
} from "@/lib/actions/employee-docs";

type Props = {
  employeeId: string;
  docType: DocType;
  initialTitle: string;
  initialBody: string;
  isCustomTemplate: boolean;
  business: { name: string; addressLines: string[]; email: string; logoUrl: string | null };
};

export function EmployeeDocEditor({
  employeeId,
  docType,
  initialTitle,
  initialBody,
  isCustomTemplate,
  business,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [busy, setBusy] = useState<null | "generate" | "save" | "reset">(null);
  const [customTemplate, setCustomTemplate] = useState(isCustomTemplate);

  async function onGenerate() {
    setBusy("generate");
    const res = await generateEmployeeDoc({ employeeId, docType, title, body });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Document generated");
    window.open(res.data.url, "_blank");
    router.push(`/employees/${employeeId}`);
  }

  async function onSaveTemplate() {
    setBusy("save");
    const res = await saveTemplateAsDefault(docType, { title, body });
    setBusy(null);
    if (res.ok) {
      toast.success("Saved as default for this doc type");
      setCustomTemplate(true);
    } else {
      toast.error(res.error);
    }
  }

  async function onReset() {
    if (!confirm("Reset to default template? Your edits here will be replaced with the stock template.")) return;
    setBusy("reset");
    if (customTemplate) {
      const r = await resetTemplateToDefault(docType);
      if (!r.ok) {
        toast.error(r.error);
        setBusy(null);
        return;
      }
    }
    const prefilled = await buildPrefilledDoc(employeeId, docType);
    setBusy(null);
    if (prefilled.ok) {
      setTitle(prefilled.data.title);
      setBody(prefilled.data.prefilledBody);
      setCustomTemplate(false);
      toast.success("Reset to default");
    } else {
      toast.error(prefilled.error);
    }
  }

  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
          <CardDescription>
            Variables have been filled in. Review and edit before generating.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={28}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onGenerate} disabled={busy !== null}>
              <FileDown className="size-4" />
              {busy === "generate" ? "Generating..." : "Generate PDF"}
            </Button>
            <Button
              onClick={onSaveTemplate}
              variant="outline"
              disabled={busy !== null}
              title="Save your edits as the new default for this document type"
            >
              <Save className="size-4" />
              {busy === "save" ? "Saving..." : "Save as default"}
            </Button>
            <Button
              onClick={onReset}
              variant="ghost"
              disabled={busy !== null}
              title="Discard edits and reload the stock template"
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
          {customTemplate && (
            <p className="text-xs text-muted-foreground">
              Using your saved template for this document type.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="sticky top-6 self-start">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Approximate layout of the final PDF.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t border-b">
              <div className="h-1.5 bg-[#2563EB]" />
              <div className="h-0.5 bg-[#7C3AED]" />
            </div>
            <div className="space-y-6 p-8 text-[11px] leading-relaxed">
              <div className="flex items-start justify-between">
                <div>
                  {business.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={business.logoUrl}
                      alt=""
                      className="mb-2 size-12 object-contain"
                    />
                  )}
                  <div className="text-sm font-bold">{business.name}</div>
                  {business.addressLines.map((l, i) => (
                    <div key={i} className="text-muted-foreground text-[10px]">
                      {l}
                    </div>
                  ))}
                  <div className="text-muted-foreground text-[10px]">{business.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] tracking-[2px] text-muted-foreground">DOCUMENT</div>
                  <div className="text-lg font-bold text-[#2563EB]">
                    {title.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="space-y-3 whitespace-pre-wrap">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
