# LifeHub — PWA + Notificaciones (guía)

LifeHub es una **PWA**: se instala en el iPhone gratis (sin App Store) y envía
**notificaciones push** configurables por ti.

## 1. Instalar en el iPhone (gratis)

1. Abre `https://tu-app.vercel.app` en **Safari**.
2. Toca **Compartir** → **Agregar a inicio**.
3. Abre LifeHub desde el ícono. Ya funciona como app.

> iOS **solo permite notificaciones si la app está instalada** en la pantalla de inicio.

## 2. Configuración (una sola vez)

### 2.1 Claves VAPID
```bash
npx web-push generate-vapid-keys
```

### 2.2 SQL en Supabase
Corre en el SQL Editor:
- `supabase/schema-notifications.sql` (suscripciones + preferencias)
- `supabase/schema-notifications-v2.sql` (horarios + anti-duplicados)

### 2.3 Variables de entorno en Vercel
Settings → Environment Variables (Production/Preview/Development):

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Key |
| `VAPID_PRIVATE_KEY` | Private Key |
| `VAPID_SUBJECT` | `mailto:tu-correo@ejemplo.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (¡secreta!) |
| `CRON_SECRET` | una cadena larga y aleatoria |

Redeploy después de agregarlas.

### 2.4 Motor de horarios (GitHub Actions)
El motor corre **cada 30 min** desde `.github/workflows/notify.yml` y decide
qué enviar según tus horarios. Agrega **2 secretos del repo** en GitHub →
Settings → Secrets and variables → Actions:

| Secreto | Valor |
|---------|-------|
| `LIFEHUB_URL` | `https://life-hub-puce.vercel.app` (sin barra final) |
| `CRON_SECRET` | el mismo de Vercel |

### 2.5 Activar en tu dispositivo
Abre LifeHub instalada → **campana** → **Activar** → **Enviar prueba**.

## 3. Cómo funciona

En **Notificaciones** eliges qué recibir, **a qué hora** cada cosa, y el umbral
de saldo bajo. Todos los avisos son **accionables** (abren la pantalla correcta).

**Por horario** (una vez al día, ±30 min):
- 🔥 **La Forja** — frase del día motivadora (por defecto 06:00).
- 🔥 **369** — recordatorio de escribir tu 369 de mañana / tarde / noche, a las horas que definas.
- 📋 **Resumen** — pagos por confirmar, hábitos, tareas y metas por vencer.
- 💸 **Saldo bajo** — si el saldo del mes baja del umbral que fijaste.

**Al instante** (no espera horario):
- 🏠 **Tarea asignada** — cuando alguien del hogar te asigna una tarea, te llega al toque.

### Probar el motor a mano
```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" "https://life-hub-puce.vercel.app/api/cron/notify"
```
Envía lo que corresponda a la hora actual. Devuelve un JSON con `processed` y `pushesSent`.

> **Precisión:** en plan gratis los horarios son aproximados (±30 min). Para
> precisión al minuto, usa Vercel Pro (crons por minuto) o un cron externo
> (cron-job.org) apuntando a la misma URL con el header de autorización.
