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
import alliaraMark from "@/assets/alliara-mark.svg?url";
import alliaraLogo from "@/assets/alliara-logo.svg?url";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import {
  Menu,
  ScrollText,
  Users,
  Settings as SettingsIcon,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmProvider } from "@/components/ui/confirm-provider";
import { COPY } from "@/lib/copy";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { KeptAmbientPresence } from "@/components/brand/KeptAmbientPresence";
import { cn } from "@/lib/utils";
import { HubSpotOfflineBanner } from "@/components/HubSpotOfflineBanner";

const SIDEBAR_COLLAPSED_KEY = "alliara-sidebar-collapsed";

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
      { rel: "icon", href: alliaraMark, type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: alliaraMark },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // SaaS approval gate: signed-in users without approved access can only
  // see public/auth pages and the pending screen.
  const PUBLIC_PATHS = useMemo(
    () => [
      "/",
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/pending-approval",
      "/intro",
      "/meet-kept",
    ],
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
              key: "digest",
              icon: ScrollText,
              label: COPY.appShell.dockDigest,
              active: path.startsWith("/digest"),
              onClick: () => navigate({ to: "/digest" }),
            },
            {
              key: "portfolio",
              icon: Users,
              label: COPY.appShell.dockPortfolio,
              active: path.startsWith("/partners") || path.startsWith("/partner"),
              onClick: () => navigate({ to: "/partners" }),
            },
            {
              key: "settings",
              icon: SettingsIcon,
              label: COPY.appShell.dockSettings,
              active: path.startsWith("/settings"),
              onClick: () => navigate({ to: "/settings" }),
            },
            ...(isAdmin
              ? [
                  {
                    key: "approvals",
                    icon: ShieldCheck,
                    label: COPY.appShell.dockApprovals,
                    active: path.startsWith("/admin/approvals"),
                    onClick: () => navigate({ to: "/admin/approvals" }),
                  },
                ]
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

  const sidebarColClass = sidebarCollapsed
    ? "lg:grid-cols-[4.5rem_1fr]"
    : "lg:grid-cols-[17rem_1fr]";

  return (
    <div
      className={
        inAppWorkspace
          ? cn("min-h-screen w-full overflow-x-clip lg:grid", sidebarColClass)
          : "min-h-screen w-full overflow-x-clip"
      }
    >
      {inAppWorkspace && (
        <aside
          className={cn(
            "hidden border-r border-sidebar-border/80 bg-sidebar/95 py-5 lg:flex lg:flex-col lg:shrink-0 lg:transition-[width] lg:duration-200 lg:ease-out",
            sidebarCollapsed
              ? "lg:w-[4.5rem] lg:min-w-[4.5rem] lg:px-2"
              : "lg:w-[17rem] lg:min-w-[17rem] lg:px-4",
          )}
        >
          <div
            className={cn(
              "mb-3 flex shrink-0 items-start gap-2",
              sidebarCollapsed ? "flex-col items-center" : "flex-row items-center justify-between",
            )}
          >
            <Link
              to="/partners"
              className={cn(
                "flex min-w-0 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                sidebarCollapsed ? "justify-center p-0.5" : "flex-1 pr-1",
              )}
            >
              <img
                src={sidebarCollapsed ? alliaraMark : alliaraLogo}
                alt={COPY.auth.logoAltWordmark}
                className={cn(
                  "object-contain",
                  sidebarCollapsed
                    ? "mx-auto size-10"
                    : "h-auto max-h-12 w-full max-w-[12.5rem] object-left sm:max-h-[3.35rem]",
                )}
                decoding="async"
              />
            </Link>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              aria-expanded={!sidebarCollapsed}
              aria-controls="workspace-dock-nav"
              aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              className={cn(
                "inline-flex shrink-0 min-h-10 min-w-10 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
                sidebarCollapsed && "mt-1",
              )}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>
          <nav id="workspace-dock-nav" className="mt-1 space-y-1.5">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-xl text-left text-sm transition",
                    sidebarCollapsed ? "justify-center px-0" : "px-3",
                    item.active
                      ? "bg-primary/14 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn("truncate", sidebarCollapsed && "sr-only")}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => signOut()}
            title={sidebarCollapsed ? COPY.appShell.dockSignOut : undefined}
            className={cn(
              "mt-auto flex min-h-11 items-center gap-3 rounded-xl border border-border/70 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
              sidebarCollapsed ? "justify-center px-0" : "px-3",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(sidebarCollapsed && "sr-only")}>{COPY.appShell.dockSignOut}</span>
          </button>
        </aside>
      )}

      <div className="min-h-screen min-w-0 flex flex-col">
        <header
          className={isLanding && !user ? "sticky top-0 z-40 bg-white" : "sticky top-0 z-40 glass"}
        >
          <div
            className={cn(
              "mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6",
              isLanding && !inAppWorkspace ? "min-h-[5.25rem] py-3 sm:min-h-28 sm:py-5" : "h-20",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              {inAppWorkspace && (
                <>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface lg:hidden"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <Link
                    to="/partners"
                    className="inline-flex min-h-11 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                    aria-label={COPY.appShell.goToPortfolio}
                  >
                    <img
                      src={alliaraMark}
                      alt=""
                      className="size-9 object-contain"
                      decoding="async"
                    />
                  </Link>
                </>
              )}
              {!inAppWorkspace && (
                <Link
                  to="/"
                  className="flex min-w-0 items-center gap-2 font-display font-bold tracking-tight text-foreground"
                >
                  <img
                    src={alliaraLogo}
                    alt={COPY.auth.logoAltWordmark}
                    className={cn(
                      "w-auto object-contain object-left",
                      isLanding
                        ? "h-16 max-w-[min(100%,30rem)] sm:h-[5.25rem] md:h-28"
                        : "h-10 max-w-[min(100%,13rem)] sm:h-12",
                    )}
                    decoding="async"
                  />
                </Link>
              )}
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
                    to="/kept"
                    className="min-h-11 inline-flex items-center rounded-xl px-3 text-sm font-semibold text-foreground transition hover:bg-surface-2 sm:px-4"
                  >
                    {COPY.auth.headerKeptCta}
                  </Link>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {COPY.auth.signedInHint}
                  </span>
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
          {inAppWorkspace && <HubSpotOfflineBanner />}
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
          <SheetContent
            side="left"
            className="w-[18rem] border-r border-sidebar-border bg-sidebar p-0"
          >
            <SheetTitle className="sr-only">App navigation</SheetTitle>
            <div className="flex h-full flex-col px-3 py-4">
              <Link
                to="/partners"
                className="mb-4 flex px-2"
                onClick={() => setMobileNavOpen(false)}
              >
                <img
                  src={alliaraLogo}
                  alt={COPY.auth.logoAltWordmark}
                  className="h-auto max-h-11 w-full max-w-[12.5rem] object-contain object-left"
                  decoding="async"
                />
              </Link>
              <nav className="space-y-1.5">
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
                        item.active
                          ? "bg-primary/14 text-foreground"
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
