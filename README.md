# SILKNODE

Simulador educativo de redes ferroviarias: selecciona entre 5 y 10 ciudades y encuentra por fuerza bruta un ciclo hamiltoniano de costo mínimo. Los costos son **millones de dólares simulados (M USD)**, no presupuestos de ingeniería.

## Abrir en Visual Studio Code

Requisitos: Node.js 22.12 o superior compatible con Vite y npm.

1. Abrir esta carpeta en Visual Studio Code y abrir Terminal → Nueva terminal.
2. Ejecutar `npm ci` (requiere internet para instalar dependencias).
3. Ejecutar `npm run dev` y abrir la dirección local indicada, normalmente http://127.0.0.1:5173.

## Presentar localmente sin internet

Ejecutar `npm run build` después de cualquier cambio. La carpeta `dist` resultante incluye cartografía y fuentes locales; no solicita APIs ni teselas externas.

- Con Python 3: `python3 presentar.py` (Windows: `py presentar.py`), que abre http://127.0.0.1:8080.
- Con dependencias instaladas: `npm run preview`.
- También están disponibles `Iniciar SILKNODE.command` para macOS e `Iniciar SILKNODE.bat` para Windows.
- Mantener la terminal abierta; Ctrl+C detiene el servidor. Los módulos y el Worker necesitan HTTP local: no abrir `index.html` con doble clic.

## Uso en computadora

1. Pulsar **Empezar** y elegir un mapa: China, Europa, Estados Unidos, Rusia o Perú. Cada escenario conserva sus 20 ciudades originales.
2. Elegir **Manual**, **Conectar todo** o **Aleatorio** antes de seleccionar ciudades.
3. Seleccionar individualmente 5–10 ciudades **en el mapa**. Conectar todo genera todos los enlaces al completar la selección mínima y actualiza la red al cambiarla. Aleatorio genera cada par con probabilidad del 50 %; pulsarlo otra vez regenera los enlaces, manteniendo los costos. No garantiza un ciclo.
4. La matriz aparece al seleccionar al menos cinco ciudades. En Manual, pulsar una casilla oscura fuera de la diagonal activa el enlace con su costo por defecto: ambas casillas simétricas cambian de color y muestran el mismo valor. Escribir un entero entre **1 y 99** para modificarlo; el mapa y el cálculo se actualizan juntos. También se puede pulsar dos ciudades elegidas para crear o quitar su enlace. Mayús + clic quita una ciudad; la papelera limpia selección, enlaces y costos personalizados.
5. La red se evalúa automáticamente tras los cambios. Cuando existen ciclos, se habilitan su navegación, la lista **Todos** y **Siguiente paso**. Este último explica Generar → Comprobar → Sumar → Comparar, con avance y retroceso manuales.
6. Pulsar **Encontrar ruta óptima** para revelar el mínimo global. Anterior/siguiente y la lista recorren ciclos válidos en orden lexicográfico; el mejor visitado conserva su valor al retroceder.
7. Si no hay ciclo, añadir el conjunto mínimo de enlaces sugerido. La aplicación vuelve a evaluar la red.

La matriz cuadrada y el recorrido permanecen a la izquierda; mapa y navegación, a la derecha. La matriz se oculta de nuevo si quedan menos de cinco ciudades. La diagonal y los enlaces ausentes son casillas oscuras vacías. Solo Manual permite editar costos; una entrada inválida restaura el último valor válido al salir de la casilla.

Portada y planificador ocupan una pantalla cada uno, sin scroll. La rueda fuera del mapa cambia entre ambas pantallas; dentro del mapa controla el zoom. El logotipo vuelve al inicio. La ayuda matemática está en el botón de información del mapa. Se respeta movimiento reducido.

La aplicación está destinada a PC. No dispone de guardado, importación, exportación, cuentas ni servidor de datos. Recargar pierde la red; cambiar de escenario limpia selección y enlaces. Editar la red invalida resultados anteriores.

## Costos y algoritmo

