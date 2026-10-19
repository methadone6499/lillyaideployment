import type { FeatureCardContent } from "../types";

type FeatureCardProps = {
  card: FeatureCardContent;
};

export function FeatureCard({ card }: FeatureCardProps) {
  return (
    <article className="relative min-h-[320px] overflow-hidden rounded-[var(--landing-radius-card)] border border-border-default bg-landing-surface-card">
      <div
        className="absolute inset-0 bg-base-black"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.56) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="relative flex min-h-[320px] flex-col justify-end gap-4 p-6">
        <h3 className="text-section-heading leading-8 font-medium text-landing-text-heading">
          {card.title}
        </h3>
        <p className="text-landing-body-size leading-landing-body-line text-white/90">
          {card.description}
        </p>
      </div>
    </article>
  );
}
