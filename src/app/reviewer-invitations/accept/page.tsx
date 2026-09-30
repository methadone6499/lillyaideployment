import type { Metadata } from "next";

import { ReviewerInvitationAcceptPage } from "@/features/reviewer";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default function ReviewerInvitationAcceptRoutePage() {
  return <ReviewerInvitationAcceptPage />;
}
