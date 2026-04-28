"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const roleSchema = z.object({
  role: z.enum(["player", "parent", "coach"], {
    required_error: "Please select a role",
  }),
});

const accountSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  acceptTOS: z.boolean().refine(val => val === true, "You must accept the Terms of Service"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  // Player specific
  position: z.string().optional(),
  gradYear: z.string().optional(),
  school: z.string().optional(),
  // Coach specific
  organization: z.string().optional(),
  title: z.string().optional(),
});

type RoleForm = z.infer<typeof roleSchema>;
type AccountForm = z.infer<typeof accountSchema>;
type ProfileForm = z.infer<typeof profileSchema>;

const steps = [
  { id: "role", title: "Select Role" },
  { id: "account", title: "Create Account" },
  { id: "profile", title: "Profile Basics" },
  { id: "verification", title: "Verification" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    role?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    gradYear?: string;
    school?: string;
    organization?: string;
    title?: string;
  }>({});

  const roleForm = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const handleRoleSubmit = (data: RoleForm) => {
    setFormData(prev => ({ ...prev, role: data.role }));
    setCurrentStep(1);
  };

  const handleAccountSubmit = async (data: AccountForm) => {
    setFormData(prev => ({
      ...prev,
      email: data.email,
      password: data.password,
    }));

    // For now, simulate account creation
    // In real implementation, this would call NextAuth signUp or Supabase auth
    setCurrentStep(2);
  };

  const handleProfileSubmit = (data: ProfileForm) => {
    setFormData(prev => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      gradYear: data.gradYear,
      school: data.school,
      organization: data.organization,
      title: data.title,
    }));
    setCurrentStep(3);
  };

  const handleVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate verification process
      // In real implementation, this would handle plan selection or coach verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(4); // Complete
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Join ConnectGBB
              </h2>
              <p className="text-[var(--foreground)]/70">
                Select your role to get started
              </p>
            </div>

            <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4">
              <div className="grid gap-3">
                {[
                  { value: "player", label: "Player", desc: "High school or college basketball player" },
                  { value: "parent", label: "Parent", desc: "Parent or guardian of a player" },
                  { value: "coach", label: "Coach", desc: "Basketball coach or recruiter" },
                ].map((role) => (
                  <label
                    key={role.value}
                    className="flex items-center p-4 border border-white/10 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface)] cursor-pointer transition-colors"
                  >
                    <input
                      {...roleForm.register("role")}
                      type="radio"
                      value={role.value}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">{role.label}</div>
                      <div className="text-sm text-[var(--foreground)]/70">{role.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {roleForm.formState.errors.role && (
                <p className="text-red-400 text-sm">{roleForm.formState.errors.role.message}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[var(--brand-primary)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Create Your Account
              </h2>
              <p className="text-[var(--foreground)]/70">
                Set up your login credentials
              </p>
            </div>

            <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Email
                </label>
                <input
                  {...accountForm.register("email")}
                  type="email"
                  className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                  placeholder="Enter your email"
                />
                {accountForm.formState.errors.email && (
                  <p className="text-red-400 text-sm mt-1">{accountForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Password
                </label>
                <input
                  {...accountForm.register("password")}
                  type="password"
                  className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                  placeholder="Create a password"
                />
                {accountForm.formState.errors.password && (
                  <p className="text-red-400 text-sm mt-1">{accountForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Confirm Password
                </label>
                <input
                  {...accountForm.register("confirmPassword")}
                  type="password"
                  className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                  placeholder="Confirm your password"
                />
                {accountForm.formState.errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{accountForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <input
                  {...accountForm.register("acceptTOS")}
                  type="checkbox"
                  className="mt-1"
                />
                <label className="text-sm text-[var(--foreground)]/70">
                  I accept the{" "}
                  <Link href="/terms" className="text-[var(--brand-primary)] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[var(--brand-primary)] hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {accountForm.formState.errors.acceptTOS && (
                <p className="text-red-400 text-sm">{accountForm.formState.errors.acceptTOS.message}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 border border-white/10 text-[var(--foreground)] py-3 px-4 rounded-lg font-medium hover:bg-[var(--surface-muted)] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[var(--brand-primary)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Tell Us About Yourself
              </h2>
              <p className="text-[var(--foreground)]/70">
                Help us personalize your experience
              </p>
            </div>

            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    First Name
                  </label>
                  <input
                    {...profileForm.register("firstName")}
                    type="text"
                    className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                    placeholder="First name"
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-red-400 text-sm mt-1">{profileForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Last Name
                  </label>
                  <input
                    {...profileForm.register("lastName")}
                    type="text"
                    className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                    placeholder="Last name"
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-red-400 text-sm mt-1">{profileForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {formData.role === "player" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Position
                    </label>
                    <select
                      {...profileForm.register("position")}
                      className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                    >
                      <option value="">Select position</option>
                      <option value="PG">Point Guard</option>
                      <option value="SG">Shooting Guard</option>
                      <option value="SF">Small Forward</option>
                      <option value="PF">Power Forward</option>
                      <option value="C">Center</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Graduation Year
                      </label>
                      <input
                        {...profileForm.register("gradYear")}
                        type="number"
                        min="2024"
                        max="2030"
                        className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                        placeholder="2025"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        School
                      </label>
                      <input
                        {...profileForm.register("school")}
                        type="text"
                        className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                        placeholder="School name"
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.role === "coach" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Organization
                    </label>
                    <input
                      {...profileForm.register("organization")}
                      type="text"
                      className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                      placeholder="School, club, or organization"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Title
                    </label>
                    <input
                      {...profileForm.register("title")}
                      type="text"
                      className="w-full bg-[var(--surface-muted)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none"
                      placeholder="Head Coach, Assistant Coach, etc."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border border-white/10 text-[var(--foreground)] py-3 px-4 rounded-lg font-medium hover:bg-[var(--surface-muted)] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[var(--brand-primary)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Verification
              </h2>
              <p className="text-[var(--foreground)]/70">
                {formData.role === "player" || formData.role === "parent"
                  ? "Complete your profile to start connecting with coaches"
                  : "Verify your coaching credentials to access recruiting tools"
                }
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {formData.role === "player" && (
                <div className="bg-[var(--surface-muted)] border border-white/10 rounded-lg p-4">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">Complete Your Profile</h3>
                  <p className="text-sm text-[var(--foreground)]/70 mb-3">
                    Add photos, measurements, and academic info to attract coach attention.
                  </p>
                  <div className="text-sm text-[var(--foreground)]/60">
                    • Upload profile photo and action shots<br/>
                    • Add height, weight, wingspan measurements<br/>
                    • Include GPA and academic achievements
                  </div>
                </div>
              )}

              {formData.role === "parent" && (
                <div className="bg-[var(--surface-muted)] border border-white/10 rounded-lg p-4">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">Player Profile Setup</h3>
                  <p className="text-sm text-[var(--foreground)]/70 mb-3">
                    Create and manage your player's recruiting profile.
                  </p>
                  <div className="text-sm text-[var(--foreground)]/60">
                    • Set up player profile with photos and stats<br/>
                    • Control privacy and coach communications<br/>
                    • Track recruiting interest and offers
                  </div>
                </div>
              )}

              {formData.role === "coach" && (
                <div className="bg-[var(--surface-muted)] border border-white/10 rounded-lg p-4">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">Coach Verification</h3>
                  <p className="text-sm text-[var(--foreground)]/70 mb-3">
                    Verify your coaching credentials to unlock recruiting features.
                  </p>
                  <div className="text-sm text-[var(--foreground)]/60">
                    • Submit coaching resume and credentials<br/>
                    • Verify team affiliation and contact info<br/>
                    • Complete background check process
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 border border-white/10 text-[var(--foreground)] py-3 px-4 rounded-lg font-medium hover:bg-[var(--surface-muted)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerification}
                  disabled={isLoading}
                  className="flex-1 bg-[var(--brand-primary)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Complete Setup"}
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Welcome to ConnectGBB!
              </h2>
              <p className="text-[var(--foreground)]/70">
                Your account has been created successfully. You can now start exploring the platform.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block w-full bg-[var(--brand-primary)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
              >
                Go to Dashboard
              </Link>

              <Link
                href="/browse"
                className="block w-full border border-white/10 text-[var(--foreground)] py-3 px-4 rounded-lg font-medium hover:bg-[var(--surface-muted)] transition-colors"
              >
                Browse Players
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">ConnectGBB</h1>
        </div>

        {/* Progress */}
        {currentStep < 4 && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-[var(--foreground)]/60 mb-2">
              {steps.map((step, index) => (
                <span key={step.id} className={index <= currentStep ? "text-[var(--brand-primary)]" : ""}>
                  {step.title}
                </span>
              ))}
            </div>
            <div className="w-full bg-[var(--surface-muted)] rounded-full h-2">
              <div
                className="bg-[var(--brand-primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-8">
          {renderStep()}
        </div>

        {/* Sign in link */}
        {currentStep < 4 && (
          <div className="text-center mt-8">
            <p className="text-sm text-[var(--foreground)]/60">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--brand-primary)] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
