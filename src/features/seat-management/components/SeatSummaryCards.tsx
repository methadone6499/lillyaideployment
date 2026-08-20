import { UsageProgressCard } from "./UsageProgressCard";

type SeatSummaryCardsProps = {
  occupiedSeats: number | null;
  totalSeats: number | null;
  availableSeats: number | null;
  activeSeats: number | null;
  disabledSeats: number | null;
  pendingInvitationSeats: number | null;
};

export function SeatSummaryCards({
  occupiedSeats,
  totalSeats,
  availableSeats,
  activeSeats,
  disabledSeats,
  pendingInvitationSeats,
}: SeatSummaryCardsProps) {
  return (
    <section aria-label="Seat summary" className="mt-9">
      <UsageProgressCard
        title="Seats"
        used={occupiedSeats}
        total={totalSeats}
        usedSuffix="seats used"
        remainder={availableSeats}
        remainderSuffix="available"
        footerStats={[
          { value: activeSeats, label: "Active" },
          { value: disabledSeats, label: "Disabled" },
          { value: pendingInvitationSeats, label: "Pending Invitations" },
        ]}
      />
    </section>
  );
}
