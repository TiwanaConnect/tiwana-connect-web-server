import {
  CalendarDays,
  Landmark,
  LayoutDashboard,
  Bell,
  Network,
  Settings,
  Tags,
  Users,
  Vote
} from "lucide-react";

export const adminNavigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/family-tree", label: "Family Tree", icon: Network },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/funds", label: "Funds", icon: Landmark },
  { href: "/admin/directory", label: "Directory", icon: Tags },
  { href: "/admin/elections", label: "Elections", icon: Vote },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings }
] as const;
