import { ReviewerAssignmentWorkspace } from "@/features/reviewer";

type Props = {
  params: Promise<{ assignmentId: string }>;
};

export default async function ReviewerAssignmentPage({ params }: Props) {
  const { assignmentId } = await params;
  return <ReviewerAssignmentWorkspace assignmentId={assignmentId} />;
}
