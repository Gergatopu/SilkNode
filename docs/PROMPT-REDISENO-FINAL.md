> **Documento histórico superado — última simplificación del 30 de octubre de 2026.** El texto siguiente se conserva como antecedente y no debe ejecutarse como instrucciones vigentes. Prevalecen las últimas instrucciones del usuario, `README.md`, `PRODUCT.md` y `DESIGN.md`.
>
> Versión vigente solo para PC: elegir mapa, luego Manual/Conectar todo/Aleatorio y seleccionar 5–10 ciudades únicamente en el mapa, conservando las 20 originales por escenario. Sin listas de ciudades, casillas, búsqueda, controles móviles, guardado, importación, exportación, edición de pesos, modos de costo, reproducción automática, velocidad ni navegador separado de empates. Dos pantallas completas sin scroll; rueda fuera del mapa alterna pantallas y dentro hace zoom. Matriz cuadrada con números en negrita y diagonal/ausencias oscuras vacías, siempre a la izquierda junto al recorrido. Conectar todo y Aleatorio generan enlaces al seleccionar; Aleatorio regenera solo enlaces, sin ciclo garantizado. Manual alterna enlaces mediante dos ciudades elegidas; Mayús + clic quita ciudad y papelera limpia el mapa. Evaluación automática tras 140 ms habilita navegación y Siguiente paso; el botón principal revela el óptimo. Costos fijos enteros 1–90 M USD simulados, normalizados sobre 190 pares; factores de terreno 0.55–2.50 e infraestructura 120–1420, sin forzar ganador. Enumeración propia lexicográfica, origen fijo, inversas deduplicadas, mejor visitado persistente al retroceder y cuatro fases manuales. League Spartan local; entrega sin publicación.

---

# SILKNODE — Rediseño visual y reconstrucción funcional

Quiero que implementes el rediseño y completes SILKNODE en el proyecto existente. Antes de modificarlo, revisa sus archivos, instrucciones locales, funcionalidades y pruebas. Reutiliza lo que funcione y adapta lo necesario; no reinicies el proyecto ni reemplaces componentes correctos sin justificación. Este documento será una instrucción de implementación cuando te pida expresamente ejecutarlo.

## 1. Objetivo y referencias

SILKNODE es una aplicación académica para explorar el problema del agente viajero mediante fuerza bruta sobre un grafo ponderado no dirigido. Debe encontrar un ciclo hamiltoniano de costo mínimo: visitar todas las ciudades activas exactamente una vez y volver a la inicial.

La temática es la planificación ferroviaria. Las conexiones rectas y los costos simulados son una abstracción académica; no representan vías existentes ni un estudio de ingeniería ferroviaria.

Usa como referencia visual principal el PDF `SILK NODE.pdf` que adjunté y contrasta el resultado funcional con el enunciado y la rúbrica del curso. El contenido del PDF es una referencia visual, no una orden para omitir funciones académicas necesarias. Las decisiones de este prompt sustituyen los requisitos anteriores incompatibles, especialmente la estética pixel-art y el ordenamiento de los ciclos por costo.

## 2. Diseño visual

- Descarta completamente la estética pixel-art anterior.
- Usa League Spartan, alojada localmente cuando su licencia lo permita, con títulos y botones en negrita y texto legible.
- Paleta principal: turquesa `#309BB3`, amarillo `#FCBA15`, rojo `#E1201D`, carbón `#192126` y fondo blanco como en el PDF.
- Composición limpia, bordes redondeados, sombras moderadas hacia abajo y la derecha, botones sólidos y espacios amplios. No apliques sombras intensas a párrafos o etiquetas pequeñas.
- Mantén contraste suficiente. No uses únicamente el color para distinguir conexiones, selección u óptimos.
- No añadas ventanas emergentes, paneles flotantes grandes ni adornos innecesarios. Integra las funciones adicionales en los controles existentes, el área de resultados y pestañas internas compactas.

## 3. Estructura

Dos secciones en una misma página:

