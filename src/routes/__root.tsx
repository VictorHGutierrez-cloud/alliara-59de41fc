import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState, useNavigate } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import alliaraLogo from "@/assets/alliara-logo.png";
import Dock from "@/components/ui/dock";
import { Users, ClipboardCheck, BarChart3, Trophy, Compass, Settings as SettingsIcon, LogOut } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in the ecosystem</h2>
        <p className="mt-2 text-sm text-muted-foreground">This route does not exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Back to home</Link>
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
      { title: "Alliara — The Partnership Operating System" },
      { name: "description", content: "Diagnose, learn, and operate a high-performing B2B partner ecosystem with the OCTA methodology — 8 axes, maturity scoring, and gamified execution." },
      { property: "og:title", content: "Alliara — The Partnership Operating System" },
      { property: "og:description", content: "Diagnose, learn, and operate a high-performing B2B partner ecosystem with the OCTA methodology — 8 axes, maturity scoring, and gamified execution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Alliara — The Partnership Operating System" },
      { name: "twitter:description", content: "Diagnose, learn, and operate a high-performing B2B partner ecosystem with the OCTA methodology — 8 axes, maturity scoring, and gamified execution." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b671999f-c800-483e-8705-a1f8b91f08c8/id-preview-685829ca--946109ff-f6ed-4998-9035-4d09cbe35aac.lovable.app-1777462114181.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b671999f-c800-483e-8705-a1f8b91f08c8/id-preview-685829ca--946109ff-f6ed-4998-9035-4d09cbe35aac.lovable.app-1777462114181.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;600&family=Poppins:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
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
      <AppFrame />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

function AppFrame() {
  const { user, loading, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = path === "/";
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const dockItems = user
    ? [
        { icon: Users, label: "Portfolio", active: path.startsWith("/partners") || path.startsWith("/partner"), onClick: () => navigate({ to: "/partners" }) },
        { icon: ClipboardCheck, label: "Qualification", active: path.startsWith("/qualification"), onClick: () => navigate({ to: "/qualification" }) },
        { icon: BarChart3, label: "Reports", active: path.startsWith("/reports"), onClick: () => navigate({ to: "/reports" }) },
        { icon: Compass, label: "Methodology", active: path.startsWith("/methodology") || path.startsWith("/axis"), onClick: () => navigate({ to: "/methodology" }) },
        { icon: Trophy, label: "My Performance", active: path.startsWith("/dashboard") || path.startsWith("/diagnostic"), onClick: () => navigate({ to: "/dashboard" }) },
        { icon: SettingsIcon, label: "Settings", active: path.startsWith("/settings"), onClick: () => navigate({ to: "/settings" }) },
        { icon: LogOut, label: "Sign out", onClick: () => signOut() },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={
          isLanding && !user
            ? "sticky top-0 z-40 bg-white"
            : "sticky top-0 z-40 glass"
        }
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold tracking-tight text-foreground">
            <img src={alliaraLogo} alt="Alliara — Unlocking Partners Growth" className="h-12 sm:h-16 w-auto object-contain" />
            <span className="ml-3 font-normal text-muted-foreground opacity-60 whitespace-nowrap text-zinc-500 text-xs hidden sm:inline">
              Created, designed and delivered by Victor Gutierrez
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {isLanding ? (
              user ? (
                <>
                  <Link
                    to="/partners"
                    className="px-3 py-1.5 rounded-md text-sm font-semibold text-foreground hover:bg-neutral-100"
                  >
                    Access
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="ml-2 px-3 py-1.5 rounded-md text-sm font-semibold text-foreground hover:bg-neutral-100"
                  >
                    Sign out
                  </button>
                </>
              ) : null
            ) : user ? (
              <>
                <Link
                  to="/methodology"
                  className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-surface-2 text-foreground"
                  activeProps={{ className: "px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary" }}
                >
                  Methodology
                </Link>
                <span className="text-xs text-muted-foreground hidden sm:inline ml-2">Signed in</span>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 rounded-md hover:bg-surface-2">Sign in</Link>
                <Link to="/signup" className="ml-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {user && !isLanding && <Dock items={dockItems} />}

      {!isLanding && (
        <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
          Alliara · A partnership operating system for B2B teams
        </footer>
      )}
    </div>
  );
}
