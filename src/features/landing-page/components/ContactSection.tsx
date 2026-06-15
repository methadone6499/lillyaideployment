import { contactDetails } from "../data/landingContent";
import { LandingCtaButton, LandingSecondaryButton } from "./LandingCtaButton";
import { MailIcon, PhoneIcon } from "./LandingIcons";
import { LandingSection } from "./LandingSection";
import type { ReactNode } from "react";

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
    <a href={href} className="flex items-center gap-4">
      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-card bg-surface-elevated">
        {icon}
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-label font-medium text-white">{label}</span>
        <span className="text-label text-text-muted">{value}</span>
      </div>
    </a>
  );
}

export function ContactSection() {
  return (
    <LandingSection id="contact">
      <div className="grid grid-cols-1 items-center gap-16 xl:grid-cols-[minmax(0,573px)_minmax(0,723px)] xl:gap-36">
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-9">
            <h2 className="text-landing-section-size leading-landing-section-line text-landing-text-heading">
              Get in Touch
            </h2>
            <div className="text-landing-body-lg-size leading-landing-body-lg-line text-text-body">
              <p>Ready to transform your HTA evaluation process?</p>
              <p>Contact our team today.</p>
            </div>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <ContactDetail
              icon={<PhoneIcon />}
              label="Phone Number"
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

        <div className="flex flex-col items-center gap-9 rounded-button border border-border-default bg-surface-default px-6 pb-7 pt-8">
          <div className="flex w-full max-w-[667px] flex-col gap-5">
            <h3 className="text-[28px] leading-[72px] text-landing-text-heading">
              Premium Add-on Services
            </h3>
            <p className="text-label leading-[26px] text-text-step">
              See how Lilly can streamline your HTA evaluation workflow and
              improve decision-making. Our team will walk you through the
              platform&apos;s capabilities tailored to your organization.
            </p>
          </div>

          <div className="h-px w-full bg-border-default" />

          <div className="flex w-full max-w-[667px] flex-col gap-3.5 sm:flex-row">
            <LandingSecondaryButton
              fullWidth
              className="h-[58px] rounded-card border-border-default"
            >
              Request Demo
            </LandingSecondaryButton>
            <LandingCtaButton
              href={`mailto:${contactDetails.email}`}
              fullWidth
              showArrow={false}
              className="h-[58px] rounded-card"
            >
              Contact Sales
            </LandingCtaButton>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
