"use client";

import { ChevronDown, ChevronUp, Maximize2, RefreshCcw, Search, ZoomIn, ZoomOut } from "lucide-react";

import type { AdminFamilyTreeMember } from "../types";

type FamilyChartToolbarProps = {
  search: string;
  searchResults: AdminFamilyTreeMember[];
  maxLevels: number | "all";
  includeDeactivated: boolean;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSelectMember: (memberId: string) => void;
  onMaxLevelsChange: (value: number | "all") => void;
  onIncludeDeactivatedChange: (value: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRefresh: () => void;
};

export function FamilyChartToolbar({
  search,
  searchResults,
  maxLevels,
  includeDeactivated,
  loading,
  onSearchChange,
  onSelectMember,
  onMaxLevelsChange,
  onIncludeDeactivatedChange,
  onExpandAll,
  onCollapseAll,
  onResetView,
  onZoomIn,
  onZoomOut,
  onRefresh
}: FamilyChartToolbarProps) {
  return (
    <div className="no-print rounded-lg border bg-card p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search member by name, ID, phone, city, branch"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
          />
          {search && searchResults.length > 0 ? (
            <div className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-md border bg-card shadow-lg">
              {searchResults.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSelectMember(member.id)}
                  className="block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                >
                  <span className="font-medium">{member.fullName ?? member.alias ?? `Member ${member.id}`}</span>
                  <span className="block text-xs text-muted-foreground">
                    ID {member.id} · {member.gender} · {member.city ?? member.branchLabel ?? "No location"}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <select
          value={String(maxLevels)}
          onChange={(event) => {
            const value = event.target.value;
            onMaxLevelsChange(value === "all" ? "all" : Number(value));
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All generations</option>
          <option value="1">1 generation</option>
          <option value="2">2 generations</option>
          <option value="3">3 generations</option>
          <option value="4">4 generations</option>
          <option value="5">5 generations</option>
        </select>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onZoomIn} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <ZoomIn className="h-4 w-4" /> Zoom in
          </button>
          <button type="button" onClick={onZoomOut} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <ZoomOut className="h-4 w-4" /> Zoom out
          </button>
          <button type="button" onClick={onResetView} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Maximize2 className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onExpandAll} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <ChevronDown className="h-4 w-4" /> Expand all
        </button>
        <button type="button" onClick={onCollapseAll} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <ChevronUp className="h-4 w-4" /> Collapse branches
        </button>
        <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeDeactivated}
            onChange={(event) => onIncludeDeactivatedChange(event.target.checked)}
            className="h-4 w-4 rounded border"
          />
          Include deleted or blocked members
        </label>
      </div>
    </div>
  );
}
