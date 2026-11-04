const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const filePath = path.join(__dirname, '../src/app/(private)/student/careers/[careerId]/index.tsx');
const sourceFile = ts.createSourceFile(
  filePath,
  readFileSync(filePath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);
const summaryDeclaration = sourceFile.statements.find(
  (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === 'getStatusSummary'
);
assert.ok(summaryDeclaration, 'getStatusSummary must exist in the plan screen');

const { outputText } = ts.transpileModule(summaryDeclaration.getText(sourceFile), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
});
const getStatusSummary = vm.runInNewContext(`${outputText}\ngetStatusSummary`);

function summarize(statuses) {
  const items = statuses.map((enrollmentStatus) => ({ enrollmentStatus }));
  return Object.fromEntries(Object.entries(getStatusSummary(items)));
}

test('ACTIVE counts as enrolled after trimming and case normalization', () => {
  assert.deepEqual(summarize(['ACTIVE', ' active ', 'Enrolled', 'in_progress']), {
    enrolled: 4,
    regular: 0,
    passed: 0,
    notEnrolled: 0,
  });
});

test('other buckets and absent or unknown statuses remain unchanged', () => {
  assert.deepEqual(summarize(['regular', 'PROMOTED', 'passed', 'COMPLETED', 'NOT_ENROLLED', 'DROPPED', '', null, undefined]), {
    enrolled: 0,
    regular: 1,
    passed: 3,
    notEnrolled: 5,
  });
  assert.deepEqual(summarize([]), {
    enrolled: 0,
    regular: 0,
    passed: 0,
    notEnrolled: 0,
  });
});
