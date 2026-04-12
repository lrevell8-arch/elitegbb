import PageLayout from "@/components/PageLayout";

const profileFields = [
  "Program and level",
  "Recruiting needs",
  "Contact preferences",
  "Verification status",
];

export default function CoachProfilePage() {
  return (
    <PageLayout
      title="Coach Profile"
      subtitle="Keep program details and recruiting needs up to date for verified visibility."
      eyebrow="Coach"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {profileFields.map((field) => (
          <div key={field} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{field}</p>
            <p className="mt-2 text-xs text-white/60">Editable module</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
