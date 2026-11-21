# Guía del proyecto: Árboles y grafos

Lo que pidió el profe:

1. Ingresar un árbol y recorrerlo en **preorden, inorden y postorden**.
2. Dibujar un **grafo con pesos** (distancias, o costos OSPF a partir del ancho de banda).
3. Encontrar el **camino más corto con Dijkstra**.

---

## Parte A: armar el proyecto paso a paso

### Paso 1. Lo que necesitas
- Un editor de texto. Recomendado: **Visual Studio Code** (gratis).
- Un navegador (Chrome, Edge o Firefox).
- **Python 3** (solo para la versión de consola). Descárgalo de python.org y, en Windows, marca la casilla "Add Python to PATH" al instalar.

### Paso 2. Crear la carpeta y los archivos
Crea una carpeta llamada `proyecto-arboles-grafos` y adentro estos 4 archivos con estos nombres exactos:

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La estructura de la página: pestañas, botones, campos y la guía |
| `styles.css` | El diseño en modo noche: colores, letras, tamaños |
| `script.js` | La lógica: el árbol, los recorridos, el grafo y Dijkstra |
| `arboles_grafos.py` | La misma lógica en Python, con menú en consola |

Copia el contenido de cada archivo y guárdalo. Los tres archivos web deben estar en la misma carpeta, porque `index.html` los llama por su nombre.

### Paso 3. Abrir la página
Haz doble clic en `index.html`. Se abre en el navegador; no necesita internet (solo las letras se ven más bonitas con internet).

### Paso 4. Ejecutar la versión de Python
Abre una terminal en la carpeta y escribe:

```
python arboles_grafos.py
```

En Mac o Linux puede ser `python3 arboles_grafos.py`. Aparece un menú con números.

### Paso 5. Probar que todo funciona
- **Árboles:** pulsa "Cargar ejemplo" y luego "Inorden". Los números deben salir ordenados de menor a mayor.
- **Grafos:** con "Distancia o peso directo", pulsa "Cargar ejemplo" y calcula de A a F. Debe salir **A → C → B → D → E → F con costo 12**, igual que en la tabla de la Parte B.
- **OSPF:** cambia a "Ancho de banda (costo OSPF)", carga el ejemplo y calcula de R1 a R6. Debe salir **R1 → R2 → R3 → R4 → R5 → R6 con costo 7**.

### Paso 6. Cómo explicar el código al profe
- **Árbol (`insertar`)**: el primer valor es la raíz; los menores van a la izquierda y los mayores a la derecha.
- **Recorridos (`preorden`, `inorden`, `postorden`)**: son funciones recursivas; solo cambia en qué momento se anota la raíz (antes, en medio o después de los hijos).
- **OSPF (`costoOSPF`)**: `costo = referencia / ancho de banda`, redondeado hacia abajo y mínimo 1.
- **Dijkstra (`dijkstra`)**: escoge el nodo sin marcar con menor distancia, lo marca, y mejora las distancias de sus vecinos. Guarda cada paso para mostrar la tabla.
- **Dibujo**: se hace con SVG. En el árbol, la posición horizontal sale del orden inorden y la vertical de la profundidad. En el grafo, los nodos se acomodan en círculo.

---

## Parte B: resolver los problemas a mano

### B1. Construir el árbol
1. El primer valor es la raíz.
2. Cada valor nuevo baja desde la raíz: si es menor, a la izquierda; si es mayor, a la derecha.
3. Se coloca en el primer lugar vacío.

Ejemplo con 50, 30, 70, 20, 40, 60, 80:

```
            50
          /    \
        30      70
       /  \    /  \
     20   40  60   80
```

### B2. Recorridos

| Recorrido | Regla | Resultado |
|---|---|---|
| Preorden | Raíz, izquierda, derecha | 50, 30, 20, 40, 70, 60, 80 |
| Inorden | Izquierda, raíz, derecha | 20, 30, 40, 50, 60, 70, 80 |
| Postorden | Izquierda, derecha, raíz | 20, 40, 30, 60, 80, 70, 50 |

**Truco del contorno:** traza una línea alrededor del árbol por fuera, empezando por la izquierda de la raíz. Anota cada nodo cuando la línea pase:
- por su **izquierda** → preorden
- por **debajo** → inorden
- por su **derecha** → postorden

**Comprobación rápida:** el inorden sale ordenado; la raíz va primero en preorden y al final en postorden.

### B3. Costo OSPF

```
costo = ancho de banda de referencia / ancho de banda del enlace
```

Con referencia de 100 Mbps:

| Enlace | Cálculo | Costo |
|---|---|---|
| 10 Mbps | 100 / 10 | 10 |
| 20 Mbps | 100 / 20 | 5 |
| 25 Mbps | 100 / 25 | 4 |
| 50 Mbps | 100 / 50 | 2 |
| 100 Mbps | 100 / 100 | 1 |
| 1000 Mbps | 100 / 1000 = 0.1 | 1 (mínimo) |

Más ancho de banda = menor costo = camino preferido.

### B4. Dijkstra paso a paso
1. Haz una tabla con una columna por nodo. En la fila de inicio: 0 en el origen, ∞ en los demás.
2. Escoge el nodo **sin marcar** con la distancia **más pequeña** y márcalo.
3. Para cada vecino sin marcar: `distancia del marcado + peso de la arista`. Si es **menor** que lo que tenía, escríbelo junto con el nodo de donde vienes, entre paréntesis.
4. Repite 2 y 3 hasta marcar todos los nodos.
5. Para el camino, empieza en el destino y sigue los paréntesis hacia atrás.

**Ejemplo** (aristas: A–B 4, A–C 2, B–C 1, B–D 5, C–D 8, C–E 10, D–E 2, D–F 6, E–F 2), de A a F:

| Paso | Se marca | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| Inicio | – | 0 | ∞ | ∞ | ∞ | ∞ | ∞ |
| 1 | A | **0** | 4 (A) | 2 (A) | ∞ | ∞ | ∞ |
| 2 | C | – | 3 (C) | **2 (A)** | 10 (C) | 12 (C) | ∞ |
| 3 | B | – | **3 (C)** | – | 8 (B) | 12 (C) | ∞ |
| 4 | D | – | – | – | **8 (B)** | 10 (D) | 14 (D) |
| 5 | E | – | – | – | – | **10 (D)** | 12 (E) |
| 6 | F | – | – | – | – | – | **12 (E)** |

Hacia atrás: F ← E ← D ← B ← C ← A.
**Camino más corto: A → C → B → D → E → F, costo 12.**

Fíjate en el paso 2: B tenía 4 (directo desde A), pero pasando por C cuesta 2 + 1 = 3, que es menor, así que se reemplaza. Eso es lo que hace Dijkstra.

### B5. Errores comunes
- Marcar un nodo que no es el de menor distancia.
- Olvidar que en un grafo no dirigido A–B también sirve de B a A.
- Reemplazar una distancia por una más grande (solo se cambia si la nueva es menor).
- En OSPF, usar el ancho de banda como peso sin convertirlo a costo.
