# react-native-expo-project-guidelines

## Propósito

Este skill define las pautas de trabajo para desarrollar proyectos con
**React Native + Expo + TypeScript**, manteniendo una arquitectura
modular, reutilizable y preparada para integrarse con APIs.

El agente debe priorizar la comprensión de la estructura existente antes
de modificarla y debe evitar crear archivos, componentes o capas
redundantes.

------------------------------------------------------------------------

## 1. Regla principal: respetar la arquitectura existente

Antes de crear, mover, renombrar o eliminar archivos:

1.  Revisar la estructura actual del proyecto.
2.  Identificar si ya existe un archivo o componente con una
    responsabilidad equivalente.
3.  Reutilizar lo existente siempre que sea razonable.
4.  No imponer una arquitectura nueva sobre una arquitectura ya
    definida.
5.  Si se detecta una inconsistencia arquitectónica, explicarla antes de
    modificarla.

**Nunca crear un archivo nuevo simplemente porque sería la estructura
habitual si el proyecto ya resuelve esa responsabilidad de otra
manera.**

------------------------------------------------------------------------

## 2. Arquitectura de referencia

La estructura base esperada es de tipo **feature-based/modular con
separación de responsabilidades**:

``` text
src/
├── app/
│   ├── (public)/
│   ├── (private)/
│   └── _layout.tsx
│
├── components/
│   ├── AppButton.tsx
│   ├── AppInput.tsx
│   ├── FeedbackState.tsx
│   └── Screen.tsx
│
├── constants/
│   └── theme.ts
│
├── features/
│   └── auth/
│       ├── components/
│       └── services/
│
└── lib/
    ├── api/
    └── storage/
```

Esta estructura es una referencia. El agente debe adaptarse al proyecto
real.

------------------------------------------------------------------------

## 3. Responsabilidad de `app/`

`src/app/` pertenece principalmente a **Expo Router** y debe contener
las rutas y layouts.

Ejemplo:

``` text
app/
├── _layout.tsx
├── (public)/
│   ├── _layout.tsx
│   └── login.tsx
└── (private)/
    ├── _layout.tsx
    ├── index.tsx
    └── profile.tsx
```

Los archivos de rutas deben mantenerse relativamente simples.

Evitar colocar directamente en ellos:

-   lógica HTTP compleja;
-   llamadas directas repetidas a APIs;
-   lógica de almacenamiento;
-   componentes UI grandes;
-   lógica de negocio extensa.

Las rutas deben principalmente **componer componentes y controlar
navegación**.

------------------------------------------------------------------------

## 4. Grupos `(public)` y `(private)`

Usar Route Groups de Expo Router para separar navegación pública y
privada.

``` text
(public)
→ pantallas accesibles sin autenticación

(private)
→ pantallas destinadas a usuarios autenticados
```

Ejemplos públicos:

-   Login
-   Registro
-   Recuperación de contraseña

Ejemplos privados:

-   Home
-   Perfil
-   Configuración

Recordar que los paréntesis pertenecen al sistema de Route Groups de
Expo Router. El nombre `public` o `private` no protege automáticamente
las rutas.

La protección debe depender del estado real de sesión.

------------------------------------------------------------------------

## 5. `components/`: UI reutilizable global

Los componentes genéricos y reutilizables deben ubicarse en
`components/`.

Ejemplos:

``` text
AppButton.tsx
AppInput.tsx
FeedbackState.tsx
Screen.tsx
```

Estos componentes no deben conocer detalles específicos de una feature
cuando puedan evitarlo.

Por ejemplo, `AppInput` puede utilizarse en:

-   autenticación;
-   perfil;
-   formularios;
-   búsquedas;
-   configuración.

------------------------------------------------------------------------

## 6. `features/`: funcionalidades del negocio

Cada funcionalidad importante puede organizarse dentro de:

``` text
features/<feature>/
```

Por ejemplo:

