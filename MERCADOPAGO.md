# LifeHub — Conexión con Mercado Pago

Permite conectar tu cuenta de Mercado Pago (Chile) por **OAuth 2.0** y traer tus
pagos como movimientos en Finanzas. **Nunca ingresas tus claves en LifeHub**: la
autorización ocurre en el sitio de Mercado Pago.

## Configuración

1. **Crea una app** en [mercadopago.cl/developers](https://www.mercadopago.cl/developers) →
   *Tus integraciones → Crear aplicación*. Copia el **Client ID** y **Client Secret**.
2. En la config de la app, agrega la **Redirect URI**:
   `https://tu-app.vercel.app/api/mp/callback`
3. Corre `supabase/schema-mercadopago.sql` en Supabase (crea `mp_connections` y
   agrega `external_id` a `movements` para no duplicar).
4. En Vercel → Environment Variables:

   | Variable | Valor |
   |----------|-------|
   | `MP_CLIENT_ID` | tu Client ID |
   | `MP_CLIENT_SECRET` | tu Client Secret |
   | `MP_REDIRECT_URI` | `https://tu-app.vercel.app/api/mp/callback` |

   Redeploy.
5. En LifeHub → Finanzas → **Conexiones** → *Conectar Mercado Pago*. Autoriza y
   listo. Usa **Sincronizar ahora** para traer tus últimos pagos.

## Cómo funciona
- El flujo OAuth guarda un token de acceso (en `mp_connections`, protegido por RLS).
- *Sincronizar* llama a `/v1/payments/search` y crea movimientos confirmados,
  usando `external_id = mp:<id>` para **no duplicar** en re-sincronizaciones.

## Nota importante (honesta)
La API pública de Mercado Pago está orientada a **pagos recibidos** (cobros de
vendedor/colector). Por eso `/v1/payments/search` devuelve tus **cobros**. Leer
el detalle completo de una billetera personal (todos los gastos) no es una
capacidad estándar de la API pública; si tu caso es ese, lo revisamos según lo
que exponga tu cuenta/app de MP.
