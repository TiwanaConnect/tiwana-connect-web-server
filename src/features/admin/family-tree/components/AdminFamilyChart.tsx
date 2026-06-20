"use client";

import { useEffect, useRef, useState } from "react";

import type { FamilyChartPerson } from "../types";

export type AdminFamilyChartControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  focusMember: (memberId: string) => void;
};

export function AdminFamilyChart({
  persons,
  focusMemberId,
  selectedMemberId,
  onSelectMember,
  onControlsReady
}: {
  persons: FamilyChartPerson[];
  focusMemberId: string | null;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  onControlsReady: (controls: AdminFamilyChartControls | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    container.innerHTML = "";
    setError(null);
    onControlsReady(null);

    if (persons.length === 0) {
      return;
    }

    async function mountChart() {
      try {
        const f3 = await import("family-chart");
        if (cancelled || !container) return;

        const chart = f3
          .createChart(container, persons as never)
          .setOrientationVertical()
          .setCardXSpacing(260)
          .setCardYSpacing(150)
          .setShowSiblingsOfMain(true)
          .setSingleParentEmptyCard(false)
          .setTransitionTime(500)
          .setDuplicateBranchToggle(true);

        const card = chart
          .setCardHtml()
          .setCardDim({ w: 220, h: 118, text_x: 76, text_y: 22, img_w: 52, img_h: 52, img_x: 12, img_y: 18 })
          .setCardInnerHtmlCreator((treeDatum: unknown) => createCardHtml(treeDatum, selectedMemberId))
          .setOnCardClick((_event: MouseEvent, treeDatum: { data?: { id?: string } }) => {
            const memberId = treeDatum.data?.id;
            if (!memberId) return;
            onSelectMember(memberId);
            chart.updateMainId(memberId).updateTree({ initial: false, tree_position: "main_to_middle" });
          });

        chart
          .updateMainId(focusMemberId ?? persons[0]?.id)
          .updateTree({ initial: true, tree_position: "main_to_middle", scale: 0.95 });

        onControlsReady({
          zoomIn: () => f3.handlers.manualZoom({ amount: 0.22, svg: chart.svg, transition_time: 250 }),
          zoomOut: () => f3.handlers.manualZoom({ amount: -0.22, svg: chart.svg, transition_time: 250 }),
          reset: () => chart.updateTree({ initial: false, tree_position: "main_to_middle", scale: 0.95, transition_time: 350 }),
          focusMember: (memberId: string) => {
            chart.updateMainId(memberId).updateTree({ initial: false, tree_position: "main_to_middle" });
          }
        });
      } catch (chartError) {
        console.error(chartError);
        if (!cancelled) {
          setError("Unable to render the family chart. Check relationship warnings above and try refreshing.");
        }
      }
    }

    void mountChart();

    return () => {
      cancelled = true;
      onControlsReady(null);
      container.innerHTML = "";
    };
  }, [focusMemberId, onControlsReady, onSelectMember, persons, selectedMemberId]);

  if (persons.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
        No members match the current tree filters.
      </div>
    );
  }

  return (
    <section id="print-tree-area" className="overflow-hidden rounded-lg border bg-card">
      {error ? <div className="border-b bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div
        ref={containerRef}
        className="admin-family-chart f3 f3-cont w-full bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px]"
      />
    </section>
  );
}

function createCardHtml(treeDatum: unknown, selectedMemberId: string | null) {
  const datum = treeDatum as {
    data?: {
      id?: string;
      data?: FamilyChartPerson["data"];
    };
  };
  const id = datum.data?.id ?? "";
  const data = datum.data?.data;
  const member = data?.member;
  const fullName = data?.fullName ?? "Unnamed member";
  const subtitle = member?.alias || member?.branchLabel || member?.city || "Family member";
  const selectedClass = selectedMemberId === id ? " is-selected" : "";

  return `
    <div class="card-inner tc-family-card${selectedClass}">
      <div class="tc-family-avatar">${escapeHtml(member?.initials ?? data?.initials ?? "?")}</div>
      <div class="tc-family-card-body">
        <div class="tc-family-card-name">${escapeHtml(fullName)}</div>
        <div class="tc-family-card-subtitle">${escapeHtml(subtitle)}</div>
        <div class="tc-family-card-meta">
          <span>${escapeHtml(member?.gender ?? "")}</span>
          <span>${escapeHtml(member?.status ?? "")}</span>
          ${member?.visibility === "HIDDEN" ? "<span>Private</span>" : ""}
          ${member?.isFamilyHead ? "<span>Head</span>" : ""}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
