# Deel-backend-badges

## Setup rápido

1. Copiá variables de entorno:

```bash
cp .env.example .env
```

2. Completá `.env` con valores reales.

3. Instalá dependencias y corré:

```bash
npm install
npm run dev
```

## Seguridad mínima aplicada

- `.env` está ignorado por git y `.env.example` contiene placeholders seguros.
- El backend valida variables críticas al iniciar y falla rápido con mensaje claro si falta alguna.
- CORS usa lista permitida (`CORS_ALLOWED_ORIGINS`) y en producción no acepta wildcard `*`.
- Se agrega `helmet` para hardening HTTP base.
- Rate limit activo para reducir abuso básico.
- Rate limit más estricto en endpoints sensibles: `POST /api/results`, `POST /api/leads`, `POST /api/validate-responses`.
- Validación estricta de payload (campos desconocidos rechazados) en:
  - `POST /api/results`
  - `POST /api/leads`
  - `POST /api/validate-responses`
- Límite explícito de tamaño JSON: `200kb`.
- TLS de base de datos es seguro por defecto; `DB_SSL_INSECURE=true` solo se permite fuera de producción.
- Se soporta `DB_SSL_CA` para enviar CA custom al cliente de PostgreSQL (formato de una línea con `\n` escapados).
- Se eliminó el flujo obsoleto de LinkedIn OAuth del backend.

## Variables importantes

- `CORS_ALLOWED_ORIGINS`: lista separada por comas de orígenes permitidos.
- `DB_SSL_INSECURE`: solo para desarrollo local si tu entorno no valida certificados TLS.
- `DB_SSL_CA`: CA PEM opcional para TLS de PostgreSQL (obligatoria solo si tu proveedor no encadena contra trust store estándar).

## Nota de migración de modelo (results / leads)

Se agregó una migración SQL en:

- `migrations/2026-05-15_results_leads_model_adjustment.sql`

Qué hace:

- Renombra `job` -> `current_job_title` (sin duplicar columnas).
- Mantiene `email` como `email` (no crea `professional_email`).
- Agrega `current_country` con estrategia segura: primero nullable, luego `NOT NULL` solo si no hay nulos existentes.
- Elimina `company` en `results` y `leads` si existe.

Si hay datos viejos sin `current_country`, la migración NO fuerza `NOT NULL` en esa corrida. En ese caso, completá/backfilleá datos y luego ejecutá el `ALTER COLUMN ... SET NOT NULL` en una segunda fase.

## Render + PostgreSQL TLS (producción)

Configuración recomendada en Render:

- `NODE_ENV=production`
- `DB_SSL_INSECURE=false`
- `DATABASE_URL=<tu url postgres>`

`rejectUnauthorized` queda en `true` por defecto.

### ¿Cuándo setear `DB_SSL_CA`?

Seteala cuando el proveedor entrega un certificado que **no** valida con el trust store estándar del runtime (caso típico del error `SELF_SIGNED_CERT_IN_CHAIN`).

Si tu proveedor ya usa una cadena confiable por defecto, podés dejar `DB_SSL_CA` sin definir y el backend no bloquea el arranque.

### Cómo cargar `DB_SSL_CA`

Pegá el certificado PEM en **una sola línea**, reemplazando saltos por `\n`:

`DB_SSL_CA=-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----`
