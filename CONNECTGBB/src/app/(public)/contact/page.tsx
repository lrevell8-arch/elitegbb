"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorState, SectionCard } from "@/components/ui";

const contactPaths = [
  { key: "support", label: "General Support" },
  { key: "partnership", label: "Partnership Inquiry" },
  { key: "concern", label: "Report a Concern" },
] as const;

type ContactPath = (typeof contactPaths)[number]["key"];

const schema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  organization: z.string().optional(),
  subject: z.string().min(3, "Please provide a subject."),
  message: z.string().min(10, "Please include more detail."),
});

type ContactFormValues = z.infer<typeof schema>;

export default function ContactPage() {
  const [path, setPath] = useState<ContactPath>("support");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.info("Contact submission", { ...values, path });
      setSubmitted(true);
      reset();
    } catch {
      setSubmitError("Unable to send your message right now. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Contact ConnectGBB" description="Choose the right path and we will route your request to the correct team.">
        <div className="flex flex-wrap gap-2">
          {contactPaths.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setPath(item.key);
                setSubmitted(false);
              }}
              className={`rounded-md px-3 py-2 text-sm ${path === item.key ? "bg-[var(--brand-primary)] text-white" : "border border-white/15 text-white/75"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </SectionCard>

      {submitError ? (
        <ErrorState title="Submission failed" description={submitError} onRetry={() => setSubmitError(null)} />
      ) : null}

      {submitted ? (
        <SectionCard title="Message sent" description="Thank you - our team will follow up shortly." />
      ) : (
        <SectionCard title="Send a message" description="Please complete the form below.">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-white/75">
              Name
              <input {...register("name")} className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
              {errors.name ? <span className="mt-1 block text-xs text-[var(--brand-secondary)]">{errors.name.message}</span> : null}
            </label>
            <label className="text-sm text-white/75">
              Email
              <input {...register("email")} className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
              {errors.email ? <span className="mt-1 block text-xs text-[var(--brand-secondary)]">{errors.email.message}</span> : null}
            </label>
            {path !== "support" ? (
              <label className="text-sm text-white/75 md:col-span-2">
                Organization
                <input {...register("organization")} className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
              </label>
            ) : null}
            <label className="text-sm text-white/75 md:col-span-2">
              Subject
              <input {...register("subject")} className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
              {errors.subject ? <span className="mt-1 block text-xs text-[var(--brand-secondary)]">{errors.subject.message}</span> : null}
            </label>
            <label className="text-sm text-white/75 md:col-span-2">
              Message
              <textarea {...register("message")} rows={6} className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
              {errors.message ? <span className="mt-1 block text-xs text-[var(--brand-secondary)]">{errors.message.message}</span> : null}
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {isSubmitting ? "Sending..." : "Submit"}
              </button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
