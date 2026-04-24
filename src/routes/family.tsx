import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Bell, Shield, Phone } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family Guardian Setup — GOGuardian" },
      { name: "description", content: "Invite a family member to act as your Family Guardian." },
    ],
  }),
  component: FamilySetup,
});

function FamilySetup() {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/alert" });
  };

  return (
    <PhoneShell title="Family Guardian" showBack backTo="/guardian">
      <form onSubmit={handleSubmit} className="px-5 pt-6 space-y-6">
        <div>
          <Label htmlFor="phone" className="text-base font-semibold text-foreground">
            Family member's phone number
          </Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            We'll send them an invite to become your guardian.
          </p>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="+60 12-345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 pl-12 text-base rounded-2xl bg-card"
              required
            />
          </div>
        </div>

        <div className="bg-primary-soft rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Shield size={16} /> What your guardian can see
          </h3>
          <ul className="space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <Bell size={18} className="text-primary mt-0.5 shrink-0" />
              <span>Alerts for transfers above RM200 or to new recipients</span>
            </li>
            <li className="flex items-start gap-3">
              <Eye size={18} className="text-primary mt-0.5 shrink-0" />
              <span>Approve or block flagged transactions on your behalf</span>
            </li>
            <li className="flex items-start gap-3">
              <Shield size={18} className="text-primary mt-0.5 shrink-0" />
              <span>Cannot view your full balance or daily spending</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            Send Invite
          </Button>
          <Link
            to="/alert"
            className="block text-center text-sm text-muted-foreground py-2"
          >
            Skip — Try a demo alert
          </Link>
        </div>
      </form>
    </PhoneShell>
  );
}
