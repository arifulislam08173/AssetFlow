"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FilterOption = { value: string; label: string };
export type FilterChoice = { key: string; label: string; options: FilterOption[] };
export type FilterState = Record<string, string | number | boolean | null | undefined>;

/** Only renders controls. All filter values are sent to backend queries. */
export function BackendFilters({ filters, onChange, dateLabel = "Date", choices = [], section = "all", showReset = true }: {
  filters: FilterState;
  onChange: (updater: (old: FilterState) => FilterState) => void;
  dateLabel?: string;
  choices?: FilterChoice[];
  section?: "all" | "choices" | "dates";
  showReset?: boolean;
}) {
  const update = (key: string, value: string) => onChange((old) => ({ ...old, [key]: value || undefined }));
  const active = Object.values(filters).some((value) => value !== undefined && value !== "" && value !== null);
  const hasChoices = section === "all" || section === "choices";
  const hasDates = section === "all" || section === "dates";
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-nowrap">
      {hasChoices && choices.map((choice) => (
        <select key={choice.key} aria-label={choice.label} value={String(filters[choice.key] || "")}
          onChange={(event) => update(choice.key, event.target.value)}
          className="h-10 min-w-36 max-w-52 rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary">
          <option value="">All {choice.label}</option>
          {choice.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ))}
      {hasDates && <>
        <span className="mr-1 whitespace-nowrap text-sm font-medium text-foreground">{dateLabel}</span>
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          From
          <Input type="date" title={`${dateLabel} from`} aria-label={`${dateLabel} from`}
            value={String(filters.dateFrom || "")} max={String(filters.dateTo || "") || undefined}
            onChange={(event) => update("dateFrom", event.target.value)}
            className="h-10 w-40 rounded-xl px-3 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          To
          <Input type="date" title={`${dateLabel} to`} aria-label={`${dateLabel} to`}
            value={String(filters.dateTo || "")} min={String(filters.dateFrom || "") || undefined}
            onChange={(event) => update("dateTo", event.target.value)}
            className="h-10 w-40 rounded-xl px-3 text-sm" />
        </label>
      </>}
      {showReset && active && <Button size="sm" variant="outline" onClick={() => onChange(() => ({}))}
        className="h-10 gap-1 rounded-xl text-xs"><RotateCcw className="size-3.5"/> Reset</Button>}
    </div>
  );
}
