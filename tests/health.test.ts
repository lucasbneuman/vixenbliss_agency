import test from "node:test";
import assert from "node:assert/strict";

import { GET } from "../src/pages/health.json.ts";

test("health endpoint reports the SSR server is available", async () => {
  const response = GET();
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    status: "ok",
    service: "vixenbliss-agency",
  });
});
