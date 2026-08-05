export default function SectionHead({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-[640px] mx-auto text-center mb-10 md:mb-14">
      <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-primary before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary">
        {eyebrow}
      </span>
      <h2 className="mt-3.5 text-[clamp(28px,3.6vw,40px)] font-bold tracking-tight text-ink">{title}</h2>
      {desc && <p className="mt-4 text-[17px] leading-relaxed text-soft">{desc}</p>}
    </div>
  );
}