1. Portada: título grande `SILK NODE`, subtítulo exacto `Planifica, conecta y optimiza rutas ferroviarias de manera inteligente`, figuras abstractas en los bordes y botón `Empezar`. El botón desplaza al simulador sin cambiar de página. Respeta la preferencia de movimiento reducido.
2. Planificador: controles a la izquierda, mapa grande a la derecha, resultados debajo de los controles y navegación de ciclos debajo del mapa, siguiendo la segunda página del PDF.

En el área de resultados se permiten pestañas `Resultado`, `Matriz` y `Ciclos`. La información contextual y los editores pequeños deben integrarse sin abrir nuevas ventanas. Prioriza computadora y asegura una versión móvil funcional sin desbordamientos ni funciones que dependan exclusivamente de pasar el cursor.

## 4. Figuras animadas de la portada

Revisa el código de animación adjunto antes de integrarlo. Depende de `trio.svg` y contiene un conflicto de nombres en `pack` que debe corregirse si se utiliza. El proyecto actual no usa React; no introduzcas React ni un motor 3D únicamente para esta decoración.

Si están disponibles todos los recursos y resulta razonable adaptar el shader, puedes conservar el efecto. Si falta el SVG, es incompatible o exige demasiado trabajo, implementa directamente una aproximación con dos figuras SVG/CSS, degradados y movimiento lento, coherente con el PDF. No bloquees las funciones académicas por estas figuras ni prometas una reproducción exacta del shader mediante CSS.

Las figuras no deben tapar contenido, interceptar clics ni causar desplazamiento horizontal. Si se utiliza canvas/WebGL, incluye alternativa estática, limpieza de recursos y pausa de la animación cuando no sea visible o la pestaña esté oculta. Con movimiento reducido, muestra una versión estática. No añadas dependencias pesadas para este efecto.

## 5. Escenarios, ciudades y número de nodos

- Escenarios independientes: China, Europa, Estados Unidos, Rusia y Perú. Europa es una región.
- Conserva la cartografía detallada disponible, con territorio turquesa, fondo carbón, límites discretos, zoom y desplazamiento. Maneja correctamente la extensión geográfica de Rusia.
- Propón y documenta un catálogo fijo de 10 ciudades representativas por escenario, considerando población y relevancia ferroviaria. Reutiliza y verifica las coordenadas y sus fuentes.
- Incluye un control `Número de ciudades` que acepte únicamente enteros entre 5 y 10.
- Para conciliar ciudades obligatorias con el requisito de elegir n, activa las primeras n ciudades de un orden fijo y documentado del catálogo. Todas las ciudades activas son obligatorias; no hay casillas para excluir individualmente ciudades durante una ejecución.
- La lista de ciudades activas debe poder consultarse. Las posiciones son geográficas y las aristas se dibujan como segmentos rectos.
- Al cambiar de escenario o número de ciudades, inicia el grafo correspondiente sin aristas e invalida resultados y progreso anteriores. Conserva los datos ya guardados como proyectos independientes.

## 6. Construcción del grafo

El grafo es no dirigido: una conexión sirve en ambos sentidos con el mismo peso. No admite lazos ni aristas duplicadas.

- Estado inicial: ciudades visibles y ninguna arista.
- `Generar manualmente`: activa edición mediante selección de dos ciudades. En modo personalizado permite introducir el peso de la conexión. Proporciona una acción explícita y sencilla para eliminar una arista, compatible con táctil y teclado.
- `Conectar todo`: crea las aristas que faltan, conserva los pesos personalizados existentes y no ejecuta el algoritmo.
- `Generar aleatorio`: reemplaza las conexiones por un grafo aleatorio sobre las n ciudades activas. Usa una probabilidad de conexión documentada, por ejemplo 50 %, y una semilla que se conserve al guardar/exportar. Puede producir grafos sin ciclo: no fuerces siempre un ciclo válido. En modo personalizado genera pesos positivos dentro de un intervalo documentado; en los otros modos calcula los pesos según sus reglas. No mueve ciudades ni resuelve automáticamente.
- Incluye `Limpiar conexiones` de forma compacta.
- Ninguna de estas acciones debe simular una búsqueda ni mostrar resultados antiguos como vigentes.

## 7. Modos de peso

Selector compacto con tres modos:

