import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const Route = createFileRoute("/trustees")({
  head: () => ({
    meta: [{ title: "My Trustees — TNG eWallet" }],
  }),
  component: TrusteesScreen,
});

type Trustee = {
  name: string;
  relation: string;
  city: string;
  initials: string;
  lastActive: string;
  status: "Active" | "Pending";
};

const INITIAL_TRUSTEES: Trustee[] = [
  { name: "Ahmad Hafizi", relation: "Son", city: "Kuala Lumpur", initials: "AH", lastActive: "2 hours ago", status: "Active" },
];

type View =
  | { type: "list" }
  | { type: "add-form" }
  | { type: "add-success"; name: string }
  | { type: "detail"; trustee: Trustee }
  | { type: "remove-confirm"; trustee: Trustee }
  | { type: "tac"; trustee: Trustee }
  | { type: "remove-success"; trustee: Trustee };

function TrusteesScreen() {
  const [trustees, setTrustees] = useState<Trustee[]>(INITIAL_TRUSTEES);
  const [view, setView] = useState<View>({ type: "list" });

  const removeTrustee = (name: string) => {
    setTrustees((prev) => prev.filter((t) => t.name !== name));
    setView({ type: "list" });
  };

  if (view.type === "add-form") {
    return (
      <AddTrusteeForm
        onBack={() => setView({ type: "list" })}
        onSuccess={(name) => setView({ type: "add-success", name })}
      />
    );
  }

  if (view.type === "add-success") {
    return (
      <AddSuccessScreen
        name={view.name}
        onDone={() => setView({ type: "list" })}
      />
    );
  }

  if (view.type === "detail") {
    return (
      <>
        <TrusteeDetailScreen
          trustee={view.trustee}
          onBack={() => setView({ type: "list" })}
          onRemove={() => setView({ type: "remove-confirm", trustee: view.trustee })}
        />
        {false && null}
      </>
    );
  }

  if (view.type === "remove-confirm") {
    return (
      <TrusteeDetailScreen
        trustee={view.trustee}
        onBack={() => setView({ type: "list" })}
        onRemove={() => {}}
        modal={
          <RemoveConfirmModal
            name={view.trustee.name}
            onCancel={() => setView({ type: "detail", trustee: view.trustee })}
            onConfirm={() => setView({ type: "tac", trustee: view.trustee })}
          />
        }
      />
    );
  }

  if (view.type === "tac") {
    return (
      <TacScreen
        trustee={view.trustee}
        onBack={() => setView({ type: "remove-confirm", trustee: view.trustee })}
        onSuccess={() => {
          removeTrustee(view.trustee.name);
        }}
      />
    );
  }

  return (
    <PhoneShell title="My Trustees">
      <div className="px-4 pt-5 pb-6 space-y-4">
        <p className="text-sm text-muted-foreground -mt-1">People protecting your account</p>

        <div className="bg-primary-soft border border-primary/20 rounded-2xl px-4 py-3.5">
          <p className="text-sm text-primary font-medium leading-snug">
            Your Trustees can review flagged transactions to keep you safe.
          </p>
        </div>

        <div className="space-y-3">
          {trustees.map((t) => (
            <button
              key={t.name}
              onClick={() => setView({ type: "detail", trustee: t })}
              className="w-full bg-card rounded-2xl border border-border px-4 py-4 flex items-center gap-3 shadow-card text-left"
            >
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {t.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.relation} · {t.city}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Last active: {t.lastActive}</p>
              </div>
              <span className="bg-success-soft text-success text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                {t.status}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setView({ type: "add-form" })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-primary/30 bg-primary-soft text-primary text-sm font-medium"
        >
          <Plus size={16} />
          Change Trustee
        </button>
      </div>
    </PhoneShell>
  );
}

// ─── Add Trustee Form ─────────────────────────────────────────────────────────

function AddTrusteeForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");

  const canSubmit = name.trim() && phone.trim() && relation;

  return (
    <PhoneShell title="Add a Trustee" showBack onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
          <p className="text-sm text-amber-800 font-medium leading-snug">
            You currently have one active Trustee. Adding a new Trustee will replace Ahmad Hafizi.
          </p>
        </div>

        <p className="text-sm text-muted-foreground -mt-2 leading-snug">
          Invite someone you trust to help protect your account
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmad Hafizi"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60 1x-xxxx xxxx"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Relationship</label>
            <div className="relative">
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground"
              >
                <option value="" disabled>Select relationship</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => onSuccess(name.trim())}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send Invite
        </button>
      </div>
    </PhoneShell>
  );
}

// ─── Add Success Screen ────────────────────────────────────────────────────────

function AddSuccessScreen({ name, onDone }: { name: string; onDone: () => void }) {
  return (
    <PhoneShell hideNav>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-44px)] px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-success-soft flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-3">Invitation Sent</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">{name}</span> will receive an invitation to become your Trustee. They must accept before protection is active.
        </p>

        <button
          onClick={onDone}
          className="mt-10 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Back to Trustees
        </button>
      </div>
    </PhoneShell>
  );
}

