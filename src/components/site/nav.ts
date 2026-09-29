import type { Dictionary } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings-schema";

export type NavItem = { key: string; label: string; path: string };

/** Navigation stays short; prepared sections appear only once activated in Settings. */
export function buildNav(t: Dictionary, settings: SiteSettings): NavItem[] {
  const s = settings.sections;
  return [
    { key: "solutions", label: t.nav.solutions, path: "/solutions" },
    ...(s.showPackages ? [{ key: "packages", label: t.nav.packages, path: "/packages" }] : []),
    ...(s.showProjects ? [{ key: "projects", label: t.nav.projects, path: "/projects" }] : []),
    { key: "about", label: t.nav.about, path: "/about" },
    ...(s.showInsights ? [{ key: "insights", label: t.nav.insights, path: "/insights" }] : []),
    ...(s.showPartners ? [{ key: "partners", label: t.nav.partners, path: "/partners" }] : []),
    { key: "contact", label: t.nav.contact, path: "/contact" },
  ];
}
