# PracGuiada — Contexto técnico y plan de desarrollo

**Proyecto:** Aplicación móvil de gestión académica del ITS Cipolletti\
**Referencia:** Octubre de 2026\
**Estado:** Desarrollo incremental conectado a backend real\
**Prioridad:** Circuito completo de asistencia académica para profesores y estudiantes.

## 1. Objetivo de la práctica

Desarrollar una aplicación móvil Android que permita gestionar y consultar asistencia académica utilizando una API REST existente. No debe ser una simulación con datos locales.

### Requisitos del rol TEACHER

1. Iniciar sesión.
2. Visualizar materias o cursadas asignadas.
3. Ingresar a una cursada y consultar estudiantes inscriptos.
4. Crear o abrir una clase correspondiente a una fecha.
5. Registrar el estado de asistencia de cada estudiante.
6. Guardar la asistencia en el backend.
7. Consultar las clases y asistencias registradas.

### Requisitos del rol STUDENT

1. Iniciar sesión.
2. Visualizar las materias en las que está realmente inscripto.
3. Consultar su asistencia en cada materia.

## 2. Stack tecnológico

| Tecnología | Uso |
|---|---|
| React Native 0.86.3 | Desarrollo móvil |
| Expo SDK 57 | Herramientas y ejecución |
| React 19 | Componentes |
| TypeScript estricto | Tipado |
| Expo Router | Navegación por archivos, Stack sin tabs |
| Expo SecureStore | Persistencia segura de sesión |
| NetInfo | Detección de conectividad |
| API REST JSON | Backend real |
| Git | Control de versiones |

> Las versiones reflejan el estado informado previamente; comprobar `package.json` antes de hacer cambios.

## 3. Estructura conocida

```text
PracGuiada/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.js
│   │   ├── (public)/
│   │   │   └── login.tsx
│   │   └── (private)/
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       ├── teacher/
│   │       │   ├── index.tsx
│   │       │   ├── attendance.tsx
│   │       │   ├── attendance/
│   │       │   │   └── [offeringId].tsx
│   │       │   └── profile.tsx
│   │       ├── student/
│   │       │   ├── index.tsx
│   │       │   └── careers/
│   │       │       ├── index.tsx
│   │       │       └── [careerId]/
│   │       │           ├── index.tsx
│   │       │           └── [year]/
│   │       │               ├── index.tsx
│   │       │               └── [subjectId]/
│   │       │                   ├── index.tsx
│   │       │                   └── attendance/index.tsx
│   │       └── admin/index.tsx
│   ├── features/
│   │   ├── auth/
│   │   ├── student/
│   │   └── teacher/services/
│   │       ├── teacher.service.ts
│   │       └── teacher.types.ts
│   ├── lib/api/api.client.ts
│   ├── components/ui/
│   └── constants/theme.ts
├── tsconfig.json
└── package.json
```

Es una representación de rutas y carpetas conocidas, **no** un inventario exhaustivo. Inspeccionar el repositorio antes de crear archivos.

### Responsabilidades

- `src/app/`: pantallas, layouts y navegación.
- `src/features/`: servicios, tipos y lógica por funcionalidad.
- `src/lib/`: infraestructura HTTP y almacenamiento.
- `src/components/ui/`: componentes reutilizables.
- `src/constants/theme.ts`: tema visual.

## 4. Autenticación y navegación

API de autenticación:

```http
POST /auth/login
GET /auth/me
Authorization: Bearer <accessToken>
```

Sesión persistente con almacenamiento seguro y distribución de rutas por rol. Roles del backend: `ADMIN`, `ACADEMIC`, `TEACHER`, `STUDENT`. El alcance central de esta práctica es `TEACHER` y `STUDENT`.

Reutilizar `useSession`, el cliente HTTP y los mecanismos existentes. Revisar la protección de rutas por rol; una sesión válida no implica autorización para cualquier pantalla.

## 5. Diseño y estados de interfaz

Interfaz clara: azul principal, fondo gris claro, tarjetas blancas. Navegación Stack, sin emojis. Logo institucional en Login y Home por rol.

Componentes/patrones conocidos: `AppLogo`, `AppButton`, `AppInput`, `Screen`, `Skeleton`, `FeedbackState`, `OfflineBanner`.

Estados requeridos para consultas y mutaciones:

| Estado | Comportamiento |
|---|---|
| Loading | Skeletons |
| Success | Datos reales |
| Empty | Ausencia real de datos |
| Error | Mensaje y reintento |
| Submitting | Evitar acciones duplicadas |

