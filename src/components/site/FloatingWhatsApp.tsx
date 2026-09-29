import { WhatsAppIcon } from "@/components/ui/icons";

/** Persistent primary CTA on small screens, where the header button is hidden. */
export function FloatingWhatsApp({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 end-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-signal text-white shadow-[0_10px_30px_-8px_rgba(255,91,31,0.6)] transition-transform hover:scale-105 lg:hidden"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
