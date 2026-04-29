import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

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
      { title: "OCTA OS — The Partnership Operating System" },
      { name: "description", content: "Diagnose, learn, and operate a high-performing B2B partner ecosystem with the OCTA methodology — 8 axes, maturity scoring, and gamified execution." },
      { property: "og:title", content: "OCTA OS — The Partnership Operating System" },
      { property: "og:description", content: "Diagnose, learn, and operate a high-performing B2B partner ecosystem with the OCTA methodology — 8 axes, maturity scoring, and gamified execution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "OCTA OS — The Partnership Operating System" },
      { name: "twitter:description", content: "Diagnose, learn, and operate a high-performing B2B partner ecosystem with the OCTA methodology — 8 axes, maturity scoring, and gamified execution." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b671999f-c800-483e-8705-a1f8b91f08c8/id-preview-685829ca--946109ff-f6ed-4998-9035-4d09cbe35aac.lovable.app-1777462114181.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b671999f-c800-483e-8705-a1f8b91f08c8/id-preview-685829ca--946109ff-f6ed-4998-9035-4d09cbe35aac.lovable.app-1777462114181.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" },
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
  const isApp = path.startsWith("/dashboard") || path.startsWith("/diagnostic") || path.startsWith("/axis") || path.startsWith("/profile");

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold tracking-tight">
            <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-[var(--octa-1)] via-[var(--octa-4)] to-[var(--octa-5)]" />
            <span>OCTA<span className="text-muted-foreground">.os</span></span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {user ? (
              <>
                <Link to="/partners" className="px-3 py-1.5 rounded-md hover:bg-surface-2" activeProps={{ className: "px-3 py-1.5 rounded-md bg-surface-2" }}>Portfolio</Link>
                <Link to="/qualification" className="px-3 py-1.5 rounded-md hover:bg-surface-2" activeProps={{ className: "px-3 py-1.5 rounded-md bg-surface-2" }}>Qualification</Link>
                <Link to="/dashboard" className="px-3 py-1.5 rounded-md hover:bg-surface-2 text-muted-foreground" activeProps={{ className: "px-3 py-1.5 rounded-md bg-surface-2 text-foreground" }}>My maturity</Link>
                <button onClick={() => signOut()} className="ml-2 text-muted-foreground hover:text-foreground">Sign out</button>
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

      <main className={isApp ? "flex-1" : "flex-1"}>
        <Outlet />
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        OCTA OS · A partnership operating system for B2B teams
      </footer>
    </div>
  );
}
