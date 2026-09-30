import type { QueryClient } from "@tanstack/react-query";

import { reviewerQueryKeys } from "../api/reviewerQueryKeys";
import { resetReviewerInvitationToken } from "./reviewerInvitationToken";

export async function clearReviewerSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: reviewerQueryKeys.root });
  queryClient.removeQueries({ queryKey: reviewerQueryKeys.root });
  resetReviewerInvitationToken();
}
