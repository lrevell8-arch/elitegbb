import PageLayout from "@/components/PageLayout";

const faqs = [
  {
    question: "How do I claim a player profile?",
    answer: "Submit a claim request, verify ownership via email or coach confirmation, then unlock editing."
  },
  {
    question: "What safety measures are in place?",
    answer: "Coach-player messages are gated by parent approval for minors and logged for moderation."
  },
  {
    question: "Can I upgrade or cancel anytime?",
    answer: "Yes. Memberships are managed in Stripe with prorated upgrades and scheduled cancellations."
  },
];

export default function FAQPage() {
  return (
    <PageLayout
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about membership, training access, and recruiting workflows."
      eyebrow="FAQ"
    >
      <section className="grid gap-4">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
            <p className="mt-2 text-sm text-white/70">{faq.answer}</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
