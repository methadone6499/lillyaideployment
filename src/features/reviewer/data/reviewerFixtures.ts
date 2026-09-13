import type {
  ReviewerAssignedReport,
  ReviewerDashboardSnapshot,
  ReviewerKpiCard,
  ReviewerNotification,
  ReviewerReportContentBlock,
  ReviewerReportDetail,
  ReviewerReportSection,
  ReviewerReportStatus,
} from "../types";

const PANADOL_REPORT_ID = "rpt-panadol-mild-fever";

const FIGMA_GENERATED_ON_LABEL =
  "Evidence Report - Generated on Friday, May 22, 2026, 04:27 PM PKT";

const KPI_LABELS = {
  total_assigned: "Total Assigned Reports",
  in_queue: "Reports in Queue",
  in_review: "In Review",
  overdue: "Overdue Reviews",
  completed: "Completed Reviews",
} as const;

const SECTION_OUTLINE = [
  {
    id: "disease",
    title: "Disease Overview",
    description: "Definition, epidemiology, burden, ICD-11 mapping",
  },
  {
    id: "drug",
    title: "Drug Details",
    description: "Detailed pharmaceutical data and specifications",
  },
  {
    id: "clinical",
    title: "Clinical Evidence",
    description:
      "Trial design, endpoints, demographics, and safety from selected clinical literature.",
  },
  {
    id: "economic",
    title: "Economic Evidence",
    description:
      "Cost-effectiveness, budget impact, and pharmacoeconomic findings from selected studies.",
  },
  {
    id: "comparator",
    title: "Competitor Analysis",
    description:
      "Head-to-head and indirect comparisons against selected standard-of-care agents.",
  },
  {
    id: "hta",
    title: "HTA Summary",
    description:
      "Health technology assessment findings and reimbursement considerations.",
  },
  {
    id: "executive",
    title: "Executive Summary",
    description:
      "Key messages and formulary assessment recommendations for decision makers.",
  },
] as const;

const PANADOL_DISEASE_BLOCKS: readonly ReviewerReportContentBlock[] = [
  {
    type: "definition",
    label: "Indication",
    value: "1A00: Fever",
  },
  {
    type: "heading",
    text: "What is Fever?",
  },
  {
    type: "paragraph",
    text: "Fever is a temporary increase in body temperature, often due to an illness. It is a common symptom of many medical conditions, particularly infections.",
  },
  {
    type: "heading",
    text: "Familial Mediterranean Fever",
  },
  {
    type: "paragraph",
    text: "Familial Mediterranean Fever (FMF) is a hereditary autoinflammatory disease predominantly affecting populations from the Mediterranean basin, including Turks, Armenians, Jews, and Arabs. The disease is characterized by recurrent episodes of fever and polyserositis, with severe long-term complications such as renal amyloidosis. The MEFV gene, responsible for FMF, is located on chromosome 16p13.3 and has over 300 identified variants, with specific mutations being more prevalent in certain ethnic groups.",
  },
  {
    type: "subsection",
    heading: "Epidemiology",
    body: "FMF is particularly common in Mediterranean populations, with a significant incidence reported among individuals of Turkish, Armenian, Jewish, and Arab descent. The disease typically manifests in childhood, with 90% of cases beginning before the age of 20, and 65% of patients presenting symptoms before the age of 10.",
  },
  {
    type: "subsection",
    heading: "Disease Onset",
    body: "The onset of FMF is primarily in childhood, with a mean age of onset reported at 32.5 years for adult cases. The frequency of disease flares varies, occurring from once a week to once every three to four months in untreated patients. The clinical presentation includes recurrent episodes of fever, abdominal pain, chest pain, and arthritis, with a notable absence of symptoms during attack-free periods.",
  },
  {
    type: "heading",
    text: "Clinical Presentation",
  },
  {
    type: "paragraph",
    text: "FMF presents with variable clinical features influenced by genetic heterogeneity and environmental factors. The hallmark symptoms include recurrent fever, systemic inflammation, serositis, and arthritis.",
  },
];

