"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadAttachment, deleteAttachment } from "@/lib/actions/expense-attachments";

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExpenseAttachments({
  expenseId,
  initialAttachments,
}: {
  expenseId: string;
  initialAttachments: Attachment[];
}) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadFile(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadAttachment(expenseId, fd);
      if (res.ok) {
        setAttachments((prev) => [
          ...prev,
          {
            id: res.data.id,
            fileName: file.name,
            fileUrl: res.data.url,
            fileType: file.type,
            fileSize: file.size,
          },
        ]);
        toast.success("Attachment uploaded");
      } else {
        toast.error(res.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(uploadFile);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  }

  function onRemove(id: string) {
    startTransition(async () => {
      const res = await deleteAttachment(id);
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
        toast.success("Attachment deleted");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-input hover:border-primary/50 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={onFileChange}
        />
        {pending ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="size-5 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Drag &amp; drop files here or <span className="font-medium text-foreground">browse</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPEG, WebP, PDF, XLSX, CSV — up to 10MB each
        </p>
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium hover:underline"
                >
                  {a.fileName}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(a.fileSize)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onRemove(a.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