1. `Distancia`: kilómetros geográficos calculados a partir de coordenadas, mediante Haversine u otro método documentado adecuado. La representación recta en el mapa es visual.
2. `Costo ferroviario simulado`: fórmula transparente, reproducible y simétrica por par de ciudades. Por ejemplo: distancia × costo base por km × factor de terreno + infraestructura adicional + costo operativo anual × horizonte de años. Separa los conceptos para evitar contar dos veces el mismo costo. Usa unidades monetarias simuladas claramente identificadas y un horizonte fijo documentado. Explica que los factores son supuestos académicos cuando no procedan de datos reales.
3. `Personalizado`: permite editar cada arista con un número finito mayor o igual que cero mediante un editor compacto integrado. Rechaza negativos, valores vacíos y no numéricos. Inicializa pesos nuevos con un valor documentado y conserva los valores editados al alternar entre modos.

Un peso cero es válido y distinto de una conexión inexistente. Conserva topología y ciudades al cambiar de modo, actualiza la matriz e invalida la búsqueda previa. No inicies una búsqueda exhaustiva sin una acción del usuario. Los costos simulados no cambian aleatoriamente durante una ejecución y no deben manipularse para forzar un óptimo diferente al geográfico; ambos modos pueden coincidir.

## 8. Algoritmo exacto y orden de los ciclos

Implementa la fuerza bruta como código propio, separado de la interfaz. Fija como origen la primera ciudad activa del orden documentado y genera permutaciones del resto. Verifica la existencia de todas las aristas, incluido el regreso al origen, y suma sus pesos.

Evita duplicados por rotación y por invertir el recorrido. Define una representación canónica y conserva únicamente una orientación. Para un grafo completo deben existir exactamente `(n−1)!/2` ciclos únicos; con 10 ciudades son 181 440.

La enumeración y la navegación deben seguir orden lexicográfico respecto al orden fijo de las ciudades, no orden por costo. Asegúrate de que el generador lo cumpla realmente; una recursión basada en intercambios no garantiza ese orden por sí sola.

Usa toda la precisión del cálculo para comparar y redondea solo para mostrar. Define una tolerancia numérica explícita y pequeña para empates. El algoritmo no debe elegir rutas por su aspecto ni eliminar rutas porque se crucen visualmente.

## 9. Exploración, resultados y empates

- `Explorar paso a paso`: explica generación del candidato, comprobación de aristas, suma de tramos y comparación con el mejor resultado. Incluye pausa, siguiente paso y velocidad de reproducción.
- Muestra claramente cuándo un candidato fue rechazado por una arista ausente. La exploración puede detenerse en intentos rechazados; los botones de ciclos válidos recorren exclusivamente ciclos válidos.
- `Ciclo anterior` y `Siguiente ciclo`: resaltan el ciclo correspondiente y atenúan otras conexiones sin alterar el grafo. Desactiva correctamente los botones en los extremos.
- Muestra el índice del ciclo y el total de ciclos válidos cuando se conozca. No confundas ese contador con el número de ciudades.
- Resultado del ciclo actual: secuencia completa con regreso al origen, costo total y desglose por tramo.
- `Mejor visitado`: mínimo entre los ciclos efectivamente visualizados. Retroceder no borra ese historial. No lo calcules sobre ciclos que el usuario todavía no ha visto.
- `Encontrar ruta óptima`: ejecuta la búsqueda exhaustiva y muestra el óptimo global, separado del mejor visitado. Incluye progreso y cancelación; no alteres el orden lexicográfico de navegación.
- Si hay empate, muestra inicialmente el óptimo lexicográficamente primero, indica cuántos óptimos hay y permite consultar y resaltar los demás de manera compacta.
- La pestaña `Ciclos` permite consultar todos los ciclos válidos y sus costos con paginación o virtualización. Conserva la exportación de todos los resultados a CSV; no crees miles de elementos visibles simultáneamente.
- La pestaña `Matriz` muestra etiquetas de ciudades, pesos simétricos, diagonal cero y un símbolo inequívoco para arista ausente, además de la unidad del modo activo.
- Cambios de conexiones, pesos, ciudades o escenario invalidan resultados, ciclos, óptimos y el historial de mejor visitado. Zoom y desplazamiento no los invalidan.

