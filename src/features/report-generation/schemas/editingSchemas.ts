import { z } from "zod";

/**
 * Editable-document contracts are intentionally separate from generated
 * `reportSchemas` blocks. Stable `block_id`s and compiler-owned fields must
 * round-trip on save and must not be mixed with display-only section content.
 */

export const editingErrorCodeSchema = z.enum([
  "stale_revision",
  "duplicate_client_op_id",
  "inactive_section",
  "report_not_editable",
  "validation_failed",
  "section_not_ready",
]);

export const editingActorSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export const rewritePresetModeSchema = z.enum([
  "rewrite_only",
  "lookup_and_rewrite",
]);

export const rewritePresetSchema = z.object({
  preset_id: z.string().min(1),
  label: z.string(),
  description: z.string(),
  section_types: z.array(z.string()),
  mode: rewritePresetModeSchema,
});

export const rewritePresetListResponseSchema = z.object({
  items: z.array(rewritePresetSchema),
});

export const editableHeadingBlockSchema = z.looseObject({
  block_id: z.string().min(1),
  type: z.literal("heading"),
  level: z.number(),
  text: z.string(),
});

export const editableParagraphBlockSchema = z.looseObject({
  block_id: z.string().min(1),
  type: z.literal("paragraph"),
  label: z.string().optional(),
  label_bold: z.boolean().optional(),
  text: z.string(),
});

