# Validación de la interfaz simplificada

Revisión inicial: 30 de octubre de 2026. Actualización documental: 2 de noviembre de 2026. Alcance: PC; versión publicada por el usuario en https://silk-node.vercel.app/.

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

La revisión visual final de PC obtuvo disposición «ship», basada en captura 1408×703 y código, sin navegación independiente del revisor. Las comprobaciones funcionales se hicieron en Chrome; no certifican otros navegadores, equipos ni tamaños. No se atribuyen a esta versión los ensayos históricos de archivos, controles móviles o reproducción automática, funciones ya eliminadas. La edición manual de costos fue reincorporada después y se comprobó por separado, como se detalla abajo. `npm run build` aprobó la compilación final. El detector visual solo indicó colores tonales no declarados en la paleta documental (avisos, no errores funcionales).

El lanzador de Windows no se ha ejecutado en Windows. Los costos son M USD simulados, no estimaciones ferroviarias reales. La reparación minimiza cantidad de enlaces nuevos, no inversión. El solver es exhaustivo dentro del límite de 5–10 ciudades.

## Última modificación funcional: matriz manual

Corrección posterior de las casillas vacías: todas las casillas fuera de la diagonal en Manual son campos de texto desde que aparece la matriz. El campo ocupa toda la casilla y permanece montado al activar el enlace, conservando el foco. Se verificó en navegador la creación desde una matriz vacía, la sincronización de 99 en ambos sentidos, la edición desde la casilla inversa, el rechazo de 0 y la edición después de obtener un resultado. Un anillo con pesos 10, 20, 30, 40 y 50 dio 150; cambiar 10 por 99 recalculó 239. Sin errores de consola; 16 pruebas y compilación aprobadas después de la corrección. Captura: `.impeccable/review/manual-empty-cell-fix.png`. Estas comprobaciones se realizaron localmente antes de publicar la corrección.

Comprobaciones de navegador registradas durante la implementación, con captura en `.impeccable/review/manual-matrix.png`:

| Caso | Resultado observado |
| --- | --- |
| Cuatro ciudades seleccionadas | Matriz y título ocultos. |
| Quinta ciudad seleccionada | Matriz visible. |
| Activar Londres–París en Manual y escribir 99 | Las dos casillas simétricas y el mapa muestran 99. |
| Escribir 0 y salir del campo | Se restaura el último valor válido, 99. |
| Cambiar a Conectar todo | No hay campos editables; se usan costos por defecto. |
| Volver a Manual | Se recupera 99 en ambas casillas. |
| Consola del navegador | Sin errores registrados. |

En la revisión de publicación del 2 de noviembre se ejecutaron correctamente las 16 pruebas y la compilación. Al retomar el trabajo, el código de aplicación y pruebas seguía sin cambios respecto de `4192de4`; no se repitieron estos ensayos por corregir solamente documentación. La página pública respondió y su HTML referencia los mismos nombres de archivos JavaScript y CSS que la compilación local verificada. Esto no sustituye una nueva prueba interactiva de todos los flujos en producción ni confirma por sí solo la configuración de despliegue automático en Vercel.
