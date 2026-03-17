# Academia Dialectica

Plataforma integral de gestion economica, academica y marketing para Academia Dialectica (Bogota, Colombia). Combina un sitio publico interactivo, un portal administrativo, un portal estudiantil con gamificacion RPG y landing page con gamificacion para fidelizacion de clientes. Permite realizar una contabilidad y analisis economico completo de la empresa para tomar decisiones basadas en data.

## Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Base de datos | PostgreSQL (Supabase) + Prisma 7 |
| Autenticacion | NextAuth v5 — Google OAuth (admin) + Credentials (estudiantes) |
| Estilos | Tailwind CSS 4 |
| IA | Vercel AI SDK v4 (Claude, OpenAI) + Claude Vision para analisis de formularios |
| Despliegue | Docker (standalone output) |

## Funcionalidades

### Sitio Publico (`/`)

- **Hero Section** con animacion de neuronas biologicas en HTML5 Canvas — fisica de fuerzas de resorte, sprites procedurales, parallax, chispas electricas en curvas Bezier
- **Neuron Hunt:** mini-juego interactivo donde el jugador elimina neuronas de un color objetivo dentro de un temporizador de 2 minutos, con dificultad escalable, repulsion del mouse y muros en L
- **Captura de leads:** formulario post-juego (nombre, email, telefono) con puntuacion del juego guardada
- **Testimonios y casos de exito** con toggles de visibilidad
- **SEO:** Open Graph, imagen OG dinamica, JSON-LD, sitemap, robots.txt

### Portal Administrativo (`/admin/*`)

- **Dashboard:** resumen de balances mensuales + alerta de sugerencias no leidas
- **Clientes:** CRUD completo con formularios modales
  - **Analisis IA:** sube foto de un formulario de estudiante y Claude Vision extrae los campos automaticamente
  - **Importacion masiva:** sube foto con multiples formularios, Claude extrae todos como JSON, tabla editable de vista previa, insercion atomica en lote
- **Detalle de cliente** (`/admin/clients/[id]`):
  - Panel de gamificacion (HP/XP/Nivel) en ancho completo
  - Examenes con puntajes codificados por color (verde >= 7, amarillo >= 5, rojo < 5)
  - Notas de progreso con seleccion de colores
  - Buzon de sugerencias (lectura + marcar como leido)
- **Leads:** lista numerada con exportacion CSV por rango
- **Balances:** seguimiento mensual de sesiones sincronizadas desde Google Calendar
- **Chatbot IA:** burbuja flotante con proveedores intercambiables (Claude, OpenAI), consulta datos de la BD con guardrails anti-alucinacion y redaccion de PII
- **Bot de Telegram:** webhook en `/api/telegram/webhook` para entrada rapida desde el celular

### Portal Estudiantil (`/client/*`)

- **Creacion de personaje RPG:** seleccion unica de clase (Guerrero, Mago, Explorador) + nombre del heroe
- **Dashboard RPG:** avatar con fallback de letra, barra de HP (codificada por color), barra de XP (gradiente), nivel
- **Datos academicos:** examenes y notas de progreso (solo lectura)
- **Buzon de sugerencias:** envio de sugerencias al administrador

### Seguridad

- RBAC con autenticacion dual (Google OAuth + usuario/contrasena)
- Prevencion de IDOR (acciones CLIENT usan `session.userId`)
- Validacion de contrasenas (lista de 20 contrasenas debiles + reglas de complejidad)
- Headers de seguridad (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Redaccion de PII antes de enviar datos a proveedores de IA
- Verificacion de secreto en webhook de Telegram
- Sesion JWT con expiracion de 24 horas

## Inicio Rapido

### Requisitos

- Node.js 20+
- PostgreSQL (o Supabase)

### Variables de Entorno

Crear archivo `.env` (sin espacios iniciales, sin espacios alrededor de `=`):

```env
# Base de datos
DATABASE_URL=postgresql://...

# Autenticacion
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=tu-admin@gmail.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Proveedores IA
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Bot de Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USER_ID=...
TELEGRAM_WEBHOOK_SECRET=...
```

### Instalacion

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Docker

```bash
docker build -t running-app .
docker run -p 3000:3000 --env-file .env running-app
```

## Estructura del Proyecto

```
app/
  admin/            # Paginas del portal administrativo
  client/           # Paginas del portal estudiantil
  api/              # Rutas API (chat, analyze, telegram, leads)
  login/            # Pagina de inicio de sesion
components/         # Componentes React (paneles, formularios, canvas, chat)
  welcome/          # Componentes del sitio publico (hero, neuron canvas)
lib/
  actions/          # Server Actions (client, exam, gamification, etc.)
  auth.ts           # Configuracion de NextAuth
  prisma.ts         # Singleton del cliente Prisma
  password.ts       # Hash y validacion de contrasenas
prisma/
  schema.prisma     # Esquema de la base de datos
memory/             # Documentacion de implementacion (00-13)
```

## Documentacion de Implementacion

Notas detalladas de cada funcionalidad en el directorio `memory/`:

| Archivo | Funcionalidad |
|---------|---------------|
| `00_implementation.md` | Configuracion de Prisma 7 y Supabase |
| `01_implementation.md` | Scaffolding de Next.js y sistema de balances mensuales |
| `02_implementation.md` | Gestion de clientes y bot de Telegram |
| `03_implementation.md` | Analisis IA de formularios de clientes (Claude Vision) |
| `04_implementation.md` | Pagina publica y reestructuracion del admin |
| `05_implementation.md` | Importacion masiva de clientes desde foto |
| `06_implementation.md` | Chatbot IA asistente (multi-proveedor) |
| `07_implementation.md` | Animacion de neuronas en canvas |
| `08_implementation.md` | Mini-juego Neuron Hunt |
| `09_implementation.md` | Formulario de captura de leads |
| `10_implementation.md` | Numeracion de leads y descarga CSV |
| `11_implementation.md` | RBAC y portal estudiantil |
| `12_implementation.md` | Pagina de detalle de cliente (admin) |
| `13_implementation.md` | Endurecimiento de seguridad |

## Registro del Webhook de Telegram

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<dominio>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```
