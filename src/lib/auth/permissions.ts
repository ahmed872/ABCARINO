import type { UserRole } from "@/lib/db/schema";

export const PERMISSIONS = [
  "dashboard.view",
  "content.edit",
  "content.delete",
  "media.manage",
  "leads.view",
  "leads.manage",
  "settings.manage",
  "users.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role → permission map. Start small (Super Admin is enough on day one) but keep
 * the seams so Sales / Operations / Editors can be onboarded without a rewrite.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  content_manager: [
    "dashboard.view",
    "content.edit",
    "content.delete",
    "media.manage",
    "leads.view",
    "audit.view",
  ],
  editor: ["dashboard.view", "content.edit", "media.manage"],
  sales: ["dashboard.view", "leads.view", "leads.manage"],
  operations: ["dashboard.view", "leads.view", "leads.manage", "media.manage"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  content_manager: "Content Manager",
  editor: "Editor",
  sales: "Sales",
  operations: "Operations",
};

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
