# PR: Persistencia local de asistencia ante fallas de conexión

**Proyecto:** PracGuiada  
**Tipo:** Feature  
**Rama sugerida:** `feat/attendance-local-draft`  
**Prioridad:** Media-alta  
**Alcance:** Aplicación móvil — rol `TEACHER`

## 1. Objetivo

Implementar un mecanismo sencillo de persistencia local para que el docente no pierda los cambios realizados durante la toma de asistencia cuando exista una conexión a Internet débil, intermitente o temporalmente interrumpida.

La solución debe aprovechar la arquitectura y las pantallas existentes, sin introducir sistemas complejos de sincronización.

## 2. Comportamiento esperado

### Guardado local automático

- Cada vez que el docente modifica la asistencia de un estudiante, se actualiza el borrador local.
- El borrador debe persistir aunque la aplicación se cierre o reinicie.
- La información se identifica por docente, cursada y clase.
- La aplicación debe recuperar el borrador correspondiente al regresar a la pantalla.
- La interfaz debe distinguir los datos recuperados localmente de los confirmados por el servidor.

### Guardado en backend

- Se mantiene el botón actual de guardar asistencia.
- Al presionarlo, la aplicación utiliza los endpoints existentes del backend GITS.
- Si el servidor confirma el guardado, se elimina el borrador pendiente correspondiente.
- Si falla la conexión, se conserva el borrador sin perder modificaciones.

### Reintento manual

- Si falla el guardado, mostrar un mensaje claro.
- Permitir reintentar utilizando el botón de guardado existente.
- Antes de reenviar una operación cuyo resultado sea incierto, consultar el estado actual del servidor para evitar duplicados.
- No sobrescribir registros del servidor automáticamente ante conflictos.

## 3. Almacenamiento local

Utilizar `@react-native-async-storage/async-storage`, previa comprobación de compatibilidad con el SDK instalado.

Guardar exclusivamente los datos necesarios:

- Identificador del docente.
- Identificador de la cursada.
- Identificador de la clase.
- Identificador del estudiante.
- Estado de asistencia.
- Observación, si corresponde.
- Fecha de última modificación local.

No almacenar tokens, contraseñas ni información personal innecesaria en el borrador.

La persistencia debe estar aislada por usuario y debe definirse una política segura de limpieza al cerrar sesión. No debe exponerse información de otro docente al cambiar de cuenta.

## 4. Estados de interfaz

**Borrador local**  
«Borrador guardado en este dispositivo. Pendiente de enviar».

**Error de conexión**  
«No se pudo guardar en el servidor. Tus cambios siguen guardados en este dispositivo».  
Acción: **Reintentar guardado**.

**Guardado confirmado**  
«Asistencia guardada correctamente».

El estado de éxito solamente debe mostrarse después de recibir confirmación del backend.

## 5. Restricciones

No implementar:

- Sincronización automática en segundo plano.
- Cola global de operaciones.
- Motores de sincronización.
- Reintentos periódicos automáticos.
- Resolución automática de conflictos.
- MMKV.
- Nuevas pantallas de administración de pendientes.
- Modificaciones al backend.
- Refactorizaciones generales.
- Cambios de SDK como parte de este PR.

Conservar la arquitectura, navegación, servicios, componentes visuales y manejo de sesión existentes.

## 6. Plan de implementación

### Fase 1 — Inspección técnica

Antes de modificar archivos:

1. Ejecutar `git status --short`.
2. Identificar la pantalla real de toma de asistencia.
3. Revisar los servicios y tipos existentes.
4. Verificar los endpoints y contratos utilizados para guardar y consultar asistencia.
5. Revisar cómo se gestionan actualmente los estados seleccionados y guardados.
6. Comprobar si AsyncStorage ya está instalado.
7. Presentar los archivos que necesitan modificación.

**No realizar cambios hasta recibir autorización.**

### Fase 2 — Persistencia local

Implementar un servicio pequeño y tipado que permita:

- Guardar borrador.
- Recuperar borrador.
- Actualizar borrador.
- Eliminar borrador confirmado.

Evitar escribir datos locales antes de identificar correctamente la clase y el docente.

### Fase 3 — Integración

Integrar el servicio con la pantalla actual de asistencia.

Mantener el funcionamiento existente cuando hay conexión.

Garantizar que un fallo de red no elimine el borrador.

Evitar condiciones de carrera entre guardados locales, recuperación y confirmación del servidor.

### Fase 4 — Validación

Ejecutar:

```bash
npx tsc --noEmit
npx expo-doctor@latest
```

Realizar pruebas en Android con backend real.

## 7. Criterios de aceptación

- [ ] El docente puede marcar asistencia normalmente.
- [ ] Los cambios quedan almacenados localmente.
- [ ] Al cerrar y abrir la aplicación, se recupera el borrador.
- [ ] Si falla Internet, no se pierden los cambios.
- [ ] El docente puede reintentar manualmente.
- [ ] El servidor recibe correctamente la asistencia.
- [ ] No se generan registros duplicados al reintentar.
- [ ] El borrador se elimina únicamente después de confirmar el guardado.
- [ ] Los datos de diferentes docentes o clases no se mezclan.
- [ ] No se presentan errores de TypeScript.
- [ ] No se afectan otras pantallas ni funcionalidades existentes.

## 8. Instrucciones para el agente

Trabajar con cambios mínimos, incrementales y verificables.

No inventar endpoints, tipos ni comportamientos del backend.

No modificar archivos ajenos al alcance.

No eliminar cambios existentes en Git.

No crear commits ni ejecutar migraciones de dependencias sin autorización.

**Primera tarea:** inspeccionar el código actual, informar el diagnóstico y proponer los archivos a modificar. Esperar aprobación antes de implementar.
