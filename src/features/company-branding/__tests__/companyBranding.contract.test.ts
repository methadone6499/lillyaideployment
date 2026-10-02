import assert from "node:assert/strict";

import { companyBrandingQueryKeys } from "../api/companyBrandingQueryKeys";
import {
  companyLogoResponseSchema,
  MAX_COMPANY_LOGO_BYTES,
} from "../schemas/companyBrandingSchemas";

const configured = companyLogoResponseSchema.parse({
  logo: {
    content_type: "image/png",
    size_bytes: 48_321,
    width: 1_800,
    height: 500,
    checksum_sha256:
      "5de91d7c4e6a965f29a01bb43f996b9f46f90123e812005b4aacaabc16eb305f",
    version: 2,
    created_at: "2026-10-03T12:00:00Z",
    updated_at: "2026-10-03T12:30:00Z",
  },
});

assert.equal(configured.logo?.content_type, "image/png");
assert.equal(configured.logo?.version, 2);
assert.equal(companyLogoResponseSchema.parse({ logo: null }).logo, null);
assert.equal(MAX_COMPANY_LOGO_BYTES, 10 * 1024 * 1024);

assert.equal(
  companyLogoResponseSchema.safeParse({
    logo: { ...configured.logo, content_type: "image/jpeg" },
  }).success,
  false,
);
assert.equal(
  companyLogoResponseSchema.safeParse({
    logo: { ...configured.logo, checksum_sha256: "not-a-checksum" },
  }).success,
  false,
);

assert.deepEqual(companyBrandingQueryKeys.metadata("user-1", "company-1"), [
  "company-branding",
  "user-1",
  "company-1",
  "metadata",
]);
assert.deepEqual(companyBrandingQueryKeys.content("user-1", "company-1", 2), [
  "company-branding",
  "user-1",
  "company-1",
  "content",
  2,
]);
