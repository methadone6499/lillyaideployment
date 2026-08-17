import { z } from "zod";

export const seatStatusSchema = z.enum(["active", "disabled"]);

export const companySeatSchema = z
  .object({
    id: z.string().min(1),
    userName: z.string().min(1),
    userEmail: z.string().email(),
    reportQuota: z.number().int().nonnegative(),
    usedReports: z.number().int().nonnegative(),
    status: seatStatusSchema,
  })
  .strict()
  .refine((seat) => seat.usedReports <= seat.reportQuota, {
    message: "Used reports cannot exceed the report quota.",
    path: ["usedReports"],
  });

export const companySeatsSchema = z.array(companySeatSchema);

const seatEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid company email address.");

export const addSeatFormSchema = z
  .object({
    userEmail: seatEmailSchema,
  })
  .strict();

export const editSeatFormSchema = z
  .object({
    userEmail: seatEmailSchema,
    reportQuota: z.coerce
      .number<number>()
      .int("Report quota must be a whole number.")
      .nonnegative("Report quota cannot be negative."),
    usedReports: z.number().int().nonnegative(),
    status: seatStatusSchema,
  })
  .strict()
  .refine((seat) => seat.reportQuota >= seat.usedReports, {
    message: "Report quota cannot be lower than reports already used.",
    path: ["reportQuota"],
  });

export type SeatStatus = z.infer<typeof seatStatusSchema>;
export type CompanySeat = z.infer<typeof companySeatSchema>;
export type AddSeatFormValues = z.infer<typeof addSeatFormSchema>;
export type EditSeatFormValues = z.infer<typeof editSeatFormSchema>;
