const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const storage = new Map();
const asyncStorageCalls = { get: [], set: [], remove: [] };
const asyncStorage = {
  default: {
    getItem: async (key) => {
      asyncStorageCalls.get.push(key);
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem: async (key, value) => {
      asyncStorageCalls.set.push({ key, value });
      storage.set(key, value);
    },
    removeItem: async (key) => {
      asyncStorageCalls.remove.push(key);
      storage.delete(key);
    },
  },
  getItem: async (key) => {
    asyncStorageCalls.get.push(key);
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem: async (key, value) => {
    asyncStorageCalls.set.push({ key, value });
    storage.set(key, value);
  },
  removeItem: async (key) => {
    asyncStorageCalls.remove.push(key);
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
  return { default: exports.default, ...exports };
}

const draftStorage = loadAttendanceDraft();
const draftKey = 'attendance:draft:teacher-1:offering-1:session-1';

const draftEntry = {
  studentId: 'student-1',
  status: 'PRESENT',
  lastModifiedAt: '2026-01-01T10:00:00.000Z',
};

const classSession = {
  id: 'session-1',
  courseOfferingId: 'offering-1',
  createdByTeacherId: 'teacher-1',
  status: 'OPEN',
  date: '2026-01-01',
  topic: 'Tema',
  createdAt: 'x',
  updatedAt: 'x',
};

const students = [
  {
    id: 'student-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    studentNumber: '1',
    documentNumber: '11',
    isActive: true,
    createdAt: 'x',
    updatedAt: 'x',
  },
  {
    id: 'student-2',
    firstName: 'Alan',
    lastName: 'Turing',
    studentNumber: '2',
    documentNumber: '22',
    isActive: true,
    createdAt: 'x',
    updatedAt: 'x',
  },
];

const recordAbsent = {
  id: 'record-1',
  classSessionId: 'session-1',
  studentId: 'student-1',
  status: 'ABSENT',
  observation: null,
  markedAt: 'x',
  markedByTeacherId: 'teacher-1',
  createdAt: 'x',
  updatedAt: 'x',
};

const SCREEN_STATUS = { LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' };

const draftMessage = 'Borrador guardado en este dispositivo. Pendiente de enviar.';
const errorMessage = 'No se pudo guardar en el servidor. Tus cambios siguen guardados en este dispositivo.';
const successMessage = 'Asistencia guardada correctamente.';

let getSessionAttendanceImpl = async () => ({ data: [] });
let bulkMarkAttendanceImpl = async () => ({ data: [] });
let updateAttendanceImpl = async () => ({ data: {} });

const serviceCalls = {
  getSessionAttendance: [],
  bulkMarkAttendance: [],
  updateAttendance: [],
};

const session = { token: 'token-1' };
const theme = new Proxy({}, { get: () => 16 });

function mountScreen(screenPath, initialStates = {}) {
  const filePath = path.join(__dirname, '../src/app/(private)', screenPath);
  const { outputText } = ts.transpileModule(readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const states = ['loading', '', 0, null, [], [], {}, {}, false, null, {}, false];
  Object.assign(states, initialStates);
  const refs = [];
  const jsx = (type, props) => ({ type, props });
  let stateCursor = 0;
  let refCursor = 0;
  const hooks = {
    useEffect() {},
    useState(initial) {
      const index = stateCursor++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (next) => {
          states[index] = typeof next === 'function' ? next(states[index]) : next;
        },
      ];
    },
    useRef(initial) {
      const index = refCursor++;
      if (!(index in refs)) refs[index] = { current: initial };
      return refs[index];
    },
  };

  const requireModule = (specifier) => {
    if (specifier === 'react') return hooks;
    if (specifier === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (specifier === 'react-native') {
      return {
        View: 'View',
        Text: 'Text',
        ScrollView: 'ScrollView',
        Pressable: 'Pressable',
        StyleSheet: { create: (value) => value },
      };
    }
    if (specifier === 'expo-router') {
      return {
        router: { back: () => {} },
        useLocalSearchParams: () => ({ sessionId: 'session-1', subjectName: undefined, commission: undefined }),
      };
    }
    if (specifier === '@/constants/theme') return { theme };
    if (specifier === '@/features/auth/useSession') return { useSession: () => session };
    if (specifier === '@/features/teacher/services/teacher.service') {
      return {
        getClassSession: async () => ({ data: classSession }),
        getCourseOfferingStudents: async () => ({ data: students }),
        getSessionAttendance: async () => {
          serviceCalls.getSessionAttendance.push('called');
          return getSessionAttendanceImpl();
        },
        bulkMarkAttendance: async () => {
          serviceCalls.bulkMarkAttendance.push('called');
          return bulkMarkAttendanceImpl();
        },
        updateAttendance: async () => {
          serviceCalls.updateAttendance.push('called');
          return updateAttendanceImpl();
        },
      };
    }
    if (specifier === '@/features/attendance/attendance.types') return attendanceTypes;
    if (specifier === '@/lib/api/api.client') {
      return {
        ApiError: class ApiError extends Error {
          constructor(message, status) {
            super(message);
            this.status = status;
            this.name = 'ApiError';
          }
        },
      };
    }
    if (specifier === '@/lib/format/date') return { formatSessionDate: (date) => String(date) };
    if (specifier === '@/lib/storage/attendance-draft') return draftStorage;
    if (specifier.startsWith('@/components/ui/')) {
      const componentName = specifier.split('/').at(-1);
      return { [componentName]: componentName };
    }
    throw new Error(`Unexpected import in ${screenPath}: ${specifier}`);
  };

  const exports = {};
  vm.runInNewContext(outputText, { exports, require: requireModule });
  return {
    render() {
      stateCursor = 0;
      refCursor = 0;
      return exports.default();
    },
    serviceCalls,
    states,
  };
}

function descendants(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap((child) => descendants(child, predicate));
  if (!tree || typeof tree !== 'object' || !tree.props) return [];
  return [
    ...(predicate(tree) ? [tree] : []),
    ...descendants(tree.props.header, predicate),
    ...descendants(tree.props.children, predicate),
    ...descendants(tree.props.footer, predicate),
  ];
}

function isAttendanceStatusPicker(node) {
  return (
    node.type === 'AttendanceStatusPicker' ||
    (typeof node.type === 'function' && node.type.name === 'AttendanceStatusPicker')
  );
}

function findButton(tree, title) {
  return descendants(tree, (node) => node.type === 'AppButton' && node.props.title === title);
}

function resetStorage() {
  storage.clear();
  asyncStorageCalls.get = [];
  asyncStorageCalls.set = [];
  asyncStorageCalls.remove = [];
  serviceCalls.getSessionAttendance = [];
  serviceCalls.bulkMarkAttendance = [];
  serviceCalls.updateAttendance = [];
}

test('teacher-attendance-draft: restores draft on load, shows info message and distinguishes draft statuses', async () => {
  resetStorage();
  await draftStorage.saveDraft(
    { teacherId: 'teacher-1', courseOfferingId: 'offering-1', sessionId: 'session-1' },
    { 'student-1': draftEntry }
  );

  const screen = mountScreen('teacher/attendance/session/[sessionId].tsx', {
    0: SCREEN_STATUS.SUCCESS,
    3: classSession,
    4: students,
    5: [recordAbsent],
    6: { 'student-2': 'ABSENT' },
    7: { 'student-1': 'PRESENT', 'student-2': 'ABSENT' },
    10: { 'student-1': 'PRESENT' },
    11: true,
  });

  const tree = screen.render();
  const draftBanners = descendants(tree, (node) => {
    return (
      node.type === 'FeedbackState' &&
      node.props.type === 'info' &&
      node.props.message === draftMessage
    );
  });
  assert.equal(draftBanners.length, 1);

  const pickers = descendants(tree, isAttendanceStatusPicker);
  assert.equal(pickers.length, 2);
  // student-1 has no server record; draft restored as PRESENT
  assert.equal(pickers[0].props.selectedStatus, 'PRESENT');
  // student-2 keeps the server-confirmed ABSENT
  assert.equal(pickers[1].props.selectedStatus, 'ABSENT');
});

test('teacher-attendance-draft: partial Save succeeds, draft deleted and success only after backend confirmation', async () => {
  resetStorage();
  await draftStorage.saveDraft(
    { teacherId: 'teacher-1', courseOfferingId: 'offering-1', sessionId: 'session-1' },
    { 'student-1': draftEntry }
  );
  bulkMarkAttendanceImpl = async () => ({ data: [] });

  const screen = mountScreen('teacher/attendance/session/[sessionId].tsx', {
    0: SCREEN_STATUS.SUCCESS,
    3: classSession,
    4: [students[0]],
    5: [],
    6: {},
    7: { 'student-1': 'PRESENT' },
    10: { 'student-1': 'PRESENT' },
    11: true,
  });

  const tree = screen.render();
  const button = findButton(tree, 'Guardar asistencia')[0];
  assert.equal(button.props.disabled, false);
  assert.equal(button.props.loading, false);

  await button.props.onPress();

  assert.equal(screen.states[9].type, 'success');
  assert.equal(screen.states[9].message, successMessage);
  assert.equal(serviceCalls.bulkMarkAttendance.length, 1);
  assert.equal(serviceCalls.updateAttendance.length, 0);
  assert.equal(asyncStorageCalls.remove.length, 1);
  assert.equal(asyncStorageCalls.remove[0], draftKey);
  assert.equal(storage.has(draftKey), false);
  assert.equal(Object.keys(screen.states[10]).length, 0);
  assert.equal(JSON.stringify(screen.states[6]), JSON.stringify({ 'student-1': 'PRESENT' }));

  const tree2 = screen.render();
  assert.equal(
    descendants(tree2, (node) => node.type === 'FeedbackState' && node.props.type === 'success').length,
    1
  );
  assert.equal(
    descendants(tree2, (node) => node.type === 'FeedbackState' && node.props.type === 'info' && node.props.message === draftMessage).length,
    0
  );
});

test('teacher-attendance-draft: partial Save failure keeps the draft and shows connection error', async () => {
  resetStorage();
  await draftStorage.saveDraft(
    { teacherId: 'teacher-1', courseOfferingId: 'offering-1', sessionId: 'session-1' },
    { 'student-1': draftEntry, 'student-2': { studentId: 'student-2', status: 'LATE', lastModifiedAt: 't2' } }
  );
  bulkMarkAttendanceImpl = async () => {
    throw new Error('conexión caída');
  };

  const screen = mountScreen('teacher/attendance/session/[sessionId].tsx', {
    0: SCREEN_STATUS.SUCCESS,
    3: classSession,
    4: students,
    5: [],
    6: {},
    7: { 'student-1': 'PRESENT', 'student-2': 'LATE' },
    10: { 'student-1': 'PRESENT', 'student-2': 'LATE' },
    11: true,
  });

  const tree = screen.render();
  const button = findButton(tree, 'Guardar asistencia')[0];
  await button.props.onPress();

  assert.equal(screen.states[9].type, 'error');
  assert.equal(screen.states[9].message, errorMessage);
  assert.equal(serviceCalls.bulkMarkAttendance.length, 1);
  assert.equal(asyncStorageCalls.remove.length, 0);
  assert.equal(storage.has(draftKey), true);
  assert.equal(JSON.stringify(screen.states[10]), JSON.stringify({ 'student-1': 'PRESENT', 'student-2': 'LATE' }));

  const tree2 = screen.render();
  assert.equal(
    descendants(tree2, (node) => node.type === 'FeedbackState' && node.props.type === 'error' && node.props.message === errorMessage).length,
    1
  );
  assert.equal(
    descendants(tree2, (node) => node.type === 'FeedbackState' && node.props.type === 'info' && node.props.message === draftMessage).length,
    1
  );
});

test('teacher-attendance-draft: uncertain retry consults server and keeps draft on conflict', async () => {
  resetStorage();
  await draftStorage.saveDraft(
    { teacherId: 'teacher-1', courseOfferingId: 'offering-1', sessionId: 'session-1' },
    { 'student-1': draftEntry }
  );
  getSessionAttendanceImpl = async () => ({ data: [recordAbsent] }); // server says ABSENT, draft says PRESENT

  const screen = mountScreen('teacher/attendance/session/[sessionId].tsx', {
    0: SCREEN_STATUS.SUCCESS,
    3: classSession,
    4: [students[0]],
    5: [recordAbsent],
    6: { 'student-1': 'ABSENT' },
    7: { 'student-1': 'PRESENT' },
    10: { 'student-1': 'PRESENT' },
    11: true,
  });

  const tree = screen.render();
  const button = findButton(tree, 'Guardar asistencia')[0];
  await button.props.onPress();

  assert.equal(serviceCalls.getSessionAttendance.length, 1);
  assert.equal(serviceCalls.bulkMarkAttendance.length, 0);
  assert.equal(serviceCalls.updateAttendance.length, 0);
  assert.equal(screen.states[9].type, 'error');
  assert.equal(screen.states[9].message, errorMessage);
  assert.equal(storage.has(draftKey), true);
  assert.equal(JSON.stringify(screen.states[10]), JSON.stringify({ 'student-1': 'PRESENT' }));
});

test('teacher-attendance-draft: selecting a status persists the draft locally', async () => {
  resetStorage();
  const screen = mountScreen('teacher/attendance/session/[sessionId].tsx', {
    0: SCREEN_STATUS.SUCCESS,
    3: classSession,
    4: students,
    5: [],
    6: {},
    7: {},
    10: {},
    11: true,
  });

  const tree = screen.render();
  const pickers = descendants(tree, isAttendanceStatusPicker);
  assert.equal(pickers.length, 2);
  assert.equal(pickers[0].props.selectedStatus, undefined);

  pickers[0].props.onSelect('PRESENT');
  await new Promise((resolve) => setTimeout(resolve, 0));

  const setCalls = asyncStorageCalls.set.filter((call) => call.key === draftKey);
  assert.equal(setCalls.length, 1);
  const saved = JSON.parse(setCalls[0].value);
  assert.equal(saved['student-1'].studentId, 'student-1');
  assert.equal(saved['student-1'].status, 'PRESENT');
  assert.equal(typeof saved['student-1'].lastModifiedAt, 'string');
  assert.equal(saved['student-1'].lastModifiedAt.length > 0, true);
  assert.equal(screen.states[7]['student-1'], 'PRESENT');
  assert.equal(screen.states[10]['student-1'], 'PRESENT');
});
