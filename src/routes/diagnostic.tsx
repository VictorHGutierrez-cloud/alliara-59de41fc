import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/partners-store";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY, diagnosticHubDescription } from "@/lib/copy";
import { KeptIllustration } from "@/components/brand/KeptIllustration";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({ meta: [{ title: COPY.diagnostic.hubMetaTitle }] }),
  component: DiagnosticLanding,
});

function DiagnosticLanding() {
  const { user, loading } = useAuth();
  const portfolio = usePortfolio(user?.id);

  if (loading || portfolio.loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const firstPartner = portfolio.items[0]?.partner.id;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-border/60 bg-card p-6 card-elev">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.diagnostic.noun}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{COPY.diagnostic.hubTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{diagnosticHubDescription()}</p>
          </div>
          <KeptIllustration
            variant="noticesDrift"
            className="mx-auto h-28 w-auto shrink-0 object-contain opacity-95 sm:mx-0"
            decorative
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {firstPartner ? (
            <Link
              to="/partner/$partnerId/diagnostic"
              params={{ partnerId: firstPartner }}
              className="btn-candy min-h-11 px-6"
            >
              {COPY.diagnostic.hubCtaWithPartner}
            </Link>
          ) : (
            <Link to="/partners" className="btn-candy min-h-11 px-6">
              {COPY.diagnostic.hubCtaPortfolio}
            </Link>
          )}
          <Link to="/partners" className="btn-candy-secondary min-h-11 px-6">
            {COPY.diagnostic.hubSecondaryCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
