import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "TNG eWallet — Login" }],
  }),
  component: LoginScreen,
});

function LoginScreen() {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  return (
    <PhoneShell hideNav>
      <div className="flex flex-col min-h-[calc(100vh-44px)] bg-white px-6">
        {/* Logo */}
        <div className="pt-14 pb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="white" fillOpacity="0.9" />
              <path d="M16 9L23 13V19L16 23L9 19V13L16 9Z" fill="#1C6EF2" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-[#1C6EF2] tracking-tight">TNG eWallet</div>
          <div className="mt-0.5 text-xs text-muted-foreground tracking-widest uppercase">Touch 'n Go Digital</div>
        </div>

        {/* Form */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to continue to your eWallet</p>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
              <div className="flex items-center border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white transition-all">
                <span className="px-4 py-3.5 text-foreground font-semibold bg-muted border-r border-input text-sm select-none">
                  +60
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="1X-XXXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-4 py-3.5 text-sm outline-none bg-white text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl shadow-card mt-8"
            onClick={() => navigate({ to: "/home" })}
          >
            Login
          </Button>

          <p className="text-center text-sm mt-5">
            <button className="text-primary font-medium">Forgot PIN?</button>
          </p>
        </div>

        {/* Footer */}
        <div className="pb-10 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 4L8.5 5.5V7.5L6 9L3.5 7.5V5.5L6 4Z" fill="currentColor" fillOpacity="0.5" />
            </svg>
            <span>Secured by Touch 'n Go Digital Sdn Bhd</span>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
