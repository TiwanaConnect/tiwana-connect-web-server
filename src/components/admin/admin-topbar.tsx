export function AdminTopbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div>
        <p className="text-sm font-medium">Admin Panel</p>
        <p className="text-xs text-muted-foreground">
          Foundation ready for Phase 1 modules
        </p>
      </div>
      <div className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
        Phase 0
      </div>
    </header>
  );
}
