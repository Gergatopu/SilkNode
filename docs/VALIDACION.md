# Validación de la interfaz simplificada

Fecha: 30 de octubre de 2026. Alcance: PC, entrega local sin publicación.

## Pruebas automatizadas

`npm test`: 16 pruebas aprobadas tras actualizar el modelo de costos. Cubren Haversine, oráculo exhaustivo independiente, óptimos y empates, orden lexicográfico, matriz explícita, grafos sin ciclo, reparación mínima y 181440 ciclos con 10 ciudades. También comprueban los 100 registros originales, costos deterministas y acotados, y generación aleatoria reproducible.

## Comprobaciones de navegador de esta versión

| Caso | Resultado observado |
| --- | --- |
| Cinco ciudades, Conectar todo | Evaluación automática y Siguiente paso habilitado. |
| Cinco ciudades, anillo manual | Un ciclo válido. |
| Quitar un enlace del anillo | Se sugiere un enlace mínimo para reparar la red. |

| Diez ciudades completas | 181440 ciclos; undécima selección rechazada. |
| Matriz y paneles | Matriz 304,5 × 304,5 px en ventana 1408 × 703; paneles sin desbordamiento. |
| Aleatorio | Conserva las diez ciudades y los costos fijos de los enlaces. |
| Siguiente paso directo | Generar, comprobar, sumar y comparar disponibles sin botón previo de exploración. |
| Scroll fuera del mapa | Regreso a la portada comprobado. |
| Consola | Sin errores registrados en la sesión de pruebas. |

## Límites de esta evidencia

La revisión visual final de PC obtuvo disposición «ship», basada en captura 1408×703 y código, sin navegación independiente del revisor. Las comprobaciones funcionales se hicieron en Chrome; no certifican otros navegadores, equipos ni tamaños. No se atribuyen a esta versión los ensayos históricos de costos personalizados, archivos, controles móviles o reproducción automática, funciones ya eliminadas. `npm run build` aprobó la compilación final. El detector visual solo indicó colores tonales no declarados en la paleta documental (avisos, no errores funcionales).

El lanzador de Windows no se ha ejecutado en Windows. No hay publicación remota. Los costos son M USD simulados, no estimaciones ferroviarias reales. La reparación minimiza cantidad de enlaces nuevos, no inversión. El solver es exhaustivo dentro del límite de 5–10 ciudades.
