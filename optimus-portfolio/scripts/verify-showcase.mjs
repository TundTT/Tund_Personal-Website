import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../public/pal-demo/", import.meta.url);
const json = async (path) =>
  JSON.parse(await readFile(new URL(path, root), "utf8"));
const catalog = await json("index.json");
assert.equal(
  catalog.length,
  1,
  "The portfolio must feature exactly one policy",
);
const policy = catalog[0];
assert.equal(policy.author, "Tund");
assert.equal(policy.profile.trainer, "Tund");
const { results } = await json("saved-evaluations/index.json");
assert.equal(results.length, 1);
const entry = results[0];
assert.equal(entry.slug, policy.slug);
const bytes = await readFile(new URL(`saved-evaluations/${entry.file}`, root));
assert.equal(
  bytes.byteLength,
  entry.bytes,
  "Evaluation byte count must match the manifest",
);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  entry.sha256,
  "Saved evaluation must remain unchanged",
);
const evaluation = JSON.parse(bytes);
// Exact timestamp identity matters to the upstream loader, including milliseconds.
assert.equal(
  entry.completedAt,
  evaluation.completedAt,
  "Do not normalize the manifest timestamp",
);
assert.equal(entry.fingerprint, evaluation.policy.fingerprint);
assert.equal(entry.fingerprint, policy.fingerprint);
assert.equal(entry.version, evaluation.version);
assert.equal(evaluation.status, "complete");
assert.equal(evaluation.suite, "full");
assert.equal(evaluation.rankable, true);
assert.equal(evaluation.completedAttempts, evaluation.attempts.length);
assert.equal(evaluation.completedAttempts, evaluation.plannedAttempts);
const policyRoot = new URL(`policies/${policy.slug}/`, root);
const scene = JSON.parse(
  await readFile(new URL("scene.json", policyRoot), "utf8"),
);
for (const file of [
  scene.xml,
  ...scene.meshes,
  "policy.bin",
  "policy.meta.json",
  "policy.onnx",
]) {
  await access(new URL(file, policyRoot));
}
const tour = await readFile(
  new URL("site/static/js/showcase.js", root),
  "utf8",
);
const tourIds = [...tour.matchAll(/\['([^']+:r\d+)',/g)].map(
  (match) => match[1],
);
assert.equal(tourIds.length, 5);
for (const id of tourIds) {
  assert.ok(
    evaluation.attempts.some((attempt) => attempt.id === id),
    `Missing recorded tour round ${id}`,
  );
}
await access(new URL("site/index.html", root));
await access(new URL("LICENSE-PAL.txt", root));
await access(new URL("NOTICE.txt", root));
console.log(
  `Verified: one Tund policy, ${scene.meshes.length} meshes, intact evaluation, ${evaluation.attempts.length} attempts, and five recorded tour rounds.`,
);
