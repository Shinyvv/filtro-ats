# Auditoria LLM MVP (resumen)

## Resumen ejecutivo
- total_medidas: 15
- aplicadas: 4
- parciales: 3
- no_aplicadas: 8
- riesgo_general: Alto

## Hallazgos criticos
1. Llamadas LLM desde endpoint publico sin autenticacion ni rate limit.
2. Sin limites de consumo por empresa (cuotas) ni registro de uso.
3. Sin limites de tokens de salida ni timeouts para Gemini.
4. Sin defensa explicita contra prompt injection en el CV.

## Tabla de auditoria
| # | Medida | Estado | Evidencia (resumen) | Riesgo si falta | Recomendacion |
|---|---|---|---|---|---|
| 1 | Proteccion de API Key | Aplicada | GEMINI_API_KEY solo en backend | Exposicion de clave si pasa al cliente | Mantener solo server-side y revisar variables NEXT_PUBLIC |
| 2 | Flujo de llamada al LLM | Aplicada | Server action -> Gemini | Exposicion directa si se mueve al cliente | Mantener flujo server-side |
| 3 | Autenticacion antes de usar IA | No aplicada | Endpoint publico de apply | Abuso anonimo y alto consumo | Requerir autenticacion o gate por captcha + rate limit |
| 4 | Autorizacion y multi-tenant | Parcial | Dashboard con companyId, pero apply sin companyId/rol | Acceso cruzado o uso no controlado | Verificar companyId/rol antes de evaluar |
| 5 | Rate limiting | No aplicada | No hay limites por IP/usuario | Abuso de tokens y DoS | Limitar por IP + jobId + usuario |
| 6 | Limites de archivo | Aplicada | Max 5MB y MIME PDF/DOCX | Carga de archivos maliciosos o muy grandes | Mantener limites y agregar verificacion de extension si aplica |
| 7 | Limites de texto extraido | No aplicada | CV completo sin recorte | Tokens excesivos y costo alto | Recortar y normalizar texto del CV |
| 8 | Control de tokens de salida | No aplicada | Sin maxOutputTokens | Respuestas largas e impredecibles | Definir maxOutputTokens, temperature, topP/topK |
| 9 | Prompt cerrado y salida estructurada | Aplicada | Prompt fijo + JSON + validacion zod | Respuestas no estructuradas | Mantener validacion y JSON estricto |
| 10 | Defensa contra prompt injection | No aplicada | Prompt sin instrucciones de desconfianza | CV puede alterar la salida | Agregar reglas de no obedecer instrucciones del CV |
| 11 | Cache / deduplicacion | No aplicada | Sin hash CV+oferta | Consumo repetido | Hash y cachear evaluaciones |
| 12 | Registro de uso | No aplicada | Sin tabla de uso | Sin trazabilidad ni costos | Guardar input/output tokens, modelo, costo, usuario |
| 13 | Presupuesto interno por empresa | No aplicada | Sin cuotas | Consumo ilimitado por empresa | Definir cuota diaria/mensual |
| 14 | Manejo de errores y retries | Parcial | Fallback a mock, sin timeout | Bloqueos o fallos silenciosos | Agregar timeout y retry con backoff |
| 15 | Seguridad general del endpoint | Parcial | Zod + validacion de archivo, sin CSRF/rate limit | Abuso o spam | Agregar rate limit y controles anti-abuso |

## Orden recomendado para MVP
1. Rate limiting por IP/usuario y captcha para apply.
2. Autenticacion o gate para acceso a la evaluacion IA.
3. Limites de texto extraido y maxOutputTokens.
4. Registro de uso + cuota por empresa.
5. Defensa contra prompt injection.
6. Cache/deduplicacion por CV+oferta.
7. Timeouts y retries controlados.