Cada enlace tiene un costo por defecto entero entre 1 y 90 **M USD simulados**, editable entre 1 y 99 en Manual; la suma del circuito puede superar esos límites. Al cambiar a Conectar todo o Aleatorio se usan los costos por defecto; los cambios se recuperan al volver a Manual dentro del mismo escenario y sesión. Cambiar de escenario, limpiar el mapa o recargar elimina los costos personalizados. `src/weights.js` usa distancia de Haversine con radio 6371.0088 km y el hash determinista `h` de la clave del par:

- `terreno = 0.55 + (h % 196) / 100`, entre 0.55 y 2.50.
- `infraestructura = 120 + ((h >>> 8) % 1301)`, entre 120 y 1420.
- `raw = km × terreno + infraestructura`.
- `peso = max(1, min(90, round(90 × raw / máximo)))`.

El máximo se calcula sobre los 190 pares de las 20 ciudades del escenario. Cambiar la selección o regenerar enlaces no cambia los costos por defecto. Los factores son ilustrativos, no datos ferroviarios reales. Se calculan antes de resolver y no se ajustan para favorecer un circuito.

`src/algorithm.js` implementa la búsqueda propia: fija como origen la primera ciudad seleccionada según el orden del catálogo, enumera permutaciones lexicográficamente y descarta la orientación inversa duplicada. Comprueba todos los enlaces, incluido el regreso, y registra costos solo para ciclos válidos. Evalúa `(n−1)! / 2` órdenes canónicos: 12 con 5 ciudades y 181440 con 10. Tiempo `O(n × (n−1)!)`; historial `O((n−1)!)`.

El solver mantiene índices por costo para identificar mínimo y empates, además del orden lexicográfico para navegación. La interfaz no incluye un navegador separado de empates. Sin solución, minimiza **el número de enlaces nuevos**, no su costo. El cálculo corre en un Web Worker tras una espera de 140 ms desde el último cambio; una edición cancela el cálculo anterior. La explicación por pasos utiliza la traza ya calculada, sin reproducción automática ni velocidad.

## Código y bibliotecas

- `src/algorithm.js` y `src/weights.js`: enumeración, sugerencias y costos propios.
- `src/solver.worker.js`: cálculo separado del hilo de interfaz.
- `src/main.js` y `src/style.css`: interfaz, mapa y estado de la sesión.
- `public/data/`: cartografía y ciudades de Natural Earth.
- `tests/`: pruebas del solver, datos y costos; `docs/FLUJO.md` y `docs/VALIDACION.md`: flujo y evidencia.
- `dist/`: compilado regenerable. Los archivos de ejemplo antiguos no constituyen funciones de importación de la interfaz actual.

D3 gestiona proyecciones y navegación del mapa, no resuelve el TSP. Vite prepara el compilado. League Spartan se empaqueta localmente. No se requiere una API de IA.

## Verificar y publicar

`npm test` ejecuta las pruebas; `npm run build` genera el compilado. La evidencia y sus límites están en `docs/VALIDACION.md`.

Para publicar en Vercel:

1. Subir el código a GitHub, excluyendo `node_modules` y los ZIP.
2. Importar el repositorio en Vercel como proyecto Vite.
3. Usar instalación `npm ci`, compilación `npm run build` y salida `dist`; consultar `vercel.json`.
4. Elegir un plan según sus condiciones vigentes y probar la URL de producción en incógnito.

Publicación actual: [silk-node.vercel.app](https://silk-node.vercel.app/). Repositorio: [Gergatopu/SilkNode](https://github.com/Gergatopu/SilkNode), rama `main`.

Para actualizar: modificar y verificar el proyecto, guardar los cambios en un commit y subirlos a GitHub. Si la integración de Git de Vercel sigue conectada a `main`, el nuevo commit desencadena un despliegue. Comprobar su estado en Vercel y probar la URL pública al terminar.

## Alcance

Las conexiones rectas son hipotéticas: no representan vías existentes. Los costos no modelan terreno, infraestructura, fronteras, permisos ni inversión real. La cartografía regional muestra límites y divisiones, no calles ni estaciones. La enumeración exhaustiva se limita a 10 ciudades por su crecimiento factorial.

Procedencia y licencias: `LICENSE/SOURCES.md`. Las instrucciones históricas de rediseño están marcadas como superadas en `docs/PROMPT-REDISENO-FINAL.md`.
