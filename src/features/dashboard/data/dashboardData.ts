import type {
  DashboardNotification,
  DashboardPagination,
  DashboardQuota,
  DashboardReport,
} from "../types";

export const dashboardQuota: DashboardQuota = {
  used: 20,
  total: 30,
  additionalReportPrice: "£95",
};

export const dashboardNotifications: DashboardNotification[] = [
  {
    id: "notif-1",
    message: "Your report is generated",
    reportName: "Panadol - Mild Fever",
    timestamp: "24 mins ago",
  },
  {
    id: "notif-2",
    message: "Your report failed",
    reportName: "Metformin - Diabetes",
    timestamp: "1 hour ago",
  },
  {
    id: "notif-3",
    message: "report has returned",
    reportName: "Panadol - Mild Fever",
    timestamp: "1 hour ago",
  },
];

export const dashboardReports: DashboardReport[] = [
  {
    id: "report-1",
    name: "Panadol - Mild Fever",
    dateTime: "11-05-2026, 1:21 AM",
    status: "completed",
  },
  {
    id: "report-2",
    name: "Nusinersen - Spinal Mascular Atrophy",
    dateTime: "11-05-2026, 1:21 AM",
    status: "sent_for_review",
  },
  {
    id: "report-3",
    name: "Pembrolizumab - Non-Small Cell Lung Cancer",
    dateTime: "11-05-2026, 1:21 AM",
    status: "in_progress",
  },
  {
    id: "report-4",
    name: "Metformin - Type 2 Diabetes",
    dateTime: "11-05-2026, 1:21 AM",
    status: "completed",
  },
  {
    id: "report-5",
    name: "Dupilumab - Atopic Dermatitis",
    dateTime: "11-05-2026, 1:21 AM",
    status: "reviewed",
  },
  {
    id: "report-6",
    name: "Dapagliflozin - Heart Failure",
    dateTime: "11-05-2026, 1:21 AM",
    status: "failed",
  },
  {
    id: "report-7",
    name: "Osimertinib - EGFR Mutant NSCLC",
    dateTime: "10-05-2026, 4:08 PM",
    status: "completed",
  },
  {
    id: "report-8",
    name: "Secukinumab - Psoriatic Arthritis",
    dateTime: "10-05-2026, 11:42 AM",
    status: "sent_for_review",
  },
  {
    id: "report-9",
    name: "Empagliflozin - Chronic Kidney Disease",
    dateTime: "09-05-2026, 9:15 AM",
    status: "in_progress",
  },
  {
    id: "report-10",
    name: "Atezolizumab - Triple-Negative Breast Cancer",
    dateTime: "09-05-2026, 7:03 AM",
    status: "reviewed",
  },
  {
    id: "report-11",
    name: "Rivaroxaban - Atrial Fibrillation",
    dateTime: "08-05-2026, 6:30 PM",
    status: "completed",
  },
  {
    id: "report-12",
    name: "Trastuzumab - HER2-Positive Breast Cancer",
    dateTime: "08-05-2026, 2:11 PM",
    status: "failed",
  },
];

export const dashboardPagination: DashboardPagination = {
  currentPage: 1,
  totalPages: 2,
};