const PANADOL_SECTION_BLOCKS: Record<string, readonly ReviewerReportContentBlock[]> =
  {
    disease: PANADOL_DISEASE_BLOCKS,
    drug: [
      {
        type: "paragraph",
        text: "Paracetamol (acetaminophen) is an analgesic and antipyretic used for mild fever and pain. Typical adult oral dosing is 500–1000 mg every 4–6 hours, not exceeding 4 g per day, with hepatic impairment requiring dose adjustment.",
      },
    ],
    clinical: [
      {
        type: "paragraph",
        text: "Selected pediatric and adult studies support antipyretic efficacy versus placebo, with a well-characterized hepatotoxicity risk at supratherapeutic doses. Evidence for febrile-seizure prophylaxis remains limited.",
      },
    ],
    economic: [
      {
        type: "paragraph",
        text: "Generic paracetamol is low cost relative to branded antipyretics. Budget-impact estimates are driven by pack price, dosing frequency, and substitution from ibuprofen in overlapping mild-fever use.",
      },
    ],
    comparator: [
      {
        type: "paragraph",
        text: "Ibuprofen is the primary comparator for infectious fever. Meta-analyses show similar antipyretic effect in children, with differences mainly in adverse-event profile and dosing interval rather than fever clearance.",
      },
    ],
    hta: [
      {
        type: "paragraph",
        text: "Paracetamol is widely reimbursed as standard care for mild fever. HTA considerations focus on safe maximum daily dose communication rather than incremental clinical benefit versus other OTC antipyretics.",
      },
    ],
    executive: [
      {
        type: "paragraph",
        text: "Paracetamol remains an appropriate first-line option for mild fever when used within labeled limits. Reviewer attention should stay on hepatic safety, pediatric dosing, and comparator choice versus ibuprofen.",
      },
    ],
  };

function splitReportName(name: string): { drug: string; indication: string } {
  const separator = " - ";
  const separatorIndex = name.indexOf(separator);

  if (separatorIndex === -1) {
    return { drug: name, indication: name };
  }

  return {
    drug: name.slice(0, separatorIndex),
    indication: name.slice(separatorIndex + separator.length),
  };
}

function buildGenericSectionBlocks(
  sectionId: string,
  title: string,
  name: string,
): readonly ReviewerReportContentBlock[] {
  const { drug, indication } = splitReportName(name);

  if (sectionId === "disease") {
    return [
      {
        type: "definition",
        label: "Indication",
        value: indication,
      },
      {
        type: "paragraph",
        text: `${indication} is the assigned indication for this ${drug} evidence report.`,
      },
    ];
  }

  return [
    {
      type: "paragraph",
      text: `This ${title} section summarizes current evidence for ${drug} in ${indication}.`,
    },
  ];
}

function buildReportSections(
  report: ReviewerAssignedReport,
): readonly ReviewerReportSection[] {
  const isPanadol = report.platformReportId === PANADOL_REPORT_ID;

  return SECTION_OUTLINE.map((outline, index) => ({
    id: outline.id,
    order: index + 1,
    title: outline.title,
    description: outline.description,
    blocks: isPanadol
      ? (PANADOL_SECTION_BLOCKS[outline.id] ?? [])
      : buildGenericSectionBlocks(outline.id, outline.title, report.name),
  }));
}

function buildReportDetail(
  report: ReviewerAssignedReport,
): ReviewerReportDetail {
  return {
    platformReportId: report.platformReportId,
    title: report.name,
    generatedOnLabel: FIGMA_GENERATED_ON_LABEL,
    status: report.status,
    sections: buildReportSections(report),
  };
}

function countByStatus(
  reports: readonly ReviewerAssignedReport[],
  status: ReviewerReportStatus,
): number {
  return reports.filter((report) => report.status === status).length;
}

export function buildReviewerKpis(
  reports: readonly ReviewerAssignedReport[],
): ReviewerKpiCard[] {
  return [
    {
      id: "total_assigned",
      label: KPI_LABELS.total_assigned,
      value: reports.length,
    },
    {
      id: "in_queue",
      label: KPI_LABELS.in_queue,
      value: countByStatus(reports, "in_queue"),
    },
    {
      id: "in_review",
      label: KPI_LABELS.in_review,
      value: countByStatus(reports, "in_review"),
    },
    {
      id: "overdue",
      label: KPI_LABELS.overdue,
      value: countByStatus(reports, "overdue"),
    },
    {
      id: "completed",
      label: KPI_LABELS.completed,
      value: countByStatus(reports, "completed"),
    },
  ];
}

