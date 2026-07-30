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
import keptMark from "@/assets/kept-mark.png?url";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CompanionProvider } from "@/lib/companion-context";
import { Toaster } from "@/components/ui/sonner";
import {
  Settings as SettingsIcon,
  LogOut,
  ShieldCheck,
  BookOpen,
  MessageCircleQuestion,
  Route as RouteIcon,
  Home,
  Newspaper,
  Flame,
  CircleUserRound,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmProvider } from "@/components/ui/confirm-provider";
import { COPY } from "@/lib/copy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KeptAmbientPresence } from "@/components/brand/KeptAmbientPresence";
import { Dock } from "@/components/ui/dock";
import { useAcademyProgressSync } from "@/hooks/use-academy-progress-sync";
import { getStudyStreak } from "@/lib/academy-progress";
import { cn } from "@/lib/utils";
import { getSalesMaterial } from "@/content/sales-library";

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
      { rel: "icon", href: keptMark, type: "image/png" },
      { rel: "apple-touch-icon", href: keptMark },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Fira+Mono:wght@400;500&display=swap",
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
      <CompanionProvider>
        <ConfirmProvider>
          <AppFrame />
          <Toaster richColors position="top-right" />
        </ConfirmProvider>
      </CompanionProvider>
    </AuthProvider>
  );
}

function AppFrame() {
  const { user, loading, signOut, accessStatus, isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = path === "/";
  const navigate = useNavigate();
  useAcademyProgressSync(user?.id);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    setStreakCount(getStudyStreak().current);
  }, [path]);

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

  const dockItems = useMemo(
    () => {
      const libraryMatch = path.match(/^\/academy\/library\/([^/]+)/);
      const librarySlug = libraryMatch?.[1];
      const material = librarySlug ? getSalesMaterial(librarySlug) : undefined;
      const coachSearch = material
        ? {
            topic: material.title,
            slug: material.slug,
            source: "library" as const,
            draft: COPY.academy.askContextDraft(material.title),
          }
        : {};

      return user
        ? [
            {
              key: "home",
              icon: Home,
              label: COPY.appShell.dockHome,
              active: path === "/academy" || path === "/academy/",
              onClick: () => navigate({ to: "/academy" }),
            },
            {
              key: "coach",
              icon: MessageCircleQuestion,
              label: COPY.appShell.dockCoach,
              active:
                path.startsWith("/academy/ask") ||
                path.startsWith("/academy/stuck") ||
                path.startsWith("/academy/prep") ||
                path.startsWith("/academy/roleplay"),
              onClick: () => navigate({ to: "/academy/ask", search: coachSearch }),
            },
            {
              key: "library",
              icon: BookOpen,
              label: COPY.appShell.dockLibrary,
              active: path.startsWith("/academy/library"),
              onClick: () => navigate({ to: "/academy/library" }),
            },
            {
              key: "tracks",
              icon: RouteIcon,
              label: COPY.appShell.dockTracks,
              active: path.startsWith("/academy/learn"),
              onClick: () => navigate({ to: "/academy/learn" }),
            },
          ]
        : [];
    },
    [navigate, path, user],
  );

  const inAppWorkspace = Boolean(user && !isLanding);

  const showDock =
    !loading &&
    inAppWorkspace &&
    (path.startsWith("/academy") ||
      path.startsWith("/onboarding") ||
      path.startsWith("/settings") ||
      path.startsWith("/admin"));

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-clip">
        <div className="mx-auto min-w-0 w-full max-w-5xl px-6 py-8">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-5 h-24 w-full rounded-2xl" />
          <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip">
      <div className="min-h-screen min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 glass">
          <div
            className={cn(
              "mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6",
              isLanding && !inAppWorkspace ? "min-h-16 py-3" : "h-16",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              {inAppWorkspace ? (
                <BrandLogo variant="header" to="/academy" />
              ) : (
                <BrandLogo variant="header" />
              )}
            </div>
            {inAppWorkspace && (
              <div className="flex items-center gap-2">
                {streakCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-secondary-foreground/20 bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                    aria-label={COPY.academy.studyStreakLabel(streakCount)}
                  >
                    <Flame className="h-3.5 w-3.5 text-primary" aria-hidden />
                    {streakCount}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border/70 bg-surface text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
                    aria-label={COPY.appShell.accountMenuLabel}
                  >
                    <CircleUserRound className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => navigate({ to: "/academy/briefing" })}>
                      <Newspaper className="h-4 w-4" />
                      {COPY.appShell.dockBriefing}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                      <SettingsIcon className="h-4 w-4" />
                      {COPY.appShell.dockSettings}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin/approvals" })}>
                        <ShieldCheck className="h-4 w-4" />
                        {COPY.appShell.dockApprovals}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void signOut()}>
                      <LogOut className="h-4 w-4" />
                      {COPY.appShell.dockSignOut}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <nav className={cn("flex items-center gap-2 text-sm", inAppWorkspace && "hidden")}>
              {isLanding ? (
                user ? (
                  <>
                    <Link
                      to="/academy"
                      className="min-h-11 inline-flex items-center rounded-xl px-4 text-sm font-semibold text-foreground transition hover:bg-surface-2"
                    >
                      {COPY.auth.openWorkspaceCta}
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="ml-1 min-h-11 inline-flex items-center rounded-xl px-4 text-sm font-semibold text-foreground transition hover:bg-surface-2"
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
              ) : user ? null : (
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

        <main className={cn("relative min-w-0 flex-1", showDock && "pb-24")}>
          <Outlet />
          {inAppWorkspace && <KeptAmbientPresence />}
        </main>

        {showDock ? <Dock items={dockItems} className="bottom-3 safe-area-pb" /> : null}

        {!isLanding && (
          <footer className="border-t border-border bg-background py-8 text-center">
            <p className="text-xs text-muted-foreground">{COPY.appShell.footerCredit}</p>
            <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">
              {COPY.auth.attributionByline}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
