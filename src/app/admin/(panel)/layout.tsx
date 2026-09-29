import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { ADMIN_NAV } from "@/components/admin/nav";
import { can, ROLE_LABELS } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { logout } from "../login/actions";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();
  const items = ADMIN_NAV.filter((i) => can(user.role, i.permission));
  return (
    <div className="min-h-dvh">
      <Sidebar items={items} user={{ name: user.name, email: user.email, roleLabel: ROLE_LABELS[user.role] }} logoutAction={logout} />
      <div className="lg:ps-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
