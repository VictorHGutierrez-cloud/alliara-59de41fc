import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import appCss from "../styles.css?url";
import alliaraSiteIcon from "@/assets/alliara-mark.png";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import alliaraLogo from "@/assets/alliara-logo.svg?url";
import alliaraLogoSidebar from "@/assets/alliara-logo.svg?url";
import {
  Menu,
  Users,
  ClipboardCheck,
  BarChart3,
  Trophy,
  Compass,
  BadgeCheck,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmProvider } from "@/components/ui/confirm-provider";
import { COPY } from "@/lib/copy";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { KeptAmbientPresence } from "@/components/brand/KeptAmbientPresence";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-gradient" aria-hidden="true">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold">{COPY.auth.notFoundTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{COPY.auth.notFoundHint}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            {COPY.auth.homeCtaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: COPY.auth.rootMetaTitle },
      { name: "description", content: COPY.auth.rootMetaDescription },
      { property: "og:title", content: COPY.auth.ogTitle },
      { property: "og:description", content: COPY.auth.ogDescription },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: COPY.auth.ogTitle },
      { name: "twitter:description", content: COPY.auth.ogDescription },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b671999f-c800-483e-8705-a1f8b91f08c8/id-preview-685829ca--946109ff-f6ed-4998-9035-4d09cbe35aac.lovable.app-1777462114181.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b671999f-c800-483e-8705-a1f8b91f08c8/id-preview-685829ca--946109ff-f6ed-4998-9035-4d09cbe35aac.lovable.app-1777462114181.png",
      },
    ],
    links: [
      { rel: "icon", href: alliaraSiteIcon, type: "image/png" },
      { rel: "apple-touch-icon", href: alliaraSiteIcon },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..700&family=Roboto+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <AppFrame />
        <Toaster richColors position="top-right" />
      </ConfirmProvider>
    </AuthProvider>
  );
}

