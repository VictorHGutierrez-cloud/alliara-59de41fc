import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import alliaraLogo from "@/assets/alliara-logo.png";
import {
  Menu,
  Users,
  ClipboardCheck,
  BarChart3,
  Trophy,
  Compass,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmProvider } from "@/components/ui/confirm-provider";
import { COPY } from "@/lib/copy";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">{COPY.auth.notFoundTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{COPY.auth.notFoundHint}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
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
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;600&family=Poppins:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap",
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
  const { user, loading, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = path === "/";
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-border/70 bg-sidebar/90 px-4 py-5 lg:block">
          <div className="space-y-3">
            <Skeleton className="h-10 w-40 rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </aside>
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-5 h-24 w-full rounded-2xl" />
          <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

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
          ]
        : [],
    [navigate, path, user],
  );

  const inAppWorkspace = Boolean(user && !isLanding);

  return (
    <div className={inAppWorkspace ? "min-h-screen lg:grid lg:grid-cols-[17rem_1fr]" : "min-h-screen"}>
      {inAppWorkspace && (
        <aside className="hidden border-r border-sidebar-border/80 bg-sidebar/95 px-4 py-5 lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2">
            <img src={alliaraLogo} alt={COPY.auth.logoAltWordmark} className="h-10 w-auto object-contain" />
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">{COPY.auth.attributionByline}</p>
          <nav className="mt-6 space-y-1.5">
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

      <div className="min-h-screen flex flex-col">
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
                  className="h-9 sm:h-11 w-auto object-contain"
                />
                <span className="ml-2 hidden whitespace-nowrap text-xs text-zinc-500 opacity-70 sm:inline">
                  {COPY.auth.attributionByline}
                </span>
              </Link>
            </div>
            <nav className="flex items-center gap-2 text-sm">
              {isLanding ? (
                user ? (
                  <>
                    <Link
                      to="/partners"
                      className="min-h-11 inline-flex items-center rounded-md px-4 text-sm font-semibold text-foreground hover:bg-neutral-100"
                    >
                      {COPY.auth.openWorkspaceCta}
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="ml-1 min-h-11 inline-flex items-center rounded-md px-4 text-sm font-semibold text-foreground hover:bg-neutral-100"
                    >
                      {COPY.auth.signOutLabel}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="min-h-11 inline-flex items-center rounded-md px-4 hover:bg-surface-2 text-foreground"
                    >
                      {COPY.auth.signIn}
                    </Link>
                    <Link
                      to="/signup"
                      className="ml-1 min-h-11 inline-flex items-center rounded-md px-5 bg-primary text-primary-foreground font-medium hover:opacity-90"
                    >
                      {COPY.auth.getStarted}
                    </Link>
                  </>
                )
              ) : user ? (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {COPY.auth.signedInHint}
                </span>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="min-h-11 inline-flex items-center rounded-md px-4 hover:bg-surface-2"
                  >
                    {COPY.auth.signIn}
                  </Link>
                  <Link
                    to="/signup"
                    className="ml-1 min-h-11 inline-flex items-center rounded-md px-5 bg-primary text-primary-foreground font-medium hover:opacity-90"
                  >
                    {COPY.auth.getStarted}
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        {!isLanding && (
          <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
            {COPY.appShell.footerCredit}
          </footer>
        )}
      </div>

      {inAppWorkspace && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[18rem] border-r border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">App navigation</SheetTitle>
            <div className="flex h-full flex-col px-3 py-4">
              <Link to="/" className="flex items-center gap-2 px-2" onClick={() => setMobileNavOpen(false)}>
                <img src={alliaraLogo} alt={COPY.auth.logoAltWordmark} className="h-10 w-auto object-contain" />
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