**No mostrar un error de API como si la lista estuviera vacía.** Reutilizar NetInfo y el aviso offline existente.

## 6. Backend GITS

- **Base:** https://api-gits.innovaweb.com.ar
- **Swagger:** https://api-gits.innovaweb.com.ar/docs
- **OpenAPI JSON:** https://api-gits.innovaweb.com.ar/docs-json
- **Versión de especificación recibida:** OpenAPI 3.0.0

Las respuestas exitosas suelen utilizar una envoltura `success`, `data`, `timestamp`. Revisar el esquema particular de cada operación; no asumir la misma forma de `data` para todos los endpoints.

### Endpoints del profesor

| Método | Ruta | Uso |
|---|---|---|
| GET | `/teachers/me/course-offerings` | Cursadas asignadas |
| GET | `/course-offerings/{id}/students` | Estudiantes inscriptos |
| GET | `/course-offerings/{id}/class-sessions` | Clases de la cursada |
| POST | `/course-offerings/{id}/class-sessions` | Crear clase |
| GET | `/class-sessions/{id}/attendance` | Asistencia de una clase |
| POST | `/class-sessions/{id}/attendance/bulk` | Guardar registros masivos |
| PATCH | `/attendance/{id}` | Corregir asistencia |
| PATCH | `/class-sessions/{id}/close` | Cerrar clase |

Estados documentados de asistencia: `PRESENT`, `ABSENT`, `LATE`, `JUSTIFIED`.

Ejemplo orientativo de creación de clase (confirmar DTO vigente):

```json
{
  "date": "2026-10-24",
  "topic": "Introducción a React Native",
  "notes": "Repaso de conceptos anteriores"
}
```

Ejemplo orientativo de carga masiva (confirmar DTO vigente):

```json
{
  "records": [
    { "studentId": "uuid-del-estudiante", "status": "PRESENT" },
    { "studentId": "uuid-de-otro-estudiante", "status": "LATE", "observation": "Llegó tarde" }
  ]
}
```

Reglas a verificar: profesor autorizado para la cursada, estudiantes inscriptos, clase abierta para registrar asistencia, validaciones y conflictos. **La documentación no equivale a una prueba de ejecución con datos reales.**

### Endpoints del estudiante

| Método | Ruta | Uso |
|---|---|---|
| GET | `/students/me/enrollments` | Inscripciones reales a cursadas |
| GET | `/students/me/attendance` | Totales e historial |
| GET | `/students/me/study-plan` | Plan de estudios |
| GET | `/students/me/subjects/{subjectId}` | Detalle de materia |

`GET /students/me/attendance` admite filtro `courseOfferingId`.

**Importante:** las materias del plan no son necesariamente materias inscriptas. Para cumplir la práctica, utilizar las inscripciones reales.

## 7. Estado actual del frontend

### Implementado o presente

- Login real, sesión persistente, navegación por roles y logout.
- Home docente, listado de cursadas y navegación a su detalle.
- Pantalla de perfil docente existente.
- Home estudiante, navegación por carrera → año → materia.
- Consulta académica y pantalla de asistencia del estudiante con totales.
- Cliente HTTP compartido, NetInfo, OfflineBanner y skeletons.

### Incompleto

- `teacher/attendance/[offeringId].tsx` es un placeholder; no consulta alumnos.
- No se crean ni abren clases desde la app.
- No se registra ni guarda asistencia docente.
- No se consulta el historial completo de clases y asistencias docente.
- El estudiante todavía no visualiza el historial individual completo de asistencia.
- Verificar que «materias inscriptas» use inscripciones y no solo plan académico.

### Riesgos

- Algunas pantallas pueden mostrar estado vacío ante fallos de API.
- Revisar permisos por rol en rutas privadas.
- No hay suite automatizada confirmada.
- No asumir que una operación funciona solo porque aparece en Swagger.

## 8. Archivos docentes ya inspeccionados

- `src/app/(private)/teacher/attendance.tsx`: utiliza `getMyCourseOfferings(token)`, muestra tarjetas de cursadas y navega al detalle con `offeringId`.
- `src/app/(private)/teacher/attendance/[offeringId].tsx`: placeholder estático «No hay alumnos inscriptos»; debe consultar datos reales.
- `src/features/teacher/services/teacher.service.ts`: funciones `getMyCourseOfferings(token)` y `getTeacherById(teacherProfileId, token)`.
- `src/features/teacher/services/teacher.types.ts`: tipos de carrera, materia, año académico, profesor, cursada y respuestas docentes. Faltan tipos específicos de alumnos, clases y asistencia.

