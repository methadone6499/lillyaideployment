import { AcceptInvitationPage } from "@/features/company-invitations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default function AcceptInvitationRoutePage() {
  return <AcceptInvitationPage />;
}
