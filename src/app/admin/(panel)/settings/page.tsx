import type { Metadata } from "next";
import { BilingualField, CheckboxField, EntityForm, Section, SelectField, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaField";
import { PageHeader } from "@/components/admin/ui";
import { mediaSummaries } from "@/lib/admin/data";
import { requirePageUser } from "@/lib/auth/session";
import { querySettings } from "@/lib/content/queries";
import { whatsappLink } from "@/lib/utils";
import { saveSettings } from "./actions";

export const metadata: Metadata = { title: "Settings" };

const NAV = [
  ["general", "Company"],
  ["contact", "Contact & WhatsApp"],
  ["cta", "Calls to action"],
  ["pages", "Home & About copy"],
  ["sections", "Sections"],
  ["seo", "SEO"],
  ["social", "Social"],
  ["localization", "Language"],
  ["footer", "Footer"],
  ["maintenance", "Maintenance"],
] as const;

export default async function SettingsPage() {
  await requirePageUser("settings.manage");
  const s = await querySettings();
  const media = await mediaSummaries([s.general.logoMediaId, s.general.faviconMediaId, s.seo.ogImageMediaId]);
  const pick = (id: string) => (id ? (media.get(id) ?? null) : null);
  const waTest = whatsappLink(s.contact.whatsappNumber, s.contact.whatsappMessageEn);

  return (
    <>
      <PageHeader title="Settings" description="Company details, contact channels, visibility and SEO. Every change is applied to the website immediately." />
      <nav className="mb-8 flex flex-wrap gap-1.5" aria-label="Settings sections">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-ink/10 hover:ring-ink">
            {label}
          </a>
        ))}
      </nav>
      <div className="space-y-10">
        <div id="general" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "general")}>
            <Section title="Company" description="The Latin brand name must remain ABCARINO.">
              <BilingualField base="companyName" label="Company name" en={s.general.companyNameEn} ar={s.general.companyNameAr} maxLength={80} />
              <BilingualField base="tagline" label="Tagline" en={s.general.taglineEn} ar={s.general.taglineAr} maxLength={160} />
              <MediaField name="logoMediaId" label="Custom logo (optional)" defaultValue={pick(s.general.logoMediaId)} hint="Leave empty to use the built-in ABCARINO mark. Use a light logo on a transparent background — the header is dark." />
              <MediaField name="faviconMediaId" label="Custom favicon (optional)" defaultValue={pick(s.general.faviconMediaId)} hint="Square image, at least 256×256." />
            </Section>
          </EntityForm>
        </div>

        <div id="contact" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "contact")}>
            <Section title="Contact & WhatsApp" description="WhatsApp is the primary call to action. Until a number is set, buttons fall back to the contact form.">
              <TextField
                name="whatsappNumber"
                label="WhatsApp number (international format)"
                defaultValue={s.contact.whatsappNumber}
                placeholder="+20 100 000 0000"
                hint={waTest ? <a href={waTest} target="_blank" rel="noopener noreferrer" className="underline">Test the WhatsApp link ↗</a> : "Not configured yet."}
              />
              <BilingualField base="whatsappMessage" label="Pre-filled WhatsApp message" en={s.contact.whatsappMessageEn} ar={s.contact.whatsappMessageAr} multiline rows={2} maxLength={300} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="email" label="Email" type="email" defaultValue={s.contact.email} />
                <TextField name="phone" label="Phone" defaultValue={s.contact.phone} dir="ltr" />
              </div>
              <BilingualField base="address" label="Address" en={s.contact.addressEn} ar={s.contact.addressAr} multiline rows={2} maxLength={300} />
              <TextField name="mapUrl" label="Map link (Google Maps)" defaultValue={s.contact.mapUrl} placeholder="https://maps.app.goo.gl/…" />
              <BilingualField base="businessHours" label="Business hours" en={s.contact.businessHoursEn} ar={s.contact.businessHoursAr} maxLength={200} hint="e.g. Sunday–Thursday, 10:00–18:00" />
            </Section>
          </EntityForm>
        </div>

        <div id="cta" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "cta")}>
            <Section title="Calls to action">
              <BilingualField base="primaryLabel" label="Primary (WhatsApp) button" en={s.cta.primaryLabelEn} ar={s.cta.primaryLabelAr} maxLength={60} />
              <BilingualField base="secondaryLabel" label="Secondary (consultation / contact) button" en={s.cta.secondaryLabelEn} ar={s.cta.secondaryLabelAr} maxLength={60} />
              <BilingualField
                base="consultationNote"
                label="Consultation details (optional)"
                en={s.cta.consultationNoteEn}
                ar={s.cta.consultationNoteAr}
                multiline
                rows={3}
                maxLength={400}
                hint="Explain how consultations work — e.g. whether a site visit is paid and deducted from the project. Leave empty to hide."
              />
            </Section>
          </EntityForm>
        </div>

        <div id="pages" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "pages")}>
            <Section title="Home & About copy" description="The main statements of the website.">
              <BilingualField base="heroTitle" label="Home headline" en={s.pages.heroTitleEn} ar={s.pages.heroTitleAr} maxLength={140} />
              <BilingualField base="heroSubtitle" label="Home introduction" en={s.pages.heroSubtitleEn} ar={s.pages.heroSubtitleAr} multiline rows={3} maxLength={400} />
              <BilingualField base="statement" label="Brand statement" en={s.pages.statementEn} ar={s.pages.statementAr} multiline rows={3} maxLength={400} />
              <BilingualField base="aboutIntro" label="About introduction" en={s.pages.aboutIntroEn} ar={s.pages.aboutIntroAr} multiline rows={5} maxLength={800} />
            </Section>
          </EntityForm>
        </div>

        <div id="sections" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "sections")}>
            <Section title="Sections & visibility" description="Prepared sections stay out of the navigation until you enable them.">
              <CheckboxField name="showPackages" label="Show Packages" defaultChecked={s.sections.showPackages} />
              <CheckboxField name="showPackagePrices" label="Show package prices" defaultChecked={s.sections.showPackagePrices} hint="When off, every package shows “Price on request”." />
              <CheckboxField name="showComingSoon" label="Show “Coming soon” solutions" defaultChecked={s.sections.showComingSoon} />
              <CheckboxField name="showProjects" label="Show Projects" defaultChecked={s.sections.showProjects} hint="Only enable once real projects are published." />
              <CheckboxField name="showPartners" label="Show Partners" defaultChecked={s.sections.showPartners} hint="Only enable once real partnerships are confirmed." />
              <CheckboxField name="showInsights" label="Show Insights (articles)" defaultChecked={s.sections.showInsights} />
            </Section>
          </EntityForm>
        </div>

        <div id="seo" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "seo")}>
            <Section title="SEO defaults">
              <BilingualField base="title" label="Default page title" en={s.seo.titleEn} ar={s.seo.titleAr} maxLength={120} />
              <BilingualField base="description" label="Default description" en={s.seo.descriptionEn} ar={s.seo.descriptionAr} multiline rows={3} maxLength={320} />
              <MediaField name="ogImageMediaId" label="Social sharing image (optional)" defaultValue={pick(s.seo.ogImageMediaId)} hint="1200×630 recommended. Leave empty for the branded default." />
              <CheckboxField name="allowIndexing" label="Allow search engines to index the website" defaultChecked={s.seo.allowIndexing} hint="Turn off for a private preview; robots.txt and meta tags update automatically." />
              <TextField name="googleVerification" label="Google Search Console verification code" defaultValue={s.seo.googleVerification} />
            </Section>
          </EntityForm>
        </div>

        <div id="social" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "social")}>
            <Section title="Social media" description="Full https:// links. Empty channels are hidden.">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="instagram" label="Instagram" defaultValue={s.social.instagram} />
                <TextField name="facebook" label="Facebook" defaultValue={s.social.facebook} />
                <TextField name="linkedin" label="LinkedIn" defaultValue={s.social.linkedin} />
                <TextField name="x" label="X (Twitter)" defaultValue={s.social.x} />
                <TextField name="tiktok" label="TikTok" defaultValue={s.social.tiktok} />
                <TextField name="youtube" label="YouTube" defaultValue={s.social.youtube} />
                <TextField name="behance" label="Behance" defaultValue={s.social.behance} />
              </div>
            </Section>
          </EntityForm>
        </div>

        <div id="localization" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "localization")}>
            <Section title="Language" description="Visitors are sent to their browser language when it's Arabic or English; otherwise to the default below.">
              <SelectField name="defaultLocale" label="Default language" defaultValue={s.localization.defaultLocale} options={[{ value: "en", label: "English" }, { value: "ar", label: "العربية (Arabic)" }]} />
            </Section>
          </EntityForm>
        </div>

        <div id="footer" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "footer")}>
            <Section title="Footer">
              <BilingualField base="statement" label="Footer statement" en={s.footer.statementEn} ar={s.footer.statementAr} multiline rows={2} maxLength={300} />
              <BilingualField base="legal" label="Legal line (optional)" en={s.footer.legalEn} ar={s.footer.legalAr} maxLength={200} hint="e.g. commercial registration number." />
            </Section>
          </EntityForm>
        </div>

        <div id="maintenance" className="scroll-mt-20">
          <EntityForm action={saveSettings.bind(null, "maintenance")}>
            <Section title="Maintenance mode" description="Visitors see a short message; signed-in admins still see the full site.">
              <CheckboxField name="enabled" label="Enable maintenance mode" defaultChecked={s.maintenance.enabled} />
              <BilingualField base="message" label="Message" en={s.maintenance.messageEn} ar={s.maintenance.messageAr} multiline rows={2} maxLength={400} />
            </Section>
          </EntityForm>
        </div>
      </div>
    </>
  );
}
