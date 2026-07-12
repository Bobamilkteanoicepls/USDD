import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("ships the complete shared two-user case workflow", async () => {
  const [model, workflow, components] = await Promise.all([
    read("app/demo-case.ts"),
    read("app/demo-workflow.tsx"),
    read("app/demo-components.tsx"),
  ]);

  assert.match(model, /activeRole: DemoRole/);
  assert.match(model, /notifications: CaseNotification\[\]/);
  assert.match(model, /evidence: EvidenceItem\[\]/);
  assert.match(model, /jurors: Juror\[\]/);
  assert.match(model, /beckyRecords: DatingRecordItem\[\]/);
  assert.match(model, /DEMO_STORAGE_KEY/);
  assert.match(workflow, /NotificationInboxCard/);
  assert.match(workflow, /EvidenceUploader/);
  assert.match(workflow, /LiveHearing/);
  assert.match(workflow, /JuryPanel/);
  assert.match(workflow, /AIJudgeVerdictPanel/);
  assert.match(workflow, /TrafficSchoolFlow/);
  assert.match(workflow, /ExpungementCertificate/);
  assert.match(components, /navigator\.share/);
  assert.match(components, /navigator\.clipboard\.writeText/);
  assert.match(components, /judgeStampStage/);
  assert.match(components, /stampImpression/);
  assert.match(workflow, /YOU ARE EMOTIONAL WASTE/);
});

test("keeps the Vercel static release deployable", async () => {
  const [vercel, packageJson] = await Promise.all([read("vercel.json"), read("package.json")]);
  const config = JSON.parse(vercel);
  const pkg = JSON.parse(packageJson);
  assert.equal(config.framework, null);
  assert.equal(config.outputDirectory, "static-dist");
  assert.equal(config.buildCommand, "npm run build:vercel");
  assert.match(pkg.scripts["build:vercel"], /vite build/);
  await access(new URL("static-dist/index.html", root));
});
