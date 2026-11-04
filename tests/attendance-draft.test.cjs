const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const storage = new Map();

const asyncStorage = {
  default: {
    getItem: async (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: async (key, value) => {
      storage.set(key, value);
    },
    removeItem: async (key) => {
      storage.delete(key);
    },
  },
  getItem: async (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: async (key, value) => {
    storage.set(key, value);
  },
  removeItem: async (key) => {
    storage.delete(key);
  },
};

const attendanceTypes = {
  ATTENDANCE_STATUS_OPTIONS: [
    { value: 'PRESENT', label: 'Presente', tone: 'present' },
    { value: 'ABSENT', label: 'Ausente', tone: 'absent' },
    { value: 'LATE', label: 'Tarde', tone: 'late' },
    { value: 'JUSTIFIED', label: 'Justificado', tone: 'justified' },
  ],
  isAttendanceStatusValue: (value) =>
    ['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'].includes(value),
};

function loadAttendanceDraft() {
  const filePath = path.join(__dirname, '../src/lib/storage/attendance-draft.ts');
  const { outputText } = ts.transpileModule(readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (specifier) => {
      if (specifier === '@react-native-async-storage/async-storage') return asyncStorage;
      if (specifier === '@/features/attendance/attendance.types') return attendanceTypes;
      throw new Error(`Unexpected import in attendance-draft.ts: ${specifier}`);
    },
  });
  return exports;
}

const mod = loadAttendanceDraft();

const scope = {
  teacherId: 'teacher-1',
  courseOfferingId: 'offering-1',
  sessionId: 'session-1',
};

const entry = {
  studentId: 'student-1',
  status: 'PRESENT',
  observation: 'Sin novedades',
  lastModifiedAt: '2026-01-01T10:00:00.000Z',
};

test('attendance-draft: saveDraft then getDraft returns the stored draft', async () => {
  storage.clear();
  await mod.saveDraft(scope, { 'student-1': entry });
  const draft = await mod.getDraft(scope);
  assert.equal(JSON.stringify(draft), JSON.stringify({ 'student-1': entry }));
});

test('attendance-draft: getDraft returns null when nothing was stored', async () => {
  storage.clear();
  assert.equal(await mod.getDraft(scope), null);
});

test('attendance-draft: updateDraft merges with existing draft and returns it', async () => {
  storage.clear();
  await mod.saveDraft(scope, { 'student-1': entry });
  const merged = await mod.updateDraft(scope, 'student-2', {
    studentId: 'student-2',
    status: 'ABSENT',
    lastModifiedAt: '2026-01-01T11:00:00.000Z',
  });
  assert.equal(
    JSON.stringify(merged),
    JSON.stringify({
      'student-1': entry,
      'student-2': { studentId: 'student-2', status: 'ABSENT', lastModifiedAt: '2026-01-01T11:00:00.000Z' },
    })
  );
  const stored = await mod.getDraft(scope);
  assert.equal(JSON.stringify(stored), JSON.stringify(merged));
});

test('attendance-draft: updateDraft overwrites an existing entry', async () => {
  storage.clear();
  await mod.saveDraft(scope, { 'student-1': entry });
  const merged = await mod.updateDraft(scope, 'student-1', {
    studentId: 'student-1',
    status: 'LATE',
    lastModifiedAt: '2026-01-01T12:00:00.000Z',
  });
  assert.equal(merged['student-1'].status, 'LATE');
  assert.equal(merged['student-1'].lastModifiedAt, '2026-01-01T12:00:00.000Z');
});

test('attendance-draft: deleteConfirmedDraft removes the draft', async () => {
  storage.clear();
  await mod.saveDraft(scope, { 'student-1': entry });
  await mod.deleteConfirmedDraft(scope);
  assert.equal(await mod.getDraft(scope), null);
});

test('attendance-draft: isolation by teacherId, courseOfferingId and sessionId', async () => {
  storage.clear();
  await mod.saveDraft(scope, { 'student-1': entry });
  assert.equal(await mod.getDraft({ ...scope, teacherId: 'teacher-2' }), null);
  assert.equal(await mod.getDraft({ ...scope, courseOfferingId: 'offering-2' }), null);
  assert.equal(await mod.getDraft({ ...scope, sessionId: 'session-2' }), null);
  assert.equal(JSON.stringify(await mod.getDraft(scope)), JSON.stringify({ 'student-1': entry }));
});

test('attendance-draft: malformed reads return null instead of throwing', async () => {
  storage.clear();
  const key = `attendance:draft:${scope.teacherId}:${scope.courseOfferingId}:${scope.sessionId}`;

  storage.set(key, 'not json at all');
  assert.equal(await mod.getDraft(scope), null);

  storage.set(key, JSON.stringify({ 'student-1': { status: 'PRESENT' } })); // missing studentId
  assert.equal(await mod.getDraft(scope), null);

  storage.set(key, JSON.stringify({ 'student-1': { studentId: 'student-1', status: 'BOGUS', lastModifiedAt: 'x' } })); // invalid status
  assert.equal(await mod.getDraft(scope), null);

  storage.set(key, JSON.stringify({ 'student-1': { studentId: 'student-1', status: 'PRESENT' } })); // missing lastModifiedAt
  assert.equal(await mod.getDraft(scope), null);

  storage.set(key, JSON.stringify({ 'student-1': 'just a string' })); // entry is not an object
  assert.equal(await mod.getDraft(scope), null);

  storage.set(key, JSON.stringify(['student-1'])); // draft is an array, not an object
  assert.equal(await mod.getDraft(scope), null);

  // Valid draft still readable after malformed entries are cleared
  storage.delete(key);
  assert.deepEqual(await mod.getDraft(scope), null);
});

test('attendance-draft: write validation rejects invalid scopes and entries', async () => {
  storage.clear();
  await assert.rejects(mod.saveDraft({ ...scope, teacherId: '' }, {}), /teacherId/);
  await assert.rejects(mod.saveDraft({ ...scope, courseOfferingId: '' }, {}), /courseOfferingId/);
  await assert.rejects(mod.saveDraft({ ...scope, sessionId: '' }, {}), /sessionId/);
  await assert.rejects(
    mod.saveDraft(scope, { 'student-1': { studentId: 'student-1', status: 'PRESENT' } }),
    /lastModifiedAt/
  );
  await assert.rejects(
    mod.updateDraft(scope, '', { studentId: '', status: 'PRESENT', lastModifiedAt: 'x' }),
    /studentId/
  );
  await assert.rejects(
    mod.updateDraft(scope, 'student-1', { studentId: 'student-1', status: 'BOGUS', lastModifiedAt: 'x' })
  );
});
