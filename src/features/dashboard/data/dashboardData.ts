import type {
  DashboardNotification,
  DashboardQuota,
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
