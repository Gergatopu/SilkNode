# Fuentes geográficas de SILKNODE

Los archivos locales permiten visualizar los mapas sin solicitar teselas ni servicios de pago.

## Límites y costas

`public/data/world.geojson`: Natural Earth, **Admin 0 – Countries, escala 1:50 millones**. Conserva la geometría original y reduce los atributos a identificadores y nombres.

- Página oficial: https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/
- Archivo original: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson

## Ciudades

`public/data/cities.json`: 20 ciudades por escenario (China, Europa, Estados Unidos, Rusia y Perú), seleccionadas entre ciudades principales para diversidad geográfica y demostración del problema. No representa un ranking ferroviario ni afirma que exista un enlace ferroviario real entre ellas.

Las coordenadas se extrajeron directamente de **Natural Earth, Populated Places, escala 1:10 millones**; no se estimaron a mano. Nombres en español procedentes del atributo `NAME_ES`; se conserva `sourceName` para trazabilidad. Son puntos representativos de ciudades, no estaciones ferroviarias.

- Página oficial: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/
- Archivo original: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson

Descarga y comprobación: 29 de octubre de 2026. Se comprobaron país, nombre y coordenadas de cada ciudad contra el conjunto original. En ciudades homónimas dentro del mismo país se escogió el registro con mayor `POP_MAX` (Portland, Oregón).

## Licencia

Los datos de Natural Earth son de **dominio público** y permiten modificación y redistribución sin pago. https://www.naturalearthdata.com/about/terms-of-use/

Crédito sugerido: «Cartografía y coordenadas: Natural Earth».

## Alcance

Los límites representan la cartografía de Natural Earth, que emplea límites de facto y contiene territorios disputados. Las líneas de SILKNODE son conexiones hipotéticas y no trazados ferroviarios. Los pesos monetarios simulados se derivan de distancias escaladas y factores deterministas ilustrativos; no son presupuestos ni datos económicos ferroviarios. No consideran topografía, infraestructura, fronteras ni permisos. La escala 1:50 millones da detalle de costas para vista regional; no es cartografía catastral ni callejera.

## Divisiones internas

`public/data/subdivisions.geojson`: Natural Earth **Admin 1 – States, Provinces, Boundary Lines, escala 1:10 millones**, filtrado a China, Estados Unidos, Rusia, Perú y los países clasificados como Europa en Admin 0. Se utiliza 1:10m porque el archivo 1:50m no incluye Perú ni los países europeos necesarios.

- Página oficial: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
- Original: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces_lines.geojson

Se simplificaron las líneas mediante Douglas–Peucker con tolerancia de 0,012 grados y se agruparon por país en geometrías MultiLineString para reducir el peso. Se conservan los extremos de cada segmento. No contiene calles ni ferrocarriles existentes. Puede haber pequeños desajustes entre líneas administrativas 1:10m y costas 1:50m. Misma licencia de dominio público de Natural Earth.

## Tipografía y herramientas

- **League Spartan**: fuente usada por la interfaz y empaquetada localmente mediante `@fontsource/league-spartan`. Licencia SIL Open Font License en `LICENSE/League-Spartan-OFL.txt`. Sustituye las fuentes de la interfaz anterior; sus avisos históricos Silkscreen e IBM Plex Mono se conservan en esta carpeta.
- **D3**: proyecciones y navegación del mapa. Avisos en `LICENSE/D3.txt` y `LICENSE/D3-DEPENDENCIES.txt`.
- **Vite**: herramienta de desarrollo y compilación; su licencia acompaña el paquete instalado.
- **Código propio**: enumeración exhaustiva, deduplicación de ciclos inversos, costos simulados, sugerencias mínimas, estado de sesión y presentación. D3 y Vite no resuelven el problema del agente viajero.

Los recursos geográficos permanecen locales y no requieren un servicio de mapas externo. Esta entrega no publica el proyecto ni modifica las licencias de las fuentes de terceros.
