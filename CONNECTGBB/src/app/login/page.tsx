"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_DASHBOARD_PATH, ROLE_LABELS, type RoleKey } from "@/lib/roles";

const roles: RoleKey[] = ["player", "parent", "coach", "organizer", "admin"];

export default function LoginPage() {
  const { signIn, signUp, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    setStatus(error ?? "Signed in. Redirecting to your dashboard.");
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    setStatus(
      error ?? "Account created. Check your email to confirm and complete onboarding."
    );
  };

  return (
    <PageLayout
      title="Member Login"
      subtitle="Sign in to access training, recruiting workflows, and community features."
      eyebrow="Authentication"
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
          <h2 className="text-lg font-semibold text-white">Sign in</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="rounded-full bg-[#0134bd] px-4 py-2 text-sm font-semibold text-white"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80"
              >
                Create account
              </button>
            </div>
            {status ? <p className="text-xs text-white/60">{status}</p> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
          <h2 className="text-lg font-semibold text-white">Role-aware routing</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {roles.map((role) => (
              <li key={role} className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">
                {ROLE_LABELS[role]} → {ROLE_DASHBOARD_PATH[role]}
              </li>
            ))}
          </ul>
          {profile ? (
            <p className="mt-4 text-xs text-white/60">
              Current role detected: {ROLE_LABELS[profile.role]}
            </p>
          ) : null}
        </div>
      </section>
    </PageLayout>
  );
}