export const editableTableBlockSchema = z.looseObject({
  block_id: z.string().min(1),
  type: z.literal("table"),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

export const editableDefinitionBlockSchema = z.looseObject({
  block_id: z.string().min(1),
  type: z.literal("definition"),
  label: z.string(),
  value: z.string(),
});

export const editableListBlockSchema = z.looseObject({
  block_id: z.string().min(1),
  type: z.literal("list"),
  label: z.string().optional(),
  items: z.array(z.string()),
});

export const editableCalloutBlockSchema = z.looseObject({
  block_id: z.string().min(1),
  type: z.literal("callout"),
  level: z.enum(["info", "warning"]),
  text: z.string(),
});

export const editableMarkdownBlockSchema = z.looseObject({
  block_id: z.string().min(1),
  type: z.literal("markdown"),
  text: z.string(),
});

export type EditableHeadingBlock = z.infer<typeof editableHeadingBlockSchema>;
export type EditableParagraphBlock = z.infer<typeof editableParagraphBlockSchema>;
export type EditableTableBlock = z.infer<typeof editableTableBlockSchema>;
export type EditableDefinitionBlock = z.infer<
  typeof editableDefinitionBlockSchema
>;
export type EditableListBlock = z.infer<typeof editableListBlockSchema>;
export type EditableCalloutBlock = z.infer<typeof editableCalloutBlockSchema>;
export type EditableMarkdownBlock = z.infer<typeof editableMarkdownBlockSchema>;

export type EditableBlock =
  | EditableHeadingBlock
  | EditableParagraphBlock
  | EditableTableBlock
  | EditableDefinitionBlock
  | EditableListBlock
  | EditableCalloutBlock
  | EditableMarkdownBlock
  | {
      block_id: string;
      type: "section";
      heading: string;
      level: number;
      blocks: EditableBlock[];
    };

export const editableBlockSchema: z.ZodType<EditableBlock> = z.lazy(() =>
  z.discriminatedUnion("type", [
    editableHeadingBlockSchema,
    editableParagraphBlockSchema,
    editableTableBlockSchema,
    editableDefinitionBlockSchema,
    editableListBlockSchema,
    editableCalloutBlockSchema,
    editableMarkdownBlockSchema,
    z.looseObject({
      block_id: z.string().min(1),
      type: z.literal("section"),
      heading: z.string(),
      level: z.number(),
      blocks: z.array(editableBlockSchema),
    }),
  ]),
);

export const editableDocumentPayloadSchema = z.object({
  blocks: z.array(editableBlockSchema),
});

export const editableDocumentResponseSchema = z.object({
  report_id: z.string().min(1),
  section_id: z.string().min(1),
  section_type: z.string().min(1),
  revision: z.number().int().min(0),
  origin_job_id: z.string().nullable().optional(),
  blocks: z.array(editableBlockSchema),
  updated_at: z.string().nullable().optional(),
  updated_by: editingActorSchema.nullable().optional(),
});

export const blockPositionSchema = z.object({
  block_id: z.string().min(1),
  offset: z.number().int().min(0),
});

export const textSelectionSchema = z.object({
  anchor: blockPositionSchema,
  focus: blockPositionSchema,
  selected_text: z.string().nullable().optional(),
});

export const createRewritePreviewInputSchema = z
  .object({
    base_revision: z.number().int().min(0),
    selection: textSelectionSchema,
    actor: editingActorSchema,
    preset_id: z.string().trim().min(1).optional(),
    instruction: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) => Boolean(value.preset_id) !== Boolean(value.instruction),
    { message: "Provide exactly one of preset_id or instruction." },
  );

export const rewritePreviewStatusSchema = z.enum([
  "ready",
  "no_relevant_evidence",
  "unsupported_request",
  "stale_selection",
  "stale_revision",
  "evidence_index_not_ready",
  "validation_failed",
]);

export const replacementBlockSchema = z.object({
  block_id: z.string().min(1),
  text: z.string(),
});

export const rewriteSourceSchema = z.object({
  source_file: z.string().min(1),
  citation_key: z.string().nullable().optional(),
});

export const rewriteClaimSchema = z.object({
  text: z.string(),
  source_files: z.array(z.string()).optional().default([]),
  supported: z.boolean().optional().default(false),
});

export const rewritePreviewResponseSchema = z.object({
  rewrite_id: z.string().min(1),
  report_id: z.string().min(1),
  section_id: z.string().min(1),
  status: rewritePreviewStatusSchema,
  mode: rewritePresetModeSchema.nullable().optional(),
  base_revision: z.number().int().min(0),
  selection: textSelectionSchema,
  replacement_blocks: z.array(replacementBlockSchema).optional().default([]),
  sources: z.array(rewriteSourceSchema).optional().default([]),
  claims: z.array(rewriteClaimSchema).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
  message: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const saveEditableDocumentInputSchema = z.object({
  base_revision: z.number().int().min(0),
  document: editableDocumentPayloadSchema,
  accepted_rewrite_ids: z.array(z.string().min(1)).optional().default([]),
  actor: editingActorSchema,
  client_op_id: z.string().min(1),
});

export const restoreRevisionInputSchema = z.object({
  base_revision: z.number().int().min(0),
  actor: editingActorSchema,
});

export const sectionChangeOperationSchema = z.enum([
  "manual_edit",
  "ai_rewrite",
  "restore",
  "init",
]);

export const sectionChangeSummarySchema = z.object({
  change_id: z.string().min(1),
  from_revision: z.number().int().min(-1),
  to_revision: z.number().int().min(0),
  operation: sectionChangeOperationSchema,
  actor: editingActorSchema.nullable().optional(),
  accepted_rewrite_ids: z.array(z.string()).optional().default([]),
  summary: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
}).superRefine((change, context) => {
  if (change.operation !== "init" && change.from_revision < 0) {
    context.addIssue({
      code: "custom",
      path: ["from_revision"],
      message: "Only initialization entries may use revision -1",
    });
  }
});

export const sectionRevisionListResponseSchema = z.object({
  report_id: z.string().min(1),
  section_id: z.string().min(1),
  current_revision: z.number().int().min(0),
  items: z.array(sectionChangeSummarySchema),
});

export type EditingErrorCode = z.infer<typeof editingErrorCodeSchema>;
export type EditingActor = z.infer<typeof editingActorSchema>;
export type RewritePresetMode = z.infer<typeof rewritePresetModeSchema>;
export type RewritePreset = z.infer<typeof rewritePresetSchema>;
export type RewritePresetListResponse = z.infer<
  typeof rewritePresetListResponseSchema
>;
export type EditableDocumentPayload = z.infer<
  typeof editableDocumentPayloadSchema
>;
export type EditableDocumentResponse = z.infer<
  typeof editableDocumentResponseSchema
>;
export type BlockPosition = z.infer<typeof blockPositionSchema>;
export type TextSelection = z.infer<typeof textSelectionSchema>;
export type CreateRewritePreviewInput = z.input<
  typeof createRewritePreviewInputSchema
>;
export type RewritePreviewStatus = z.infer<typeof rewritePreviewStatusSchema>;
export type ReplacementBlock = z.infer<typeof replacementBlockSchema>;
export type RewriteSource = z.infer<typeof rewriteSourceSchema>;
export type RewriteClaim = z.infer<typeof rewriteClaimSchema>;
export type RewritePreviewResponse = z.infer<
  typeof rewritePreviewResponseSchema
>;
export type SaveEditableDocumentInput = z.input<
  typeof saveEditableDocumentInputSchema
>;
export type SaveEditableDocumentRequest = z.output<
  typeof saveEditableDocumentInputSchema
>;
export type RestoreRevisionInput = z.infer<typeof restoreRevisionInputSchema>;
export type SectionChangeOperation = z.infer<
  typeof sectionChangeOperationSchema
>;
export type SectionChangeSummary = z.infer<typeof sectionChangeSummarySchema>;
export type SectionRevisionListResponse = z.infer<
  typeof sectionRevisionListResponseSchema
>;

export type CreateRewritePreviewRequest = {
  base_revision: number;
  selection: TextSelection;
  actor: EditingActor;
} & (
  | { preset_id: string; instruction?: never }
  | { instruction: string; preset_id?: never }
);
