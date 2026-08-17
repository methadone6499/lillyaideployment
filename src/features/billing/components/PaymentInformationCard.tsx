import { Card } from "@/components/ui";
import Image from "next/image";
import type { PaymentMethod } from "../schemas/billingSchemas";

type PaymentInformationCardProps = {
  paymentMethod: PaymentMethod;
};

export function PaymentInformationCard({
  paymentMethod,
}: PaymentInformationCardProps) {
  const paymentDetails = [
    ["Full Name", paymentMethod.cardholderName],
    ["Exp. date", paymentMethod.expirationDate],
    [paymentMethod.brand, paymentMethod.lastFour],
  ] as const;

  return (
    <Card className="min-h-[247px] rounded-button p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-card-title font-medium text-white">
          Payment Information
        </h2>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            aria-label="Edit payment method"
            title="Available when billing services are connected"
            className="flex size-10 items-center justify-center rounded-field bg-surface-elevated transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Image src="/billing/edit.svg" alt="" width={20} height={20} />
          </button>
          <button
            type="button"
            aria-label="Remove payment method"
            title="Available when billing services are connected"
            className="flex size-10 items-center justify-center rounded-field bg-[rgba(217,34,67,0.16)] shadow-[0_3.333px_3.333px_rgba(0,0,0,0.25)] transition-colors hover:bg-[rgba(217,34,67,0.24)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d92243]"
          >
            <Image src="/billing/trash.svg" alt="" width={20} height={20} />
          </button>
        </div>
      </div>

      <div className="mt-7 grid items-center gap-6 sm:grid-cols-[189px_minmax(0,1fr)]">
        <div className="relative h-[120px] w-[189px] max-w-full overflow-hidden">
          <Image
            src={paymentMethod.imageSrc}
            alt={`${paymentMethod.brand} ending ${paymentMethod.lastFour}`}
            fill
            sizes="189px"
            className="object-cover"
          />
        </div>

        <dl className="grid gap-5 text-label sm:text-body-lg">
          {paymentDetails.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[auto_1fr] gap-6">
              <dt className="text-white/64">{label}</dt>
              <dd className="font-medium text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}
