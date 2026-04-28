"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        // Redirect will happen automatically
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">ConnectGBB</h1>
        </div>

        {/* Card */}
        <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)] text-center mb-6">
            Sign in to ConnectGBB
          </h2>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Email
              </label>
              <input
                {...form.register("email")}
                type="email"
                className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                placeholder="Enter your email"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Password
              </label>
              <input
                {...form.register("password")}
                type="password"
                className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                placeholder="Enter your password"
              />
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="text-right">
              <Link href="/login/reset" className="text-sm text-[var(--brand-primary)] hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--brand-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--surface)] text-[var(--foreground)]/60">or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/onboarding"
                className="text-[var(--brand-primary)] hover:underline"
              >
                Don't have an account? Join free
              </Link>
            </div>
          </div>
        </div>

        {/* Trust line */}
        <div className="text-center mt-8">
          <p className="text-sm text-[var(--foreground)]/60">
            Safe messaging. Verified coaches. Protected profiles.
          </p>
        </div>
      </div>
    </div>
  );
}
