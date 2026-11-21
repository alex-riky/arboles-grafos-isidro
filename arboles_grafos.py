"""
Árboles y grafos - versión de consola en Python
Matemática Discreta

1. Árbol binario de búsqueda con recorridos preorden, inorden y postorden.
2. Grafo con pesos (o ancho de banda con costo OSPF) y camino más corto con Dijkstra.

Ejecutar:  python arboles_grafos.py
"""

import math


# =========================================================
# PARTE 1: ÁRBOL BINARIO DE BÚSQUEDA
# =========================================================
class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izq = None
        self.der = None


class ArbolBinario:
    def __init__(self):
        self.raiz = None

    def insertar(self, valor):
        """Menor a la izquierda, mayor a la derecha. Devuelve False si está repetido."""
        if self.raiz is None:
            self.raiz = Nodo(valor)
            return True
        actual = self.raiz
        while True:
            if valor == actual.valor:
                return False
            if valor < actual.valor:
                if actual.izq is None:
                    actual.izq = Nodo(valor)
                    return True
                actual = actual.izq
            else:
                if actual.der is None:
                    actual.der = Nodo(valor)
                    return True
                actual = actual.der

    def preorden(self, n="inicio", r=None):
        # Raíz, izquierda, derecha
        if n == "inicio":
            n, r = self.raiz, []
        if n:
            r.append(n.valor)
            self.preorden(n.izq, r)
            self.preorden(n.der, r)
        return r

    def inorden(self, n="inicio", r=None):
        # Izquierda, raíz, derecha
        if n == "inicio":
            n, r = self.raiz, []
        if n:
            self.inorden(n.izq, r)
            r.append(n.valor)
            self.inorden(n.der, r)
        return r

    def postorden(self, n="inicio", r=None):
        # Izquierda, derecha, raíz
        if n == "inicio":
            n, r = self.raiz, []
        if n:
            self.postorden(n.izq, r)
            self.postorden(n.der, r)
            r.append(n.valor)
        return r

    def mostrar(self, n="inicio", nivel=0):
        """Dibuja el árbol acostado: la raíz a la izquierda, la derecha arriba."""
        if n == "inicio":
            n = self.raiz
            if n is None:
                print("  (árbol vacío)")
                return
        if n:
            self.mostrar(n.der, nivel + 1)
            print("      " * nivel + "-> " + fmt(n.valor))
            self.mostrar(n.izq, nivel + 1)


# =========================================================
# PARTE 2: GRAFO, OSPF Y DIJKSTRA
# =========================================================
def costo_ospf(ancho_banda, referencia=100):
    """Costo OSPF = referencia / ancho de banda (hacia abajo, mínimo 1)."""
    return max(1, math.floor(referencia / ancho_banda))


class Grafo:
    def __init__(self):
        self.aristas = {}  # (a, b) ordenado -> valor

    def agregar(self, a, b, valor):
        self.aristas[tuple(sorted((a, b)))] = valor

    def nodos(self):
        s = set()
        for a, b in self.aristas:
            s.update((a, b))
        return sorted(s)

    def adyacencia(self, ospf=False, referencia=100):
        ady = {n: [] for n in self.nodos()}
        for (a, b), valor in self.aristas.items():
            w = costo_ospf(valor, referencia) if ospf else valor
            ady[a].append((b, w))
            ady[b].append((a, w))
        return ady

    def dijkstra(self, origen, ospf=False, referencia=100):
        nodos = self.nodos()
        ady = self.adyacencia(ospf, referencia)
        dist = {n: math.inf for n in nodos}
        prev = {n: None for n in nodos}
        dist[origen] = 0
        marcados = set()
        pasos = []

        while len(marcados) < len(nodos):
            # 1. Nodo sin marcar con la menor distancia
            u = min((n for n in nodos if n not in marcados), key=lambda n: dist[n])
            if dist[u] == math.inf:
                break
            marcados.add(u)
            # 2. Mejorar las distancias de sus vecinos
            for v, w in ady[u]:
                if v not in marcados and dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    prev[v] = u
            pasos.append((u, dict(dist), dict(prev)))
        return dist, prev, pasos


def reconstruir_camino(prev, destino):
    camino = []
    n = destino
    while n is not None:
        camino.insert(0, n)
        n = prev[n]
    return camino


def imprimir_tabla(nodos, pasos, origen):
    ancho = 9
    print("Paso".ljust(7) + "Marca".ljust(7) + "".join(n.ljust(ancho) for n in nodos))
    print("Inicio".ljust(7) + "-".ljust(7) + "".join(("0" if n == origen else "inf").ljust(ancho) for n in nodos))
    ya = set()
    for i, (u, dist, prev) in enumerate(pasos, 1):
        fila = str(i).ljust(7) + u.ljust(7)
        for n in nodos:
            if n in ya:
                celda = "-"
            elif dist[n] == math.inf:
                celda = "inf"
            else:
                celda = fmt(dist[n]) + (f"({prev[n]})" if prev[n] else "")
                if n == u:
                    celda += "*"
            fila += celda.ljust(ancho)
        print(fila)
        ya.add(u)
    print("(* = nodo que se marca como definitivo en ese paso)")


