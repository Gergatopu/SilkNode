# Flujo de SILKNODE en PC

```mermaid
flowchart TD
 A[Empezar o rueda fuera del mapa] --> B[Elegir escenario]
 B --> C[Elegir Manual, Conectar todo o Aleatorio]
 C --> D[Seleccionar 5–10 de las 20 ciudades en el mapa]
 D --> E[Construir enlaces según el modo]
 E --> F[Desde 5 ciudades: mostrar matriz y costos]
 F --> R[Manual: activar casilla y editar costo 1–99]
 R --> F
 F --> G[Tras 140 ms: evaluar en Worker]
 G --> H[Origen fijo y permutaciones lexicográficas]
 H --> I[Deduplicar inversas y comprobar enlaces incluido regreso]
 I --> J{Hay ciclos válidos?}
 J -- No --> K[Sugerir mínimo número de enlaces nuevos]
 K --> L[Añadir sugerencias]
 L --> F
 J -- Sí --> M[Habilitar ciclos, Todos y Siguiente paso]
 M --> N[Navegar en orden lexicográfico]
 M --> O[Generar → Comprobar → Sumar → Comparar]
 M --> P[Encontrar ruta óptima revela mínimo global]
 N --> Q[Actualizar mejor visitado sin borrarlo al retroceder]
 O --> Q
 P --> Q
 E -. Cambiar red cancela cálculo y resultados .-> F
```

En Manual, tras seleccionar al menos cinco ciudades, pulsar una casilla fuera de la diagonal activa su enlace con el costo por defecto. Se puede escribir un entero de 1 a 99; ambas casillas simétricas, el mapa y el cálculo se actualizan. Dos clics en ciudades elegidas también alternan un enlace. Mayús + clic elimina una ciudad; la papelera limpia el mapa y los costos personalizados. Conectar todo y Aleatorio generan enlaces al seleccionar ciudades; pulsar Aleatorio de nuevo regenera solo enlaces. No se garantiza un ciclo.

Los costos por defecto se normalizan contra los 190 pares del escenario completo y permanecen fijos entre 1 y 90. Fuera de Manual se usan esos valores; al volver a Manual se recuperan las ediciones de la sesión. La matriz y el recorrido se mantienen a la izquierda; la matriz se oculta con menos de cinco ciudades. La navegación por pasos es manual y utiliza la traza completa, independiente de la búsqueda. La rueda dentro del mapa hace zoom; fuera alterna portada y planificador. La sesión no se guarda ni exporta.
