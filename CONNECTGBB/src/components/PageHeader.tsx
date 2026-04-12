type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
};

export default function PageHeader({ title, subtitle, eyebrow }: PageHeaderProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0b0b0b] via-[#0b0b0b] to-[#111827] p-10">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#fb6c1d]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">{subtitle}</p>
    </div>
  );
}
