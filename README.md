# Autos

## Netlify Functions

Este proyecto usa dos funciones serverless:

- `netlify/functions/obtenerTareaClickUp.js`
- `netlify/functions/obtenerTareaSupabase.js`

### Configuración requerida

1. Variables de entorno en Netlify:
	 - `CLICKUP_TOKEN`
	 - `SUPABASE_URL`
	 - `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`)
2. Archivo de configuración:
	 - `netlify.toml` (incluido en este repo)

### Endpoint

- ClickUp (renombrado):
	- `/api/obtener-tarea-clickup?task_id=TU_TASK_ID`
	- `/.netlify/functions/obtenerTareaClickUp?task_id=TU_TASK_ID`
- Supabase (JSON simple, 1 registro):
	- `/api/obtener-tarea-supabase?table=tareas&field_name=task_id&field_value=TU_TASK_ID`
	- `/.netlify/functions/obtenerTareaSupabase?table=tareas&field_name=task_id&field_value=TU_TASK_ID`

Notas para Supabase:
- `field_name` y `field_value` son dinámicos para buscar por un campo específico (no necesariamente la PK).
- Si no envías `field_name`, usa `task_id`.
- Si no envías `field_value`, intenta con `task_id` o `id`.
- Devuelve solo un registro usando `limit=1`.

### Probar en local

Si usas Netlify CLI:

```bash
netlify dev
```

Luego prueba:

```bash
curl "http://localhost:8888/api/obtener-tarea-clickup?task_id=TU_TASK_ID"
curl "http://localhost:8888/api/obtener-tarea-supabase?table=tareas&field_name=task_id&field_value=TU_TASK_ID"
```