// ─── Trustee Detail Screen ────────────────────────────────────────────────────

function TrusteeDetailScreen({
  trustee,
  onBack,
  onRemove,
  modal,
}: {
  trustee: Trustee;
  onBack: () => void;
  onRemove: () => void;
  modal?: React.ReactNode;
}) {
  return (
    <PhoneShell title={trustee.name} showBack onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-4">
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mb-3">
            {trustee.initials}
          </div>
          <h2 className="text-lg font-bold text-foreground">{trustee.name}</h2>
          <p className="text-sm text-muted-foreground">{trustee.relation} · {trustee.city}</p>
          <span className="mt-2 bg-success-soft text-success text-[11px] font-semibold px-3 py-1 rounded-full">
            {trustee.status}
          </span>
        </div>

        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Relationship</span>
            <span className="text-sm font-medium text-foreground">{trustee.relation}</span>
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">City</span>
            <span className="text-sm font-medium text-foreground">{trustee.city}</span>
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Active</span>
            <span className="text-sm font-medium text-foreground">{trustee.lastActive}</span>
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-sm font-medium text-success">{trustee.status}</span>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="w-full py-3.5 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-semibold"
        >
          Remove Trustee
        </button>
      </div>

      {modal}
    </PhoneShell>
  );
}

// ─── Remove Confirm Modal ─────────────────────────────────────────────────────

function RemoveConfirmModal({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40">
      <div className="w-full bg-background rounded-t-3xl px-5 pt-6 pb-10 shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">Remove Trustee?</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Removing <span className="font-semibold text-foreground">{name}</span> means they will no longer protect your account from suspicious transactions.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border border-border bg-muted text-foreground text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl bg-destructive text-white text-sm font-semibold"
          >
            Yes, Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAC Verification Screen ──────────────────────────────────────────────────

const MOCK_TAC = "123456";

function TacScreen({
  trustee,
  onBack,
  onSuccess,
}: {
  trustee: Trustee;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [resent, setResent] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(false);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && char) {
      const entered = [...next].join("");
      if (entered === MOCK_TAC) {
        setSuccess(true);
        setTimeout(() => onSuccess(), 1500);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <PhoneShell title="Verify Your Identity" showBack onBack={onBack}>
      <div className="px-4 pt-5 pb-8 flex flex-col">
        <p className="text-sm text-muted-foreground leading-snug mb-1 -mt-2">
          Enter the 6-digit TAC sent to your registered phone number for security verification.
        </p>

        <p className="text-sm font-semibold text-foreground mt-4 mb-6">+60 12-xxx 6789</p>

        <div
          className={`flex gap-2.5 justify-center mb-2 ${shake ? "animate-shake" : ""}`}
          style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 rounded-xl border-2 text-center text-xl font-bold bg-background focus:outline-none transition-colors
                ${error ? "border-destructive text-destructive" : d ? "border-primary text-primary" : "border-border text-foreground"}
                ${success ? "border-success text-success" : ""}
                ${shake ? "animate-shake" : ""}
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs text-destructive mt-1">
            Incorrect TAC. Please try again.
          </p>
        )}

        {success && (
          <p className="text-center text-xs text-success mt-1 font-medium">
            Trustee removed successfully
          </p>
        )}

        <button
          onClick={handleResend}
          className="mt-4 text-center text-sm text-primary font-medium self-center"
        >
          Resend TAC
        </button>

        {resent && (
          <div className="mt-3 mx-auto px-4 py-2 bg-foreground text-background text-xs font-medium rounded-full">
            TAC resent
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </PhoneShell>
  );
}
