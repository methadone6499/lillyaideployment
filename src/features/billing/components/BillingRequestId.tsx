type BillingRequestIdProps = {
  requestId?: string | null;
};

export function BillingRequestId({ requestId }: BillingRequestIdProps) {
  if (!requestId) {
    return null;
  }

  return (
    <p className="text-center text-label leading-normal text-white/48">
      Reference: {requestId}
    </p>
  );
}
