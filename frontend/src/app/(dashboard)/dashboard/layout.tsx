"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScrollText,
  BarChart3,
  Key,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Sidebar navigation items
// ---------------------------------------------------------------------------

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Policies",
    href: "/dashboard/policies",
    icon: ScrollText,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "API Keys",
    href: "/dashboard/keys",
    icon: Key,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// ---------------------------------------------------------------------------
// Inner layout (needs auth context)
// ---------------------------------------------------------------------------

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !tenant) {
      router.replace("/login");
    }
  }, [isLoading, tenant, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="text-[13px] text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!tenant) {
    return null;
  }

  const currentPage =
    navItems.find((item) => pathname === item.href) ??
    navItems.find(
      (item) => item.href !== "/dashboard" && pathname.startsWith(item.href),
    ) ??
    navItems[0];

  return (
    <div className="min-h-screen flex">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] -left-40 w-[40rem] h-[40rem] rounded-full bg-emerald-600/[0.025] blur-[10rem]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-teal-700/[0.02] blur-[8rem]" />
      </div>

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-[260px] z-40 flex flex-col border-r border-white/[0.06] bg-bg/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-lg bg-accent/20 blur-md" />
              <div className="relative w-full h-full rounded-lg bg-gradient-to-br from-accent/90 to-accent/60 flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-bg"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-text-primary">
              Cerberus
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative",
                  isActive
                    ? "text-text-primary bg-white/[0.06]"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon
                  size={16}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-accent" : "text-text-tertiary group-hover:text-text-secondary",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Tenant info & logout */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/[0.1] flex items-center justify-center shrink-0">
              <span className="text-[13px] font-semibold text-accent">
                {(tenant?.name ?? "T").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text-primary truncate">
                {tenant?.name ?? "Tenant"}
              </p>
              <p className="text-[11px] text-text-tertiary font-mono">
                {tenant?.email ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:text-red hover:bg-red/[0.06] transition-all duration-200"
          >
            <LogOut size={16} className="shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[260px]">
        {/* Header */}
        <header className="sticky top-0 z-30 h-[60px] flex items-center justify-between px-8 border-b border-white/[0.06] bg-bg/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-text-tertiary">Dashboard</span>
            <ChevronRight size={12} className="text-text-tertiary" />
            <span className="text-text-primary font-medium">
              {currentPage.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-accent/[0.08] text-[11px] font-medium text-accent uppercase tracking-wider">
              {tenant?.tier ?? "free"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-10 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.25,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout wrapper with AuthProvider
// ---------------------------------------------------------------------------

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
