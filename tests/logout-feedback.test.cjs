const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const screens = [
  'admin/index.tsx',
  'student/index.tsx',
  'student/careers/index.tsx',
  'teacher/index.tsx',
];

const plan = {
  career: { id: 'career-1', name: 'Engineering' },
  items: [],
};

function mountScreen(screenPath, signOut) {
  const filePath = path.join(__dirname, '../src/app/(private)', screenPath);
  const { outputText } = ts.transpileModule(readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const states = screenPath === 'student/careers/index.tsx'
    ? ['success', '', plan, 0]
    : [];
  const refs = [];
  const replaced = [];
  const session = {
    token: 'opaque-token',
    user: { profile: { firstName: 'Ada' } },
    isAuthenticated: true,
    signOut,
  };
  let stateCursor = 0;
  let refCursor = 0;
  const jsx = (type, props) => ({ type, props });
  const styles = new Proxy({}, { get: () => 16 });
  const theme = { colors: styles, spacing: styles, fontSize: styles, radius: styles };
  const hooks = {
    useEffect() {},
    useState(initial) {
      const index = stateCursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (next) => {
        states[index] = typeof next === 'function' ? next(states[index]) : next;
      }];
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
      return { View: 'View', Text: 'Text', ScrollView: 'ScrollView', StyleSheet: { create: (value) => value } };
    }
    if (specifier === 'expo-router') {
      return { router: { replace: (route) => replaced.push(route) } };
    }
    if (specifier === '@/constants/theme') return { theme };
    if (specifier === '@/features/auth/useSession') return { useSession: () => session };
    if (specifier === '@/features/student/services/student.service') {
      return { getMyStudyPlan: async () => ({ data: plan }) };
    }
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
    replaced,
    session,
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

function logoutButton(tree) {
  const buttons = descendants(tree, (node) => node.type === 'AppButton' && node.props.title === 'Cerrar sesión');
  assert.equal(buttons.length, 1);
  return buttons[0];
}

for (const screenPath of screens) {
  test(`${screenPath}: rejected sign-out stays on screen with accessible feedback, then retry navigates once`, async () => {
    const requests = [];
    const screen = mountScreen(screenPath, () => new Promise((resolve, reject) => {
      requests.push({ resolve, reject });
    }));

    const firstPress = logoutButton(screen.render()).props.onPress();
    assert.equal(logoutButton(screen.render()).props.loading, true);
    await logoutButton(screen.render()).props.onPress();
    assert.equal(requests.length, 1);

    requests[0].reject(new Error('opaque-token: storage denied'));
    await assert.doesNotReject(firstPress);
    const failedTree = screen.render();
    assert.equal(screen.session.isAuthenticated, true);
    assert.deepEqual(screen.replaced, []);
    assert.equal(logoutButton(failedTree).props.loading, false);
    const alerts = descendants(failedTree, (node) => node.props.accessibilityRole === 'alert');
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].props.accessible, true);
    assert.equal(alerts[0].props.accessibilityLiveRegion, 'polite');
    assert.match(alerts[0].props.accessibilityLabel, /No se pudo cerrar la sesión/);
    assert.doesNotMatch(alerts[0].props.accessibilityLabel, /opaque-token|storage denied/);
    const feedback = descendants(alerts[0], (node) => node.type === 'FeedbackState');
    assert.equal(feedback.length, 1);
    assert.equal(feedback[0].props.type, 'error');
    assert.equal(feedback[0].props.message, alerts[0].props.accessibilityLabel);

    const retryPress = logoutButton(failedTree).props.onPress();
    const retryTree = screen.render();
    assert.equal(logoutButton(retryTree).props.loading, true);
    assert.equal(descendants(retryTree, (node) => node.props.accessibilityRole === 'alert').length, 0);
    await logoutButton(retryTree).props.onPress();
    assert.equal(requests.length, 2);
    requests[1].resolve();
    await assert.doesNotReject(retryPress);
    assert.deepEqual(screen.replaced, ['/login']);
  });
}

test('careers plan status and error remain independent of logout feedback', async () => {
  const screen = mountScreen('student/careers/index.tsx', async () => {
    throw new Error('opaque-token');
  });
  const savedPlan = screen.states[2];
  await logoutButton(screen.render()).props.onPress();
  const failedTree = screen.render();
  assert.equal(screen.states[0], 'success');
  assert.equal(screen.states[1], '');
  assert.equal(screen.states[2], savedPlan);
  assert.equal(descendants(failedTree, (node) => node.type === 'AppCard' && node.props.title === 'Plan de estudios').length, 1);
  assert.equal(descendants(failedTree, (node) => node.props.accessibilityRole === 'alert').length, 1);
  assert.deepEqual(screen.replaced, []);
});
