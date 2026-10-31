---
name: SILK NODE
description: Simulador académico ferroviario basado en la referencia visual aprobada.
colors:
  ink: "#192126"
  teal: "#309bb3"
  yellow: "#fcba15"
  red: "#e1201d"
  background: "#ffffff"
  line: "#d9e1e3"
  muted: "#526268"
typography:
  display:
    fontFamily: "League Spartan, sans-serif"
    fontSize: "clamp(70px,14.5vw,220px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-.035em"
  body:
    fontFamily: "League Spartan, sans-serif"
  label:
    fontFamily: "League Spartan, sans-serif"
    fontWeight: 600
rounded:
  input: "8px"
  button: "10px"
  action: "18px"
  start: "24px"
  map: "25px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "11px 8px"
  button-start:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.yellow}"
    rounded: "{rounded.start}"
    padding: "19px 48px"
---

# Design System: SILK NODE

## Overview

Dirección visual aprobada en el PDF SILK NODE: una interfaz académica clara, con mapa protagonista, tipografía geométrica y acciones reconocibles. La implementación se realiza directamente en código. Dos figuras orgánicas CSS acompañan la portada; son una aproximación decorativa, no una reproducción del shader de referencia.

## Colors

Turquesa para identidad y territorio; amarillo para selección y acciones; rojo para el recorrido. Carbón sostiene texto y fondo del mapa, con superficies blancas y separadores discretos. Los estados también se explican mediante texto, trazos y controles.

## Typography

League Spartan se incluye localmente en pesos 400, 600, 700 y 800. El título de portada usa el rol display; los controles usan pesos medios y los resultados una cifra destacada. Matrices y costos emplean cifras tabulares. Los nombres extensos se ajustan o se abrevian dentro de su espacio.

## Layout

Interfaz destinada a PC. Portada y planificador ocupan cada uno `100dvh`, sin scroll de página ni paneles. La transición desplaza las pantallas verticalmente; la rueda fuera del mapa permite alternarlas y dentro controla el zoom.

Controles, matriz cuadrada y recorrido permanecen en la izquierda; mapa dominante y navegación de ciclos, en la derecha. La columna izquierda usa `clamp(300px,28vw,400px)`, con separación de 28 px. Hasta 750 px de alto se reduce el espaciado manteniendo la composición. No hay vistas móviles ni listas para elegir ciudades: toda selección ocurre en el mapa. Ciclos, sugerencias y ayuda se paginan.

## Elevation & Depth

Sombras suaves hacia abajo y derecha separan el mapa, el botón de entrada y la ayuda contextual. Los párrafos y etiquetas no reciben sombras decorativas. El mapa conserva un borde oscuro y recorta su contenido dentro de la superficie.

## Shapes

Botones y campos redondeados, mapa con esquinas amplias y controles de información circulares. Las dos figuras de portada usan radios orgánicos y degradados de la paleta. Evitar pixel-art y decoración que compita con el grafo.

## Components

Las acciones principales son amarillas; los tres modos de red, carbón, con selección turquesa. Foco visible turquesa, estados deshabilitados atenuados y pulsación con desplazamiento mínimo. El selector de mapa es el único campo de selección del panel.

La matriz cuadrada usa cifras tabulares en negrita. Diagonal y enlaces ausentes se dibujan como casillas oscuras vacías, sin cero, guion ni editor; conservan etiquetas accesibles. El recorrido muestra ciudades, suma, mejor visitado y avance manual por pasos. El mapa conserva pesos visibles y enfatiza el ciclo activo en rojo. La papelera limpia selección y enlaces.

La ayuda se integra en el mapa. La transición de entrada dura 0,7 s y las figuras tienen movimiento lento; movimiento reducido elimina transición y animación decorativa. Las figuras se pausan dentro del planificador.

## Do's and Don'ts

- Mantener la referencia visual aprobada, League Spartan local y foco visible.
- Mantener matriz y recorrido simultáneos a la izquierda en PC.
- Conservar el mapa como único lugar para seleccionar ciudades.
- No reintroducir controles retirados: archivos, listas de ciudades, edición de costos, modos de costo, reproducción, velocidad ni vistas móviles.
- No introducir scroll, pixel-art, fuentes remotas ni ventanas grandes que oculten el trabajo.
- No presentar costos simulados como inversión ferroviaria real.
