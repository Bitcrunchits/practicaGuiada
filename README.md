# PracGuiada

Aplicación móvil desarrollada con Expo SDK 57 y React Native 0.86.3 para gestión académica. Incluye pantallas por rol (docente, alumno, admin), toma de asistencia con persistencia local, almacenamiento seguro y pruebas unitarias.

## Stack

- Expo SDK 57 / React Native 0.86.3
- TypeScript (~6.0.3)
- Expo Router para navegación
- `@react-native-async-storage/async-storage` 2.2.0 (borradores de asistencia)
- `expo-secure-store` (token de sesión)

## Estructura

```
app/                 → Pantallas y layouts (Expo Router)
src/
  features/          → Lógica por dominio (auth, teacher, student, attendance)
  lib/               → Utilidades (api.client, storage, format)
  components/ui/     → Componentes base reutilizables
  constants/         → Tema centralizado
tests/               → Pruebas unitarias (node:test)
docs/                → Propuestas y especificaciones (PR persistencia local)
odd/                 → Seguimiento orgánico de desarrollo (tasks)
```

## Instalación y ejecución

```bash
npm install
npx expo start        # servidor de desarrollo
npx expo start --android
npx expo start --ios
npx expo start --web
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `start` | Inicia Expo |
| `android` | Inicia en Android |
| `ios` | Inicia en iOS |
| `web` | Inicia en web |

## Funcionalidades principales

### Roles
- **Docente:** lista de cursadas, creación de clases, toma de asistencia por sesión, historial por alumno, perfil.
- **Alumno:** plan de estudios, materias, carreras.
- **Admin:** pantalla de administración.

### Asistencia docente (borrador local)
Cada cambio de asistencia se guarda localmente en el dispositivo con `@react-native-async-storage/async-storage`. El docente puede guardar en cualquier momento (no se exige completar toda la lista). El borrador permanece hasta que el backend confirme el guardado; si falla, se conserva y se muestra un mensaje de error.

Archivos clave:
- `src/lib/storage/attendance-draft.ts` — servicio de borradores aislado por docente, cursada y sesión.
- `src/app/(private)/teacher/attendance/session/[sessionId].tsx` — pantalla de asistencia integrada con el borrador local.

### Almacenamiento seguro
- `src/lib/storage/secure-storage.ts` — token de sesión con `expo-secure-store`.
- `src/lib/storage/secure-storage.web.ts` — implementación para web.

## Pruebas

Las pruebas están en `tests/` y se ejecutan con Node:

```bash
node tests/attendance-draft.test.cjs
node tests/teacher-attendance-draft.test.cjs
node tests/logout-feedback.test.cjs
node tests/student-plan-summary.test.cjs
node tests/secure-storage-web.test.cjs
```

También se puede validar con TypeScript:

```bash
npx tsc --noEmit
```

## Documentación adicional

- `docs/PracGuiada_PR_Persistencia_Local_Asistencia.md` — propuesta de persistencia local de asistencia.
- `odd/tasks/` — seguimiento orgánico de desarrollo y tareas.

## Convenciones

Los commits siguen el formato Conventional Commits (ej. `feat(docente): ...`, `fix: ...`). No se agrega atribución de IA en los commits.

## Licencia

Privado — uso académico.