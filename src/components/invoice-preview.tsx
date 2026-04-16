"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import { renderTemplate, type InvoicePdfData } from "@/lib/pdf/templates";

type TemplateId = "CLASSIC" | "MODERN" | "MINIMAL";

export function InvoicePreview({
  data,
  template,
}: {
  data: InvoicePdfData;
  template: TemplateId;
}) {
  // Debounce: only regenerate the PDF ~300ms after the user stops typing.
  // Keeps the iframe mounted so what you see doesn't flash on each keystroke.
  const [debouncedData, setDebouncedData] = useState(data);
  const [debouncedTemplate, setDebouncedTemplate] = useState(template);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedData(data);
      setDebouncedTemplate(template);
    }, 300);
    return () => clearTimeout(t);
  }, [data, template]);

  const doc = useMemo(
    () => renderTemplate(debouncedTemplate, debouncedData),
    [debouncedData, debouncedTemplate],
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastUrlRef = useRef<string | null>(null);

  return (
    <div className="relative">
      <BlobProvider document={doc}>
        {({ url, loading }) => {
          // Swap the iframe src only when the new blob URL is ready.
          if (url && url !== lastUrlRef.current) {
            lastUrlRef.current = url;
            if (iframeRef.current) iframeRef.current.src = url;
          }
          return (
            <>
              <iframe
                ref={iframeRef}
                title="Invoice preview"
                className="block w-full border-0"
                style={{ height: 720 }}
              />
              {loading && !lastUrlRef.current && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/30 text-sm text-muted-foreground"
                  style={{ height: 720 }}
                >
                  Preparing preview…
                </div>
              )}
            </>
          );
        }}
      </BlobProvider>
    </div>
  );
}