function AppFrame() {
  const { user, loading, signOut, accessStatus, isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = path === "/";
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // SaaS approval gate: signed-in users without approved access can only
  // see public/auth pages and the pending screen.
  const PUBLIC_PATHS = useMemo(
    () => ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/pending-approval", "/intro", "/meet-kept"],
    [],
  );
  useEffect(() => {
    if (!user || !accessStatus) return;
    if (accessStatus === "approved") return;
    if (!PUBLIC_PATHS.includes(path)) {
      navigate({ to: "/pending-approval", replace: true });
    }
  }, [user, accessStatus, path, PUBLIC_PATHS, navigate]);

  const workspaceItems = useMemo(
    () =>
      user
        ? [
            {
              key: "portfolio",
              icon: Users,
              label: COPY.appShell.dockPortfolio,
              active: path.startsWith("/partners") || path.startsWith("/partner"),
              onClick: () => navigate({ to: "/partners" }),
            },
            {
              key: "qualification",
              icon: ClipboardCheck,
              label: COPY.appShell.dockQualification,
              active: path.startsWith("/qualification"),
              onClick: () => navigate({ to: "/qualification" }),
            },
            {
              key: "reports",
              icon: BarChart3,
              label: COPY.appShell.dockReports,
              active: path.startsWith("/reports"),
              onClick: () => navigate({ to: "/reports" }),
            },
            {
              key: "methodology",
              icon: Compass,
              label: COPY.appShell.dockMethodology,
              active: path.startsWith("/methodology") || path.startsWith("/axis"),
              onClick: () => navigate({ to: "/methodology" }),
            },
            {
              key: "certification",
              icon: BadgeCheck,
              label: COPY.appShell.dockCertification,
              active: path.startsWith("/certification"),
              onClick: () => navigate({ to: "/certification" }),
            },
            {
              key: "meet-kept",
              icon: Sparkles,
              label: COPY.introTour.heroCta,
              active: path === "/intro",
              onClick: () => navigate({ to: "/intro" }),
            },
            {
              key: "pulse",
              icon: Trophy,
              label: COPY.appShell.dockPulse,
              active: path.startsWith("/dashboard") || path.startsWith("/diagnostic"),
              onClick: () => navigate({ to: "/dashboard" }),
            },
            {
              key: "settings",
              icon: SettingsIcon,
              label: COPY.appShell.dockSettings,
              active: path.startsWith("/settings"),
              onClick: () => navigate({ to: "/settings" }),
            },
            ...(isAdmin
              ? [{
                  key: "approvals",
                  icon: ShieldCheck,
                  label: "Approvals",
                  active: path.startsWith("/admin/approvals"),
                  onClick: () => navigate({ to: "/admin/approvals" }),
                }]
              : []),
          ]
        : [],
    [navigate, path, user, isAdmin],
  );

  if (loading) {
    return (
      <div className="grid min-h-screen w-full overflow-x-clip lg:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-border/70 bg-sidebar/90 px-4 py-5 lg:block">
          <div className="space-y-3">
            <Skeleton className="h-10 w-40 rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </aside>
        <div className="mx-auto min-w-0 w-full max-w-7xl px-6 py-8">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-5 h-24 w-full rounded-2xl" />
          <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const inAppWorkspace = Boolean(user && !isLanding);

  return (
    <div
      className={
        inAppWorkspace
          ? "min-h-screen w-full overflow-x-clip lg:grid lg:grid-cols-[17rem_1fr]"
          : "min-h-screen w-full overflow-x-clip"
      }
    >
      {inAppWorkspace && (
        <aside className="hidden border-r border-sidebar-border/80 bg-sidebar/95 px-4 py-5 lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={alliaraLogoSidebar}
              alt={COPY.auth.logoAltWordmark}
              className="h-auto w-full max-h-[4.75rem] max-w-[13.5rem] object-contain object-left"
            />
          </Link>
          <nav className="mt-5 space-y-1.5">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                    item.active
                      ? "bg-primary/14 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-auto flex min-h-11 items-center gap-3 rounded-xl border border-border/70 px-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{COPY.appShell.dockSignOut}</span>
          </button>
        </aside>
      )}

      <div className="min-h-screen min-w-0 flex flex-col">
        <header
          className={isLanding && !user ? "sticky top-0 z-40 bg-white" : "sticky top-0 z-40 glass"}
        >
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {inAppWorkspace && (
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border/70 bg-surface lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <Link
                to="/"
                className="flex items-center gap-2 font-display font-bold tracking-tight text-foreground"
              >
                <img
                  src={alliaraLogo}
                  alt={COPY.auth.logoAltWordmark}
                  className="h-10 w-auto max-w-[min(100%,13rem)] object-contain sm:h-12"
                />
              </Link>
            </div>
            <nav className="flex items-center gap-2 text-sm">
              {isLanding ? (
                user ? (
                  <>
                    <Link
                      to="/partners"
                      className="min-h-11 inline-flex items-center rounded-xl px-4 text-sm font-semibold text-foreground transition hover:bg-neutral-100"
                    >
                      {COPY.auth.openWorkspaceCta}
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="ml-1 min-h-11 inline-flex items-center rounded-xl px-4 text-sm font-semibold text-foreground transition hover:bg-neutral-100"
                    >
                      {COPY.auth.signOutLabel}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="min-h-11 inline-flex items-center rounded-xl px-4 text-foreground transition hover:bg-surface-2"
                    >
                      {COPY.auth.signIn}
                    </Link>
                    <Link
                      to="/intro"
                      className="min-h-11 inline-flex items-center rounded-xl px-4 font-semibold text-foreground transition hover:bg-surface-2"
                    >
                      {COPY.introTour.heroCta}
                    </Link>
                    <Link
                      to="/signup"
                      className="ml-1 min-h-11 inline-flex items-center rounded-xl px-5 bg-primary text-primary-foreground font-medium shadow-sm transition hover:opacity-90"
                    >
                      {COPY.auth.getStarted}
                    </Link>
                  </>
                )
              ) : user ? (
                <>
                  <Link
                    to="/intro"
                    className="min-h-11 inline-flex items-center rounded-xl px-3 text-sm font-semibold text-foreground transition hover:bg-surface-2 sm:px-4"
                  >
                    {COPY.introTour.heroCta}
                  </Link>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{COPY.auth.signedInHint}</span>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="min-h-11 inline-flex items-center rounded-xl px-4 transition hover:bg-surface-2"
                  >
                    {COPY.auth.signIn}
                  </Link>
                  <Link
                    to="/intro"
                    className="min-h-11 inline-flex items-center rounded-xl px-4 font-semibold transition hover:bg-surface-2"
                  >
                    {COPY.introTour.heroCta}
                  </Link>
                  <Link
                    to="/signup"
                    className="ml-1 min-h-11 inline-flex items-center rounded-xl px-5 bg-primary text-primary-foreground font-medium shadow-sm transition hover:opacity-90"
                  >
                    {COPY.auth.getStarted}
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="relative min-w-0 flex-1">
          <Outlet />
          {inAppWorkspace && <KeptAmbientPresence />}
        </main>

        {!isLanding && (
          <footer className="border-t border-border/50 bg-card/30 py-8 text-center">
            <p className="text-xs text-muted-foreground">{COPY.appShell.footerCredit}</p>
            <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">
              {COPY.auth.attributionByline}
            </p>
          </footer>
        )}
      </div>

      {inAppWorkspace && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[18rem] border-r border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">App navigation</SheetTitle>
            <div className="flex h-full flex-col px-3 py-4">
              <Link to="/" className="flex items-center gap-2 px-2" onClick={() => setMobileNavOpen(false)}>
                <img
                  src={alliaraLogoSidebar}
                  alt={COPY.auth.logoAltWordmark}
                  className="h-auto w-full max-h-[4.75rem] max-w-[13.5rem] object-contain object-left"
                />
              </Link>
              <nav className="mt-6 space-y-1.5">
                {workspaceItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setMobileNavOpen(false);
                        item.onClick();
                      }}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                        item.active ? "bg-primary/14 text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  signOut();
                }}
                className="mt-auto flex min-h-11 items-center gap-3 rounded-xl border border-border/70 px-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>{COPY.appShell.dockSignOut}</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