``` text
features/auth/
├── components/
│   ├── AuthInput.tsx
│   └── LoginForm.tsx
└── services/
    ├── auth.service.ts
    ├── auth.types.ts
    ├── session.provider.tsx
    └── useSession.ts
```

Los componentes dentro de una feature deben tener sentido principalmente
para esa funcionalidad.

Antes de crear un componente específico como `AuthInput`, verificar que
no duplique innecesariamente un componente global como `AppInput`.

------------------------------------------------------------------------

## 7. Separación esperada del flujo de autenticación

Evitar realizar toda la autenticación dentro de `LoginForm`.

El flujo preferido es:

``` text
login.tsx
    ↓
LoginForm.tsx
    ↓
useSession / SessionProvider
    ↓
auth.service.ts
    ↓
api.client.ts
    ↓
API Backend
```

Cuando existe un token:

``` text
API
 ↓
auth.service
 ↓
SessionProvider
 ↓
secure-storage
 ↓
Token almacenado
```

Cada capa debe tener una responsabilidad clara.

------------------------------------------------------------------------

## 8. Session Provider

El estado de autenticación debe ser accesible globalmente mediante un
contexto/provider cuando la arquitectura existente lo utilice.

Conceptualmente:

``` text
SessionProvider
├── estado de autenticación
├── usuario
├── token o información de sesión
├── signIn()
└── signOut()
```

Una versión inicial puede utilizar:

``` tsx
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

Pero al integrar una API real debe considerarse:

-   persistencia del token;
-   restauración de sesión;
-   cierre de sesión;
-   estado de carga inicial;
-   información del usuario;
-   manejo de errores.

------------------------------------------------------------------------

## 9. Servicios de autenticación

`auth.service.ts` debe encargarse de comunicarse con la infraestructura
HTTP para operaciones relacionadas con autenticación.

Ejemplos:

``` text
login
logout
refreshToken
getCurrentUser
```

Evitar realizar `fetch()` directamente dentro de componentes visuales
cuando ya existe una capa de servicios.

------------------------------------------------------------------------

## 10. Cliente HTTP

La configuración común de comunicación HTTP debe centralizarse en:

``` text
lib/api/api.client.ts
```

El objetivo es evitar repetir configuración de red en diferentes
features.

Puede centralizar responsabilidades como:

-   URL base;
-   headers comunes;
-   token de autenticación;
-   manejo de respuestas;
-   errores comunes;
-   interceptores, cuando corresponda.

------------------------------------------------------------------------

## 11. Storage

La persistencia debe estar separada de los componentes visuales.

Ejemplo:

``` text
lib/storage/secure-storage.ts
```

Utilizar esta capa para guardar información sensible de sesión cuando
corresponda.

Los componentes no deberían conocer los detalles internos de cómo se
almacena el token.

------------------------------------------------------------------------

## 12. Theme y estilos

Las decisiones visuales globales deben centralizarse en:

``` text
constants/theme.ts
```

Ejemplos:

``` text
colors
spacing
radius
fontSize
```

Preferir:

``` tsx
backgroundColor: theme.colors.primary
```

en lugar de repetir:

``` tsx
backgroundColor: "#2563EB"
```

### Qué conviene centralizar

-   colores de identidad;
-   colores semánticos;
-   tamaños tipográficos repetidos;
-   espaciados estándar;
-   radios estándar;
-   valores visuales utilizados repetidamente.

### Qué puede permanecer local

No es necesario convertir cada valor CSS/React Native en una constante
global.

Es razonable mantener localmente:

``` tsx
flex: 1
width: "100%"
alignItems: "center"
flexDirection: "row"
```

También pueden permanecer locales medidas verdaderamente específicas de
un único componente.

**Evitar tanto el hardcodeo indiscriminado como la sobrearquitectura.**

------------------------------------------------------------------------

## 13. Props y TypeScript

Definir tipos claros para las props de los componentes.

Ejemplo:

``` tsx
type AppButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};
```

Cuando un componente amplía uno nativo, reutilizar los tipos existentes.

Ejemplo:

``` tsx
type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  isPassword?: boolean;
};
```

Esto significa:

``` text
AppInputProps
=
TextInputProps
+
props personalizadas
```

Evitar redeclarar manualmente propiedades que React Native ya
proporciona.

------------------------------------------------------------------------

## 14. Componentes reutilizables

Diseñar los componentes para que su comportamiento pueda configurarse
mediante props.

Ejemplo:

``` tsx
<AppInput
  label="Correo electrónico"
  placeholder="nombre@correo.com"
  keyboardType="email-address"
