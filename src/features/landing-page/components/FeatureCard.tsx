import type { FeatureCardContent } from "../types";

type FeatureCardProps = {
  card: FeatureCardContent;
};

export function FeatureCard({ card }: FeatureCardProps) {
  return (
    <article className="relative min-h-[clamp(320px,20.833vw,400px)] overflow-hidden rounded-button bg-landing-surface-card">
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
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[clamp(20px,1.458vw,28px)] p-[clamp(32px,2.5vw,48px)]">
        <h3 className="text-[clamp(24px,1.667vw,32px)] leading-[1.2] text-landing-text-heading">
          {card.title}
        </h3>
        <p className="text-[clamp(16px,0.938vw,18px)] leading-6 text-landing-text-subtle">
          {card.description}
        </p>
      </div>
    </article>
  );
}
