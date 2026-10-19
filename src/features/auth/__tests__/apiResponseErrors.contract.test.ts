import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { ApiRequestError } from "@/services/ApiRequestError";
import { apiRequest } from "@/services/apiRequest";
import { signupRequestSchema } from "../schemas/authSchemas";

test("unreadable API responses use safe copy and retain the original status", async (context) => {
  let response = new Response();
  context.mock.method(globalThis, "fetch", async () => response);
  const schema = z.object({ name: z.string() });
  for (const next of [
    new Response("<html>Error</html>", { headers: { "Content-Type": "text/html" } }),
    new Response("not JSON", { headers: { "Content-Type": "application/json" } }),
    Response.json({ unexpected: true }),
  ]) {
    response = next;
    await assert.rejects(apiRequest("/example", { schema }), (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.status, 200);
      assert.equal(error.code, "invalid_response");
      assert.match(error.message, /Try again.*contact support/);
      assert.doesNotMatch(error.message, /schema|Zod|Unexpected token|Expected a JSON/);
      return true;
    });
  }
  response = Response.json({ name: "Formulary HTA" });
  assert.deepEqual(await apiRequest("/example", { schema }), { name: "Formulary HTA" });
  response = new Response(null, { status: 204 });
  assert.equal(await apiRequest("/example", { expectEmpty: true }), undefined);
  response = Response.json({ name: "Formulary HTA" });
  const aborted = new DOMException("Aborted", "AbortError");
  context.mock.method(response, "json", async () => { throw aborted; });
  await assert.rejects(apiRequest("/example", { schema }), (error: unknown) => error === aborted);
});

const signup = signupRequestSchema.safeParse({ full_name: "x".repeat(201), institution_name: "x".repeat(201), email: "invalid", password: "short" });
assert.equal(signup.success, false);
if (signup.success) throw new Error("Expected invalid signup inputs");
assert.deepEqual(signup.error.issues.map((issue) => issue.message), [
  "Use 200 characters or fewer for your full name.",
  "Use 200 characters or fewer for your institution name.",
  "Enter a valid email address, such as name@example.com.",
  "Use at least 12 characters for your password.",
]);