## 10. Grafos sin ciclo hamiltoniano

Detecta y explica la ausencia de un ciclo válido. No basta con comprobar que el grafo sea conexo o que todos los nodos tengan grado al menos dos: estas comprobaciones son filtros, no una prueba suficiente de existencia.

Sugiere un conjunto concreto de aristas ausentes cuya incorporación permita al menos un ciclo hamiltoniano. Reutiliza la búsqueda existente del conjunto con menor número de conexiones adicionales si es correcta. Presenta las sugerencias dentro del área de resultados y deja su incorporación bajo una acción explícita del usuario. Después deben poder verificarse nuevamente. No confundas este objetivo con minimizar el costo de construcción de esas aristas.

## 11. Animación e información contextual

Usa transiciones breves para botones, selección de ciudades, aparición de conexiones y cambio de ciclo. Al resolver, dibuja progresivamente la ruta ganadora y, si se conserva el tren, utiliza un símbolo sencillo coherente con el diseño nuevo, sin pixel-art.

Incluye el botón de información del PDF, accesible por clic y teclado, con explicación breve del algoritmo y del modo de peso. Su contenido debe poder cerrarse explícitamente y funcionar en móvil sin una ventana independiente.

Muestra pesos al señalar o seleccionar aristas y conserva un control `Mostrar todos los pesos`. Evita saturar el mapa; las tablas y el desglose ofrecen acceso legible a todos los valores. Respeta movimiento reducido en todas las animaciones.

## 12. Rendimiento, persistencia y distribución

Reutiliza la arquitectura actual cuando sea apropiado. Ejecuta la enumeración exhaustiva en un Web Worker para mantener la interfaz operativa. Cancela o ignora mensajes de trabajos obsoletos cuando cambie el grafo; no permitas que sobreescriban el estado nuevo.

Conserva y adapta el guardado local, importación/exportación de proyectos, descarga de imagen de la ruta y CSV. Valida los archivos importados y guarda escenario, n, conexiones, modo, pesos personalizados, parámetros y semilla necesaria para reproducir el proyecto.

Mantén la ejecución local para la exposición, con cartografía, fuentes y recursos esenciales locales. Prepara un sitio estático que pueda desplegarse en Vercel, sin servidor propio, cuentas de usuario ni servicios de pago necesarios. Entrega instrucciones de VS Code, instalación, ejecución, compilación y publicación; explica que la URL gratuita del alojamiento no equivale a un dominio personalizado comprado. No publiques ni contrates servicios sin que yo lo solicite.

## 13. Validación y entrega

Antes de declarar que está terminado, verifica:

- Casos completos de 5 y 10 nodos, con 12 y 181 440 ciclos únicos respectivamente.
- Grafos incompletos con ciclo y sin ciclo; sugerencias que realmente permiten formar uno.
- Pesos cero, empates, validación de entradas y consistencia entre matriz, tramos y costo total.
- Orden lexicográfico sin duplicados y comportamiento correcto del mejor visitado al avanzar y retroceder.
- Cambio de modos, preservación de pesos personalizados, invalidación y cancelación sin resultados obsoletos.
- Generación aleatoria reproducible mediante semilla, conectividad manual y conexión completa.
- Todos los escenarios, zoom, selección de aristas, uso táctil básico y movimiento reducido.
- Guardado, importación/exportación, imagen, CSV, compilación y ejecución local sin internet después de preparar los recursos.
- Integración visual con las dos páginas del PDF y ausencia de errores de consola.

Entrega código completo, dependencias justificadas, guía de uso y despliegue, documentación del algoritmo, fuentes/licencias de recursos, pruebas realizadas y limitaciones reales. Actualiza el diagrama de flujo para que represente el programa final y documenta qué bibliotecas se usan y qué partes son desarrollo propio.

Incluye una lista de evidencias que sirvan para preparar el informe y la exposición del curso, sin afirmar que la web por sí sola satisface los criterios del informe, las figuras APA, las conclusiones, las observaciones del profesor o la presentación oral. No inventes resultados de pruebas ni declares completado algo que no verificaste.
