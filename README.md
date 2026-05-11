# Autos

## Netlify Functions

Este proyecto usa una función serverless en `netlify/functions/obtenerTarea.js`.

### Configuración requerida

1. Variable de entorno en Netlify:
	 - `CLICKUP_TOKEN`
2. Archivo de configuración:
	 - `netlify.toml` (incluido en este repo)

### Endpoint

- Ruta amigable:
	- `/api/obtener-tarea?task_id=TU_TASK_ID`
- Ruta directa Netlify:
	- `/.netlify/functions/obtenerTarea?task_id=TU_TASK_ID`

### Probar en local

Si usas Netlify CLI:

```bash
netlify dev
```

Luego prueba:

```bash
curl "http://localhost:8888/api/obtener-tarea?task_id=TU_TASK_ID"
```