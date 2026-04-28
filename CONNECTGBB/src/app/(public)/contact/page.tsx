"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contactSchemas = {
  general: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(10, "Message must be at least 10 characters"),
  }),
  partnership: z.object({
    name: z.string().min(1, "Name is required"),
    organization: z.string().min(1, "Organization is required"),
    email: z.string().email("Invalid email"),
    partnershipType: z.string().min(1, "Partnership type is required"),
    message: z.string().min(10, "Message must be at least 10 characters"),
  }),
  report: z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email"),
    concernType: z.string().min(1, "Concern type is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    url: z.string().url().optional().or(z.literal("")),
  }),
};

type ContactForm = {
  general: z.infer<typeof contactSchemas.general>;
  partnership: z.infer<typeof contactSchemas.partnership>;
  report: z.infer<typeof contactSchemas.report>;
};

type TabType = "general" | "partnership" | "report";

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<ContactForm[TabType]>({
    resolver: zodResolver(contactSchemas[activeTab]),
  });

  const onSubmit = async (data: ContactForm[TabType]) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, ...data }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to send message. Please try again.");
      }

      setSubmitSuccess(true);
      form.reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "general" as const, label: "General Support" },
    { id: "partnership" as const, label: "Partnership Inquiry" },
    { id: "report" as const, label: "Report a Concern" },
  ];

  const renderForm = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name</label>
              <input
                {...form.register("name")}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
              <input
                {...form.register("email")}
                type="email"
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Subject</label>
              <input
                {...form.register("subject")}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.subject && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.subject.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Message</label>
              <textarea
                {...form.register("message")}
                rows={4}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.message && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.message.message}</p>
              )}
            </div>
          </div>
        );
      case "partnership":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name</label>
              <input
                {...form.register("name")}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Organization</label>
              <input
                {...form.register("organization")}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.organization && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.organization.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
              <input
                {...form.register("email")}
                type="email"
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Partnership Type</label>
              <select
                {...form.register("partnershipType")}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              >
                <option value="">Select type</option>
                <option value="sponsor">Sponsor</option>
                <option value="coach">Coach</option>
                <option value="venue">Venue</option>
                <option value="other">Other</option>
              </select>
              {form.formState.errors.partnershipType && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.partnershipType.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Message</label>
              <textarea
                {...form.register("message")}
                rows={4}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.message && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.message.message}</p>
              )}
            </div>
          </div>
        );
      case "report":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name (optional)</label>
              <input
                {...form.register("name")}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
              <input
                {...form.register("email")}
                type="email"
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Concern Type</label>
              <select
                {...form.register("concernType")}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              >
                <option value="">Select type</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
              {form.formState.errors.concernType && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.concernType.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
              <textarea
                {...form.register("description")}
                rows={4}
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.description && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">URL (optional)</label>
              <input
                {...form.register("url")}
                type="url"
                className="w-full bg-[var(--surface)] border border-white/10 rounded-lg px-3 py-2 text-[var(--foreground)]"
              />
              {form.formState.errors.url && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.url.message}</p>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8 text-center">Contact Us</h1>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {renderForm()}

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{submitError}</p>
          </div>
        )}

        {submitSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400">Message sent successfully! We'll get back to you soon.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--brand-primary)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
