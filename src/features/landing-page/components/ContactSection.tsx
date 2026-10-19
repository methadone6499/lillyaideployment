import { contactDetails } from "../data/landingContent";
import { LandingCtaButton, LandingSecondaryButton } from "./LandingCtaButton";
import { MailIcon, PhoneIcon } from "./LandingIcons";
import { LandingSection } from "./LandingSection";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";

function ContactDetail({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a href={href} className="group flex min-w-0 max-w-full items-center gap-4 rounded-[var(--landing-radius-button)] text-landing-text-subtle transition-colors duration-150 hover:text-white motion-reduce:transition-none">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-field bg-surface-elevated">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-label font-medium text-white">{label}</span>
        <span className="break-words text-label leading-6 underline-offset-4 group-hover:underline">{value}</span>
      </div>
    </a>
  );
}

export function ContactSection() {
  return (
    <LandingSection id="contact">
      <div className="mx-auto grid w-full max-w-[723px] grid-cols-1 items-center gap-12 xl:max-w-none xl:grid-cols-2">
        <div className="flex min-w-0 flex-col items-center gap-8 text-center xl:items-start xl:text-left">
          <div className="flex w-full flex-col gap-4">
            <h2 className="text-landing-section-size leading-landing-section-line font-medium tracking-[-0.01em] text-landing-text-heading">
              Get in touch
            </h2>
            <div className="text-landing-body-lg-size leading-landing-body-lg-line text-landing-text-subtle">
              <p>Ready to transform your HTA evaluation process?</p>
              <p>Contact our team today.</p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-6 text-left sm:flex-row sm:flex-wrap sm:justify-center xl:justify-start">
            <ContactDetail
              icon={<PhoneIcon />}
              label="Phone number"
              value={contactDetails.phone}
              href={`tel:${contactDetails.phone.replace(/\s/g, "")}`}
            />
            <div className="hidden h-[42px] w-px bg-border-default sm:block" />
            <ContactDetail
              icon={<MailIcon />}
              label="Email"
              value={contactDetails.email}
              href={`mailto:${contactDetails.email}`}
            />
          </div>
        </div>

        <div className="flex w-full min-w-0 max-w-[723px] flex-col items-center justify-self-center gap-6 rounded-[var(--landing-radius-card)] border border-border-default bg-surface-default p-6 xl:justify-self-end">
          <div className="flex w-full flex-col gap-4">
            <h3 className="text-card-title leading-7 font-medium text-landing-text-heading">
              Premium add-on services
            </h3>
            <p className="text-label leading-6 text-landing-text-subtle">
              {`See how ${BRAND.name} can streamline your HTA evaluation workflow and improve decision-making. Our team will walk you through the platform's capabilities tailored to your organization.`}
            </p>
          </div>

          <div className="h-px w-full bg-border-default" />

          <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <LandingSecondaryButton
              href={`mailto:${contactDetails.email}?subject=${encodeURIComponent(`${BRAND.name} demo request`)}`}
              fullWidth
            >
              Request demo
            </LandingSecondaryButton>
            <LandingCtaButton
              href={`mailto:${contactDetails.email}`}
              fullWidth
              showArrow={false}
            >
              Contact sales
            </LandingCtaButton>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
