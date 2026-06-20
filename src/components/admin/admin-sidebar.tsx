"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="border-b px-6 py-5">
        <p className="text-sm font-medium text-primary">Tiwana Connect</p>
        <p className="mt-1 text-xs text-muted-foreground">Admin Console</p>
      </div>
      <nav className="space-y-1 p-3">
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
