"use client";

import { Button } from "@/components/ui";
import { PlusIcon } from "@/components/ui/icons";
import { useMemo, useState } from "react";
import { initialCompanySeats } from "../data/seatManagementData";
import {
  companySeatSchema,
  type AddSeatFormValues,
  type CompanySeat,
  type EditSeatFormValues,
  type SeatStatus,
} from "../schemas/seatManagementSchemas";
import { AddSeatDialog } from "./AddSeatDialog";
import { EditSeatDialog } from "./EditSeatDialog";
import { SeatListTable } from "./SeatListTable";
import { SeatSummaryCards } from "./SeatSummaryCards";

function formatSeatUserName(userEmail: string): string {
  const localPart = userEmail.split("@")[0];
  const words = localPart.split(/[._-]+/).filter(Boolean);

  if (words.length === 0) {
    return "New User";
  }

  return words
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function SeatManagementContent() {
  const [seats, setSeats] = useState<CompanySeat[]>(() =>
    initialCompanySeats.map((seat) => ({ ...seat })),
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<CompanySeat | null>(null);

  const summary = useMemo(() => {
    const activeSeats = seats.filter(
      (seat) => seat.status === "active",
    ).length;

    return {
      totalSeats: seats.length,
      activeSeats,
      disabledSeats: seats.length - activeSeats,
    };
  }, [seats]);

  const handleStatusChange = (seatId: string, status: SeatStatus) => {
    setSeats((currentSeats) =>
      currentSeats.map((seat) =>
        seat.id === seatId ? { ...seat, status } : seat,
      ),
    );
  };

  const handleAddSeat = (values: AddSeatFormValues): string | null => {
    const emailExists = seats.some(
      (seat) => seat.userEmail.toLowerCase() === values.userEmail,
    );

    if (emailExists) {
      return "A company seat already exists for this email address.";
    }

    const seat = companySeatSchema.parse({
      id: `seat-${crypto.randomUUID()}`,
      userName: formatSeatUserName(values.userEmail),
      userEmail: values.userEmail,
      reportQuota: 0,
      usedReports: 0,
      status: "active",
    });

    setSeats((currentSeats) => [...currentSeats, seat]);
    return null;
  };

  const handleEditSeat = (
    seatId: string,
    values: EditSeatFormValues,
  ): string | null => {
    const emailExists = seats.some(
      (seat) =>
        seat.id !== seatId &&
        seat.userEmail.toLowerCase() === values.userEmail,
    );

    if (emailExists) {
      return "A company seat already exists for this email address.";
    }

    setSeats((currentSeats) =>
      currentSeats.map((seat) =>
        seat.id === seatId
          ? companySeatSchema.parse({
              ...seat,
              userEmail: values.userEmail,
              reportQuota: values.reportQuota,
              status: values.status,
            })
          : seat,
      ),
    );
    return null;
  };

  return (
    <>
      <div className="mt-11 flex flex-col gap-6 lg:mt-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[32px] leading-tight font-medium text-white sm:text-page-title">
            Seat Management
          </h1>
          <p className="mt-4 max-w-[760px] text-label leading-relaxed text-text-body sm:mt-6 sm:text-body-lg">
            Quickly create seats, manage users, enable/disable accounts, and
            control report quotas.
          </p>
        </div>

        <Button
          leadingIcon={<PlusIcon />}
          onClick={() => setIsAddDialogOpen(true)}
          className="w-full shrink-0 sm:w-auto"
        >
          Create Seat
        </Button>
      </div>

      <SeatSummaryCards {...summary} />

      <SeatListTable
        seats={seats}
        onEditSeat={(seat) => setEditingSeat(seat)}
        onStatusChange={handleStatusChange}
      />

      {isAddDialogOpen ? (
        <AddSeatDialog
          open
          onClose={() => setIsAddDialogOpen(false)}
          onConfirm={handleAddSeat}
        />
      ) : null}

      {editingSeat ? (
        <EditSeatDialog
          key={editingSeat.id}
          open
          seat={editingSeat}
          onClose={() => setEditingSeat(null)}
          onConfirm={handleEditSeat}
        />
      ) : null}
    </>
  );
}
