import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Shield, Bell, User } from "lucide-react";
import type { ReactNode } from "react";

interface PhoneShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  hideNav?: boolean;
}

export function PhoneShell({ children, title, showBack, backTo = "/", hideNav }: PhoneShellProps) {
  return (
    <div className="min-h-screen bg-secondary flex justify-center">
      <div className="w-full max-w-[420px] bg-background min-h-screen flex flex-col relative shadow-elevated">
        {/* Status bar */}
        <div className="h-11 bg-primary text-primary-foreground flex items-center justify-between px-5 text-xs font-medium">
          <span>9:41</span>
          <span>GOGuardian</span>
          <span>100%</span>
        </div>

        {/* Header */}
        {(title || showBack) && (
          <header className="bg-primary text-primary-foreground px-5 pb-5 pt-2 flex items-center gap-3">
            {showBack && (
              <Link
                to={backTo}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition -ml-2"
                aria-label="Back"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
            )}
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
          </header>
        )}

        {/* Content */}
        <main className={`flex-1 ${hideNav ? "" : "pb-24"}`}>{children}</main>

        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/", icon: Wallet, label: "Wallet" },
    { to: "/guardian", icon: Shield, label: "Guardian", primary: true },
    { to: "/", icon: Bell, label: "Inbox" },
    { to: "/", icon: User, label: "Me" },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="grid grid-cols-5 h-20 px-2 pt-2 pb-3">
        {items.map(({ to, icon: Icon, label, primary }, i) => {
          const active = primary ? pathname.startsWith("/guardian") || pathname.startsWith("/family") || pathname.startsWith("/alert") || pathname.startsWith("/blocked") : false;
          return (
            <Link
              key={i}
              to={to}
              className="flex flex-col items-center justify-center gap-1"
            >
              <Icon
                size={primary ? 26 : 22}
                className={active || primary ? "text-primary" : "text-muted-foreground"}
                strokeWidth={active || primary ? 2.4 : 2}
              />
              <span className={`text-[11px] ${active || primary ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
