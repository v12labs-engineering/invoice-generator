"use client";

import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Stage = { key: string; label: string };

export function DealStageSelect({
  name,
  defaultValue,
  stages,
}: {
  name: string;
  defaultValue: string;
  stages: readonly Stage[];
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input type="hidden" name={name} defaultValue={defaultValue} ref={ref} />
      <Select
        defaultValue={defaultValue}
        onValueChange={(v) => {
          if (!v || !ref.current) return;
          ref.current.value = v;
          ref.current.form?.requestSubmit();
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stages.map((s) => (
            <SelectItem key={s.key} value={s.key}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