# =========================================================
# UTILIDADES Y MENÚ
# =========================================================
def fmt(n):
    return str(int(n)) if float(n).is_integer() else f"{n:.2f}"


def leer_numero(texto):
    while True:
        try:
            return float(input(texto))
        except ValueError:
            print("  Escribe un número válido.")


def menu():
    arbol = ArbolBinario()
    grafo = Grafo()
    ospf = False
    referencia = 100

    while True:
        print("\n========== ÁRBOLES Y GRAFOS ==========")
        print(" 1. Insertar valores en el árbol")
        print(" 2. Ver el árbol")
        print(" 3. Recorridos (preorden, inorden, postorden)")
        print(" 4. Cargar árbol de ejemplo")
        print(" 5. Agregar conexión al grafo")
        print(" 6. Ver conexiones del grafo")
        print(f" 7. Cambiar tipo de peso (ahora: {'ancho de banda OSPF' if ospf else 'peso directo'})")
        print(" 8. Camino más corto (Dijkstra)")
        print(" 9. Cargar grafo de ejemplo")
        print(" 0. Salir")
        op = input("Opción: ").strip()

        if op == "1":
            texto = input("Valores separados por comas: ")
            for parte in texto.replace(";", ",").split(","):
                parte = parte.strip()
                if not parte:
                    continue
                try:
                    v = float(parte)
                except ValueError:
                    print(f"  '{parte}' no es un número, se omite.")
                    continue
                if not arbol.insertar(v):
                    print(f"  {fmt(v)} está repetido, no se inserta.")
            arbol.mostrar()

        elif op == "2":
            arbol.mostrar()

        elif op == "3":
            if arbol.raiz is None:
                print("  El árbol está vacío.")
                continue
            print("  Preorden :", ", ".join(fmt(v) for v in arbol.preorden()))
            print("  Inorden  :", ", ".join(fmt(v) for v in arbol.inorden()))
            print("  Postorden:", ", ".join(fmt(v) for v in arbol.postorden()))

        elif op == "4":
            arbol = ArbolBinario()
            for v in [50, 30, 70, 20, 40, 60, 80]:
                arbol.insertar(v)
            arbol.mostrar()

        elif op == "5":
            a = input("Origen: ").strip().upper()
            b = input("Destino: ").strip().upper()
            if not a or not b or a == b:
                print("  Origen y destino deben ser nodos distintos.")
                continue
            etiqueta = "Ancho de banda (Mbps): " if ospf else "Peso: "
            valor = leer_numero(etiqueta)
            if valor <= 0:
                print("  El valor debe ser mayor que 0.")
                continue
            grafo.agregar(a, b, valor)
            print(f"  Conexión {a} - {b} guardada.")

        elif op == "6":
            if not grafo.aristas:
                print("  No hay conexiones.")
            for (a, b), valor in grafo.aristas.items():
                if ospf:
                    print(f"  {a} - {b}: {fmt(valor)} Mbps -> costo {costo_ospf(valor, referencia)}")
                else:
                    print(f"  {a} - {b}: peso {fmt(valor)}")

        elif op == "7":
            ospf = not ospf
            if ospf:
                referencia = leer_numero("Ancho de banda de referencia en Mbps (normalmente 100): ") or 100
            print("  Modo:", "ancho de banda OSPF" if ospf else "peso directo")

        elif op == "8":
            nodos = grafo.nodos()
            if not nodos:
                print("  Primero agrega conexiones.")
                continue
            print("  Nodos:", ", ".join(nodos))
            o = input("Desde: ").strip().upper()
            d = input("Hasta: ").strip().upper()
            if o not in nodos or d not in nodos:
                print("  Ese nodo no existe.")
                continue
            dist, prev, pasos = grafo.dijkstra(o, ospf, referencia)
            print()
            imprimir_tabla(nodos, pasos, o)
            if dist[d] == math.inf:
                print(f"\n  No hay camino de {o} a {d}.")
            else:
                print(f"\n  Camino más corto: {' -> '.join(reconstruir_camino(prev, d))}")
                print(f"  Costo total: {fmt(dist[d])}")

        elif op == "9":
            grafo = Grafo()
            if ospf:
                datos = [("R1", "R2", 100), ("R1", "R3", 10), ("R2", "R3", 50), ("R2", "R4", 10),
                         ("R3", "R4", 100), ("R3", "R5", 20), ("R4", "R5", 100), ("R4", "R6", 25),
                         ("R5", "R6", 50)]
            else:
                datos = [("A", "B", 4), ("A", "C", 2), ("B", "C", 1), ("B", "D", 5), ("C", "D", 8),
                         ("C", "E", 10), ("D", "E", 2), ("D", "F", 6), ("E", "F", 2)]
            for a, b, v in datos:
                grafo.agregar(a, b, v)
            print("  Ejemplo cargado. Usa la opción 8 para calcular el camino.")

        elif op == "0":
            print("Hasta luego.")
            break
        else:
            print("  Opción no válida.")


if __name__ == "__main__":
    menu()