/>
```

y:

``` tsx
<AppInput
  label="Contraseña"
  isPassword
/>
```

deben poder utilizar el mismo componente base.

------------------------------------------------------------------------

## 15. Safe Area

No utilizar el `SafeAreaView` obsoleto de `react-native` cuando el
proyecto utiliza `react-native-safe-area-context`.

Preferir:

``` tsx
import { SafeAreaView } from "react-native-safe-area-context";
```

El componente `Screen` puede centralizar este comportamiento.

------------------------------------------------------------------------

## 16. Forma de trabajo del agente

Al trabajar sobre este tipo de proyecto:

1.  Revisar primero la estructura existente.
2.  Preguntar o inspeccionar el contenido de archivos relevantes antes
    de reemplazarlos.
3.  Trabajar **archivo por archivo**.
4.  No entregar diez archivos simultáneamente salvo que se solicite
    explícitamente.
5.  Explicar brevemente los conceptos nuevos introducidos.
6.  No asumir que el usuario conoce una abstracción de React/TypeScript
    solo porque aparece en el código.
7.  Mantener las explicaciones vinculadas al código real del proyecto.
8.  Verificar imports, rutas y nombres existentes antes de proponer
    nuevos.
9.  Evitar duplicar componentes o servicios.
10. Priorizar código mantenible y comprensible sobre abstracciones
    innecesarias.

------------------------------------------------------------------------

## 17. Modo didáctico

Cuando aparezca un concepto nuevo, explicar qué es y por qué se utiliza.

Conceptos especialmente importantes:

-   props;
-   `type`;
-   `useState`;
-   hooks;
-   destructuring;
-   context;
-   providers;
-   `children`;
-   navegación;
-   estado;
-   servicios;
-   separación de responsabilidades.

Ejemplo de explicación:

``` tsx
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

Debe explicarse conceptualmente como:

``` text
isAuthenticated
→ valor actual

setIsAuthenticated
→ función para modificar el valor

false
→ valor inicial
```

No limitarse a entregar código sin explicar el concepto cuando éste sea
nuevo para el usuario.

------------------------------------------------------------------------

## 18. Integración futura con APIs

Cuando se proporcione una API:

1.  Revisar primero su contrato.
2.  Identificar endpoints, métodos HTTP, request y response.
3.  Revisar `auth.types.ts`.
4.  Revisar `api.client.ts`.
5.  Implementar o adaptar `auth.service.ts`.
6.  Integrar el servicio con la sesión.
7.  Implementar almacenamiento seguro del token si corresponde.
8.  Recién después conectar el formulario.
9.  Manejar loading y errores visualmente.
10. Verificar navegación pública/privada.

No colocar directamente toda la integración HTTP en `LoginForm.tsx`.

------------------------------------------------------------------------

## 19. Principio general

La prioridad es mantener un proyecto que pueda crecer sin convertir las
pantallas en archivos monolíticos.

La dirección general debe ser:

``` text
UI reutilizable
      ↓
Feature
      ↓
Servicios
      ↓
Infraestructura
      ↓
Backend
```

Cada capa debe saber lo mínimo necesario sobre las demás.

El agente debe favorecer soluciones simples, profesionales, explicables
y compatibles con la arquitectura existente antes que introducir
patrones o abstracciones innecesarias.
