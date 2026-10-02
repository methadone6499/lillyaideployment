type AdminRequestIdProps = {
  requestId?: string | null;
};

export function AdminRequestId({ requestId }: AdminRequestIdProps) {
  if (!requestId) {
    return null;
  }

  return (
    <span className="block text-helper text-text-step">
      Reference: {requestId}
    </span>
  );
}
