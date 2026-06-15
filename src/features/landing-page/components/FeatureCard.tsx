import type { FeatureCardContent } from "../types";

type FeatureCardProps = {
  card: FeatureCardContent;
};

export function FeatureCard({ card }: FeatureCardProps) {
  return (
    <article className="relative min-h-[320px] overflow-hidden rounded-button bg-landing-surface-card sm:min-h-[400px]">
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
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-7 p-8 sm:p-12">
        <h3 className="text-[28px] text-landing-text-heading sm:text-[32px]">
          {card.title}
        </h3>
        <p className="text-landing-body-size leading-6 text-landing-text-subtle">
          {card.description}
        </p>
      </div>
    </article>
  );
}
