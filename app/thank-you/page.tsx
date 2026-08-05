import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/layout/Wordmark";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { ThankYouOptionalForm } from "@/components/sections/ThankYouOptionalForm";
import { telHref, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank You — Blanca Ekaiva",
  description: "Thanks for reaching out. Rahul will call you shortly.",
  // Transient confirmation URL — a conversion target, not a search result.
  robots: { index: false, follow: true },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string | string[] }>;
}) {
  const { leadId } = await searchParams;
  const resolvedLeadId = typeof leadId === "string" ? leadId : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center">
          <Wordmark onDark={false} />
        </div>

        <span className="mx-auto mt-10 flex size-16 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
          <Icon name="check" className="size-8" />
        </span>

        <h1 className="mt-6 text-4xl text-ink sm:text-5xl">
          Thank you for reaching out
        </h1>
        <p className="mt-4 text-lg text-body">
          Your enquiry for <span className="font-medium text-ink">Blanca Ekaiva</span>{" "}
          is in. We will call you within 30 minutes with floor plans and current
          pricing.
        </p>

        {/* Immediate contact options */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={telHref} size="lg">
            <Icon name="phone" className="size-5" />
            Call now
          </Button>
          <Button href={whatsappHref} variant="outline" size="lg">
            <Icon name="whatsapp" className="size-5" />
            WhatsApp
          </Button>
        </div>

        {/* Optional enrichment of the same lead */}
        {resolvedLeadId ? <ThankYouOptionalForm leadId={resolvedLeadId} /> : null}

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <Icon name="arrowRight" className="size-4 rotate-180" />
            Back to the website
          </Link>
        </div>
      </div>
    </main>
  );
}
