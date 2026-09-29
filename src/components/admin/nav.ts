import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = { href: string; label: string; permission: Permission; group: string };

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", permission: "dashboard.view", group: "Overview" },
  { href: "/admin/leads", label: "Leads", permission: "leads.view", group: "Overview" },
  { href: "/admin/solutions", label: "Solutions", permission: "content.edit", group: "Content" },
  { href: "/admin/packages", label: "Packages", permission: "content.edit", group: "Content" },
  { href: "/admin/categories", label: "Categories", permission: "content.edit", group: "Content" },
  { href: "/admin/media", label: "Media library", permission: "media.manage", group: "Content" },
  { href: "/admin/projects", label: "Projects", permission: "content.edit", group: "Prepared sections" },
  { href: "/admin/partners", label: "Partners", permission: "content.edit", group: "Prepared sections" },
  { href: "/admin/articles", label: "Articles", permission: "content.edit", group: "Prepared sections" },
  { href: "/admin/settings", label: "Settings", permission: "settings.manage", group: "System" },
  { href: "/admin/users", label: "Users", permission: "users.manage", group: "System" },
  { href: "/admin/activity", label: "Activity log", permission: "audit.view", group: "System" },
];
