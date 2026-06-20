"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getAdminFamilyTreeChart } from "../api/getAdminFamilyTreeChart";
import type { AdminFamilyTreeMember, FamilyChartPerson } from "../types";
import { toFamilyChartData } from "../utils/familyChartAdapter";
import { applyCollapsedBranches, filterFamilyGraphByLevels, searchFamilyMembers } from "../utils/familyTreeFiltering";
import { AdminFamilyChart, type AdminFamilyChartControls } from "./AdminFamilyChart";
import { FamilyChartToolbar } from "./FamilyChartToolbar";
import { FamilyMemberDetailsPanel } from "./FamilyMemberDetailsPanel";
import { FamilyTreeStats } from "./FamilyTreeStats";

export function AdminFamilyTreeClient() {
  const [includeDeactivated, setIncludeDeactivated] = useState(false);
  const [search, setSearch] = useState("");
  const [focusMemberId, setFocusMemberId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [maxLevels, setMaxLevels] = useState<number | "all">("all");
  const [collapsedMemberIds, setCollapsedMemberIds] = useState<Set<string>>(new Set());
  const [chartControls, setChartControls] = useState<AdminFamilyChartControls | null>(null);

  const query = useQuery({
    queryKey: ["admin", "family-tree", "chart", includeDeactivated],
    queryFn: () => getAdminFamilyTreeChart(includeDeactivated)
  });

  const data = query.data;
  const defaultFocusId = data?.members.find((member) => member.isFamilyHead)?.id ?? data?.members[0]?.id ?? null;
  const effectiveFocusMemberId = focusMemberId ?? defaultFocusId;

  const memberById = useMemo(
    () => new Map(data?.members.map((member) => [member.id, member]) ?? []),
    [data?.members]
  );

  const filteredGraph = useMemo(() => {
    if (!data) return { members: [], relationships: [] };
    return filterFamilyGraphByLevels({
      members: data.members,
      relationships: data.relationships,
      focusMemberId: effectiveFocusMemberId,
      maxLevels
    });
  }, [data, effectiveFocusMemberId, maxLevels]);

  const chartGraph = useMemo(() => toFamilyChartData(filteredGraph), [filteredGraph]);
  const persons = useMemo(
    () =>
      applyCollapsedBranches({
        persons: chartGraph.persons,
        focusMemberId: effectiveFocusMemberId,
        collapsedMemberIds
      }),
    [chartGraph.persons, collapsedMemberIds, effectiveFocusMemberId]
  );
  const personById = useMemo(() => new Map(chartGraph.persons.map((person) => [person.id, person])), [chartGraph.persons]);
  const selectedMember = selectedMemberId ? memberById.get(selectedMemberId) ?? null : null;
  const selectedPerson = selectedMemberId ? personById.get(selectedMemberId) ?? null : null;
  const searchResults = useMemo(() => searchFamilyMembers(data?.members ?? [], search), [data?.members, search]);
  const warnings = useMemo(() => [...(data?.warnings ?? []), ...chartGraph.warnings], [chartGraph.warnings, data?.warnings]);

  const selectMember = useCallback(
    (memberId: string) => {
      setSelectedMemberId(memberId);
      setFocusMemberId(memberId);
      setSearch("");
      chartControls?.focusMember(memberId);
    },
    [chartControls]
  );

  const onChartSelectMember = useCallback((memberId: string) => {
    setSelectedMemberId(memberId);
    setFocusMemberId(memberId);
  }, []);

  function collapseAll() {
    const memberIdsWithChildren = new Set(
      chartGraph.persons.filter((person) => person.rels.children.length > 0).map((person) => person.id)
    );
    setCollapsedMemberIds(memberIdsWithChildren);
  }

  function resetView() {
    setMaxLevels("all");
    setCollapsedMemberIds(new Set());
    if (defaultFocusId) {
      setFocusMemberId(defaultFocusId);
      setSelectedMemberId(defaultFocusId);
    }
    chartControls?.reset();
  }

  if (query.isLoading) {
    return <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">Loading family chart...</div>;
  }

  if (query.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        Unable to load the family chart. Please check your admin session and try again.
      </div>
    );
  }

  if (!data || data.members.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        No members are available yet. Create members and relationships to start building the chart.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FamilyTreeStats stats={data.stats} />
      {warnings.length > 0 ? <WarningBanner warnings={warnings.slice(0, 5)} totalWarnings={warnings.length} /> : null}
      <FamilyChartToolbar
        search={search}
        searchResults={searchResults}
        maxLevels={maxLevels}
        includeDeactivated={includeDeactivated}
        loading={query.isFetching}
        onSearchChange={setSearch}
        onSelectMember={selectMember}
        onMaxLevelsChange={(value) => {
          setMaxLevels(value);
          setCollapsedMemberIds(new Set());
        }}
        onIncludeDeactivatedChange={(value) => {
          setIncludeDeactivated(value);
          setFocusMemberId(null);
          setSelectedMemberId(null);
          setCollapsedMemberIds(new Set());
        }}
        onExpandAll={() => setCollapsedMemberIds(new Set())}
        onCollapseAll={collapseAll}
        onResetView={resetView}
        onZoomIn={() => chartControls?.zoomIn()}
        onZoomOut={() => chartControls?.zoomOut()}
        onRefresh={() => query.refetch()}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminFamilyChart
          persons={persons}
          focusMemberId={effectiveFocusMemberId}
          selectedMemberId={selectedMemberId}
          onSelectMember={onChartSelectMember}
          onControlsReady={setChartControls}
        />
        <FamilyMemberDetailsPanel
          member={selectedMember}
          person={selectedPerson}
          memberById={memberById as Map<string, AdminFamilyTreeMember>}
          onClose={() => setSelectedMemberId(null)}
          onFocusHere={() => selectedMemberId && selectMember(selectedMemberId)}
          onShowCloseFamily={() => {
            if (!selectedMemberId) return;
            setFocusMemberId(selectedMemberId);
            setMaxLevels(2);
            setCollapsedMemberIds(new Set());
          }}
          onShowAllGenerations={() => {
            if (!selectedMemberId) return;
            setFocusMemberId(selectedMemberId);
            setMaxLevels("all");
            setCollapsedMemberIds(new Set());
          }}
        />
      </div>
    </div>
  );
}

function WarningBanner({
  warnings,
  totalWarnings
}: {
  warnings: Array<{ code: string; message: string; relationshipId?: string; memberId?: string }>;
  totalWarnings: number;
}) {
  return (
    <div className="no-print rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Some relationship records need attention.</p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${warning.relationshipId ?? warning.memberId ?? index}`}>
                {warning.message}
                {warning.relationshipId ? <span className="text-amber-700"> Relationship ID: {warning.relationshipId}</span> : null}
              </li>
            ))}
          </ul>
          {totalWarnings > warnings.length ? (
            <p className="mt-2 text-amber-700">{totalWarnings - warnings.length} more warning(s) hidden.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
