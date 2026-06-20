"use client";

export function LocalDateTime({
  value,
  empty = "-"
}: {
  value: string | Date | null | undefined;
  empty?: string;
}) {
  const date = value ? new Date(value) : null;
  const label = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : empty;

  return <span suppressHydrationWarning>{label}</span>;
}

export function LocalDateTimeRange({
  start,
  end,
  empty = "-"
}: {
  start: string | Date | null | undefined;
  end: string | Date | null | undefined;
  empty?: string;
}) {
  return (
    <>
      <LocalDateTime value={start} empty={empty} /> to <LocalDateTime value={end} empty={empty} />
    </>
  );
}
