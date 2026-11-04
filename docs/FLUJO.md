# Flujo actual: operaciones dentro del grafo

Empezar → elegir escenario y modo → construir la red → evaluación automática al alcanzar 5–10 ciudades. En Manual cada pareja de clics crea una arista inmediatamente, incluso con solo dos ciudades. Pulsar cualquier parte de una arista abre su editor.

- Sin ciclos: botón visible, atenuado y deshabilitado; sugerencias mínimas de reparación, con desempate por menor costo total del circuito.
- Con ciclos: botón verde habilitado; lista paginada de todos los ciclos; búsqueda del mínimo con pesos vigentes.
- Mejora: solo después de buscar el óptimo, comparar con el grafo completo de las mismas ciudades y pesos vigentes. Si existe una ruta estrictamente mejor, ofrecer sus enlaces faltantes. Al aceptar, añadirlos y mostrar automáticamente el nuevo óptimo. Entre mínimos empatados se prefieren menos enlaces nuevos.
- Matriz: botón Ver matriz; consulta sin edición. Edición de pesos y eliminación de conexiones solo en el mapa.
- Cada modificación invalida resultados y vuelve a evaluar; nunca se añaden sugerencias sin pulsar su botón.