export const reviewerAssignedReports: readonly ReviewerAssignedReport[] = [
  {
    platformReportId: PANADOL_REPORT_ID,
    name: "Panadol - Mild Fever",
    assignedDate: "12 Aug, 2025",
    deadline: "19 Aug, 2025",
    status: "completed",
  },
  {
    platformReportId: "rpt-metformin-diabetes",
    name: "Metformin - Diabetes",
    assignedDate: "11 Aug, 2025",
    deadline: "18 Aug, 2025",
    status: "completed",
  },
  {
    platformReportId: "rpt-dupilumab-atopic-dermatitis",
    name: "Dupilumab - Atopic Dermatitis",
    assignedDate: "10 Aug, 2025",
    deadline: "17 Aug, 2025",
    status: "in_review",
  },
  {
    platformReportId: "rpt-semaglutide-obesity",
    name: "Semaglutide - Obesity",
    assignedDate: "09 Aug, 2025",
    deadline: "16 Aug, 2025",
    status: "completed",
  },
  {
    platformReportId: "rpt-tirzepatide-type-2-diabetes",
    name: "Tirzepatide - Type 2 Diabetes",
    assignedDate: "08 Aug, 2025",
    deadline: "15 Aug, 2025",
    status: "overdue",
  },
  {
    platformReportId: "rpt-adalimumab-rheumatoid-arthritis",
    name: "Adalimumab - Rheumatoid Arthritis",
    assignedDate: "07 Aug, 2025",
    deadline: "14 Aug, 2025",
    status: "overdue",
  },
  {
    platformReportId: "rpt-insulin-glargine-type-1-diabetes",
    name: "Insulin Glargine - Type 1 Diabetes",
    assignedDate: "06 Aug, 2025",
    deadline: "13 Aug, 2025",
    status: "in_queue",
  },
  {
    platformReportId: "rpt-empagliflozin-heart-failure",
    name: "Empagliflozin - Heart Failure",
    assignedDate: "05 Aug, 2025",
    deadline: "12 Aug, 2025",
    status: "completed",
  },
  {
    platformReportId: "rpt-osimertinib-nsclc",
    name: "Osimertinib - Non-Small Cell Lung Cancer",
    assignedDate: "04 Aug, 2025",
    deadline: "11 Aug, 2025",
    status: "in_review",
  },
  {
    platformReportId: "rpt-risankizumab-psoriasis",
    name: "Risankizumab - Psoriasis",
    assignedDate: "03 Aug, 2025",
    deadline: "10 Aug, 2025",
    status: "in_queue",
  },
  {
    platformReportId: "rpt-pembrolizumab-melanoma",
    name: "Pembrolizumab - Melanoma",
    assignedDate: "02 Aug, 2025",
    deadline: "09 Aug, 2025",
    status: "completed",
  },
  {
    platformReportId: "rpt-atezolizumab-urothelial-carcinoma",
    name: "Atezolizumab - Urothelial Carcinoma",
    assignedDate: "01 Aug, 2025",
    deadline: "08 Aug, 2025",
    status: "in_queue",
  },
];

export const reviewerNotifications: readonly ReviewerNotification[] = [
  {
    id: "reviewer-notif-assigned-panadol",
    message: "New report Panadol - Mild Fever is assigned",
    timestamp: "24 mins ago",
  },
  {
    id: "reviewer-notif-overdue-metformin",
    message: "Metformin - Diabetes review is overdue",
    timestamp: "1 hour ago",
  },
  {
    id: "reviewer-notif-submitted-dupilumab",
    message: "Dupilumab - Atopic Dermatitis review submitted",
    timestamp: "2 hour ago",
  },
];

export const reviewerDashboardSnapshot: ReviewerDashboardSnapshot = {
  kpis: buildReviewerKpis(reviewerAssignedReports),
  notifications: reviewerNotifications,
  reports: reviewerAssignedReports,
};

export const emptyReviewerDashboardSnapshot: ReviewerDashboardSnapshot = {
  kpis: buildReviewerKpis([]),
  notifications: [],
  reports: [],
};

export const reviewerReportDetails: readonly ReviewerReportDetail[] =
  reviewerAssignedReports.map(buildReportDetail);

export const reviewerReportDetailsById: ReadonlyMap<string, ReviewerReportDetail> =
  new Map(
    reviewerReportDetails.map((detail) => [detail.platformReportId, detail]),
  );
