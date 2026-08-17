import { z } from "zod";

export const companyReportStatusSchema = z.enum([
  "completed",
  "sent_for_review",
  "in_progress",
  "reviewed",
  "failed",
]);

export const companyReportSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    generatedBy: z.string().min(1),
    userEmail: z.string().email(),
    updatedAt: z.string().datetime({ offset: true }),
    status: companyReportStatusSchema,
  })
  .strict();

export const companyReportsSchema = z.array(companyReportSchema);

export type CompanyReportStatus = z.infer<typeof companyReportStatusSchema>;
export type CompanyReport = z.infer<typeof companyReportSchema>;
