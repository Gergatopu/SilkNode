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

1. Pulsar **Empezar**, elegir escenario y modo. Seleccionar 5–10 de las 20 ciudades en el mapa.
2. En **Manual**, pulsar dos ciudades seleccionadas para crear o quitar su conexión. Al crearla aparece el costo predeterminado.
3. Pulsar el peso de una arista para editarlo (entero 1–99), guardar, cancelar o eliminar la conexión. Mayús + clic elimina una ciudad.
4. **Conectar todo** une cada pareja. **Aleatorio** regenera conexiones sin garantizar un ciclo y sin cambiar sus costos predeterminados.
5. El botón **Encontrar ruta óptima** siempre permanece visible. Está atenuado mientras no haya ciclos o se esté evaluando; se habilita en verde cuando existe al menos uno.
6. La lista **Todos** muestra los ciclos disponibles con paginación. La navegación y el paso a paso permanecen dentro del mapa.
7. Si no hay ciclos, las líneas discontinuas sugieren el mínimo número de conexiones para formar uno. Si hay ciclos pero falta el óptimo de referencia, se sugieren las conexiones para completarlo.
8. La referencia compara todas las conexiones posibles de las mismas ciudades usando exclusivamente los costos predeterminados. Entre óptimos empatados se elige el que requiere menos enlaces nuevos. No sobrescribe pesos editados; por eso puede diferir del mínimo con costos personalizados.
9. **Ver matriz** abre una consulta simétrica de los costos actuales, sin edición. La papelera limpia la sesión.

Interfaz para PC, sin scroll de página. Controles, resultados y operaciones están dentro del mapa; la matriz solo aparece al solicitarla. La sesión no se guarda ni exporta. Cambiar de escenario o recargar limpia la red.

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
