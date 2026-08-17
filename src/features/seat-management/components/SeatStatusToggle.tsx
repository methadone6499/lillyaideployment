import { Switch } from "@/components/ui";
import Image from "next/image";
import type { SeatStatus } from "../schemas/seatManagementSchemas";

type SeatStatusToggleProps = {
  userName: string;
  status: SeatStatus;
  onChange: (status: SeatStatus) => void;
};

export function SeatStatusToggle({
  userName,
  status,
  onChange,
}: SeatStatusToggleProps) {
  const isDisabled = status === "disabled";

  return (
    <Switch
      checked={isDisabled}
      onChange={(nextDisabled) => {
        onChange(nextDisabled ? "disabled" : "active");
      }}
      tone="danger"
      size="large"
      aria-label={`${isDisabled ? "Enable" : "Disable"} seat for ${userName}`}
      checkedIcon={
        <Image
          src="/company-admin/seats/disable-light.svg"
          alt=""
          width={14}
          height={14}
          aria-hidden
        />
      }
      uncheckedIcon={
        <Image
          src="/company-admin/seats/disable-dark.svg"
          alt=""
          width={14}
          height={14}
          aria-hidden
        />
      }
    />
  );
}
