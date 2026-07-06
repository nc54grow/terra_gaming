interface PageHeaderProps {
  eyebrow: string;
  title: string;
  blurb?: string;
}

export default function PageHeader({ eyebrow, title, blurb }: PageHeaderProps) {
  return (
    <div className="border-b border-[#2A251E] px-8 py-8 md:px-12">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-0.5 w-6 bg-[#C84B1F]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C84B1F]">
          {eyebrow}
        </span>
      </div>
      <h1 className="font-display text-5xl tracking-wide text-[#F0EBE1] md:text-6xl text-balance">
        {title}
      </h1>
      {blurb ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#8A8175] text-pretty">
          {blurb}
        </p>
      ) : null}
    </div>
  );
}