## 9. Plan de implementación

### Fase 1 — Alumnos de una cursada (PRÓXIMA)

Endpoint: `GET /course-offerings/{id}/students`.

1. Inspeccionar cliente HTTP y DTO OpenAPI.
2. Definir tipos TypeScript exactos.
3. Incorporar servicio de consulta.
4. Leer `offeringId` de Expo Router.
5. Consultar con token de sesión.
6. Mostrar alumnos reales.
7. Resolver loading, success, empty y error.
8. Ejecutar `npx tsc --noEmit` y probar en la app.

**Resultado esperado:** el profesor elige una cursada y ve estudiantes realmente inscriptos.

### Fase 2 — Clases por fecha

Endpoints: `GET/POST /course-offerings/{id}/class-sessions`.

Listar clases, crear clase con fecha y tema, distinguir abiertas/cerradas y prevenir duplicados según reglas reales.

### Fase 3 — Registro y guardado

Endpoints: `GET /class-sessions/{id}/attendance` y `POST /class-sessions/{id}/attendance/bulk`.

Marcar `PRESENT`, `ABSENT`, `LATE` o `JUSTIFIED`; permitir edición local, enviar una sola vez, gestionar errores y volver a consultar para confirmar persistencia.

### Fase 4 — Historial docente

Consultar clases y asistencias guardadas; distinguir estados. Evaluar correcciones y cierre de clase tras revisar reglas del backend.

### Fase 5 — Asistencia del estudiante

Usar `GET /students/me/enrollments` y `GET /students/me/attendance`; mostrar materias realmente inscriptas, totales y registros por fecha, filtrados por cursada.

## 10. Reglas para el agente de desarrollo

**Modo de trabajo:** inspeccionar → diagnosticar → proponer → solicitar autorización → implementar un cambio pequeño → verificar.

- Revisar `git status --short` antes de tocar archivos.
- Respetar cambios preexistentes; **no tocar `.atl/` ni `.vscode/`** sin permiso.
- No reestructurar todo el proyecto ni reemplazar autenticación.
- No inventar endpoints ni usar mocks como solución final.
- No añadir dependencias sin justificar.
- No escribir llamadas HTTP directamente en pantallas si existe capa de servicios.
- Mantener TypeScript estricto y reutilizar UI.
- No mostrar emojis en la interfaz.
- No exponer credenciales o tokens en logs.
- No detener procesos de otras sesiones OpenCode.
- No crear commits automáticamente sin autorización.
- Separar errores de red, estados vacíos y errores de permisos.
- Verificar contra el backend real y con credenciales de prueba autorizadas.

El ajuste previo de `tsconfig.json` eliminó `baseUrl` obsoleto y `npx tsc --noEmit` quedó limpio. Volver a verificar después de cada cambio.

## 11. Primera instrucción concreta para el agente

> **Objetivo:** preparar la implementación de alumnos inscriptos por cursada para `TEACHER`, sin modificar todavía archivos.
>
> 1. Ejecutar `git status --short`.
> 2. Inspeccionar:
>
> ```bash
> cat src/lib/api/api.client.ts
> cat src/features/teacher/services/teacher.service.ts
> cat src/features/teacher/services/teacher.types.ts
> cat 'src/app/(private)/teacher/attendance/[offeringId].tsx'
> ```
>
> 3. Consultar el esquema exacto de `GET /course-offerings/{id}/students` en `https://api-gits.innovaweb.com.ar/docs-json`.
> 4. Identificar tipos, estructura de respuesta, estados y errores.
> 5. Presentar diagnóstico, plan mínimo y lista de archivos a modificar.
> 6. **Esperar autorización antes de editar.**

## 12. Criterios de finalización

La práctica estará completa cuando un profesor pueda iniciar sesión, ver cursadas y alumnos, crear/abrir clases, registrar y persistir asistencia, y consultar el historial; y cuando un estudiante pueda ver sus cursadas inscriptas y consultar asistencia por materia. Deben funcionar estados de carga, error, vacío y permisos, con pruebas reales y TypeScript sin errores.

**Prioridad absoluta:** completar el circuito de asistencia antes de desarrollar funcionalidades secundarias.
