'use strict';

/* =========================================================
   UTILIDADES
   ========================================================= */
const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Crea un elemento SVG con sus atributos
function svgEl(etiqueta, atributos = {}, texto) {
  const e = document.createElementNS(SVGNS, etiqueta);
  for (const k in atributos) e.setAttribute(k, atributos[k]);
  if (texto !== undefined) e.textContent = texto;
  return e;
}

// Evita que el texto del usuario se interprete como HTML
function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Muestra números sin decimales innecesarios
function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function mensaje(id, texto, tipo = 'info') {
  const m = $(id);
  m.textContent = texto;
  m.dataset.tipo = tipo;
}

/* =========================================================
   PESTAÑAS
   ========================================================= */
const pestanas = document.querySelectorAll('[role="tab"]');
pestanas.forEach((tab) => {
  tab.addEventListener('click', () => {
    pestanas.forEach((otra) => {
      const activa = otra === tab;
      otra.setAttribute('aria-selected', activa);
      $(otra.getAttribute('aria-controls')).hidden = !activa;
    });
  });
});

/* =========================================================
   PARTE 1: ÁRBOL BINARIO DE BÚSQUEDA
   ========================================================= */
class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.izq = null;
    this.der = null;
  }
}

let raiz = null;
const dibujoDeNodo = new Map(); // nodo -> elemento <g> del SVG
let temporizador = null;

// Inserta un valor: menor a la izquierda, mayor a la derecha
function insertar(valor) {
  if (raiz === null) { raiz = new Nodo(valor); return true; }
  let actual = raiz;
  while (true) {
    if (valor === actual.valor) return false; // repetido
    if (valor < actual.valor) {
      if (actual.izq === null) { actual.izq = new Nodo(valor); return true; }
      actual = actual.izq;
    } else {
      if (actual.der === null) { actual.der = new Nodo(valor); return true; }
      actual = actual.der;
    }
  }
}

// Los tres recorridos (recursivos)
function preorden(n, r = []) { if (n) { r.push(n); preorden(n.izq, r); preorden(n.der, r); } return r; }
function inorden(n, r = []) { if (n) { inorden(n.izq, r); r.push(n); inorden(n.der, r); } return r; }
function postorden(n, r = []) { if (n) { postorden(n.izq, r); postorden(n.der, r); r.push(n); } return r; }

// Dibuja el árbol: x = posición en inorden, y = profundidad
function dibujarArbol() {
  const svg = $('lienzoArbol');
  svg.innerHTML = '';
  dibujoDeNodo.clear();
  $('arbolVacio').hidden = raiz !== null;
  svg.style.display = raiz ? 'block' : 'none';
  if (!raiz) return;

  const nodos = inorden(raiz);
  const info = new Map();
  let profMax = 0;
  (function medir(n, d) {
    if (!n) return;
    profMax = Math.max(profMax, d);
    info.set(n, { d });
    medir(n.izq, d + 1);
    medir(n.der, d + 1);
  })(raiz, 0);
  nodos.forEach((n, i) => { info.get(n).i = i; });

  const sepX = 56, sepY = 80, margen = 36;
  const ancho = Math.max(nodos.length - 1, 0) * sepX + margen * 2;
  const alto = profMax * sepY + margen * 2;
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.style.maxWidth = ancho * 1.3 + 'px';

  const xy = (n) => ({ x: margen + info.get(n).i * sepX, y: margen + info.get(n).d * sepY });
  const capaLineas = svgEl('g');
  const capaNodos = svgEl('g');
  svg.append(capaLineas, capaNodos);

  nodos.forEach((n) => {
    const p = xy(n);
    [n.izq, n.der].forEach((hijo) => {
      if (hijo) {
        const q = xy(hijo);
        capaLineas.append(svgEl('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: 'arista' }));
      }
    });
    const g = svgEl('g', { class: 'nodo' });
    g.append(
      svgEl('circle', { cx: p.x, cy: p.y, r: 20 }),
      svgEl('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, fmt(n.valor))
    );
    capaNodos.append(g);
    dibujoDeNodo.set(n, g);
  });
}

function reiniciarRecorrido() {
  clearTimeout(temporizador);
  $('recorridoTitulo').textContent = 'Elige un recorrido';
  $('recorridoRegla').textContent = 'Cada recorrido visita los mismos nodos, pero en distinto orden.';
  $('recorridoSalida').innerHTML = '';
  document.querySelectorAll('.recorrido').forEach((b) => b.setAttribute('aria-pressed', 'false'));
}

$('formArbol').addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = $('valores').value.trim();
  if (!texto) { mensaje('msgArbol', 'Escribe al menos un número, por ejemplo: 50, 30, 70.', 'error'); return; }
  const partes = texto.split(/[,;\s]+/).filter(Boolean);
  const invalidos = partes.filter((p) => !isFinite(Number(p)));
  if (invalidos.length) { mensaje('msgArbol', `Esto no es un número: ${invalidos.join(', ')}. Usa solo números.`, 'error'); return; }

  let nuevos = 0; const repetidos = [];
  partes.map(Number).forEach((v) => (insertar(v) ? nuevos++ : repetidos.push(v)));
  const extra = repetidos.length ? ` Repetidos (no se insertan): ${repetidos.join(', ')}.` : '';
  mensaje('msgArbol', `Se insertaron ${nuevos} valor(es).${extra}`, repetidos.length ? 'info' : 'ok');
  $('valores').value = '';
  reiniciarRecorrido();
  dibujarArbol();
});

$('btnEjemploArbol').addEventListener('click', () => {
  raiz = null;
  [50, 30, 70, 20, 40, 60, 80, 35, 65].forEach(insertar);
  mensaje('msgArbol', 'Ejemplo cargado: 50, 30, 70, 20, 40, 60, 80, 35, 65.', 'ok');
  reiniciarRecorrido();
  dibujarArbol();
});

$('btnVaciarArbol').addEventListener('click', () => {
  raiz = null;
  mensaje('msgArbol', 'Árbol vacío.');
  reiniciarRecorrido();
  dibujarArbol();
});

const RECORRIDOS = {
  pre:  { nombre: 'Preorden',  regla: 'Raíz, después subárbol izquierdo, después subárbol derecho.', fn: preorden },
  in:   { nombre: 'Inorden',   regla: 'Subárbol izquierdo, después raíz, después subárbol derecho. En un árbol de búsqueda sale ordenado.', fn: inorden },
  post: { nombre: 'Postorden', regla: 'Subárbol izquierdo, después subárbol derecho, y la raíz al final.', fn: postorden },
};

document.querySelectorAll('.recorrido').forEach((boton) => {
  boton.addEventListener('click', () => {
    if (!raiz) { mensaje('msgArbol', 'Primero inserta valores o carga el ejemplo.', 'error'); return; }
    reiniciarRecorrido();
    boton.setAttribute('aria-pressed', 'true');
    const r = RECORRIDOS[boton.dataset.tipo];
    const orden = r.fn(raiz);
    $('recorridoTitulo').textContent = r.nombre;
    $('recorridoRegla').textContent = r.regla;
    dibujoDeNodo.forEach((g) => g.classList.remove('visitado', 'actual'));

    const salida = $('recorridoSalida');
    let i = 0;
    const paso = () => {
      if (i > 0) dibujoDeNodo.get(orden[i - 1]).classList.replace('actual', 'visitado');
      if (i >= orden.length) return;
      dibujoDeNodo.get(orden[i]).classList.add('actual');
      const li = document.createElement('li');
      li.textContent = fmt(orden[i].valor);
      salida.append(li);
      i++;
      temporizador = setTimeout(paso, sinMovimiento ? 0 : 650);
    };
    paso();
  });
});

/* =========================================================
   PARTE 2: GRAFO CON PESOS, OSPF Y DIJKSTRA
   ========================================================= */
let aristas = []; // { a, b, valor }  (grafo no dirigido)

const esOSPF = () => $('modoPeso').value === 'ospf';
const referencia = () => { const r = parseFloat($('refBw').value); return r > 0 ? r : 100; };

// Costo OSPF = referencia / ancho de banda, redondeado hacia abajo, mínimo 1
const costoOSPF = (anchoBanda) => Math.max(1, Math.floor(referencia() / anchoBanda));
const pesoDe = (arista) => (esOSPF() ? costoOSPF(arista.valor) : arista.valor);
const clave = (a, b) => [a, b].sort().join('|');

function listaNodos() {
  const s = new Set();
  aristas.forEach((x) => { s.add(x.a); s.add(x.b); });
  return [...s].sort((x, y) => x.localeCompare(y, 'es', { numeric: true }));
}

function adyacencia() {
  const ady = {};
  listaNodos().forEach((n) => { ady[n] = []; });
  aristas.forEach((x) => {
    const w = pesoDe(x);
    ady[x.a].push({ v: x.b, w });
    ady[x.b].push({ v: x.a, w });
  });
  return ady;
}

// Algoritmo de Dijkstra: guarda cada paso para mostrar la tabla
function dijkstra(origen) {
  const nodos = listaNodos();
  const ady = adyacencia();
  const dist = {}, prev = {}, marcados = new Set(), pasos = [];
  nodos.forEach((n) => { dist[n] = Infinity; prev[n] = null; });
  dist[origen] = 0;

  while (marcados.size < nodos.length) {
    // 1. Nodo sin marcar con la menor distancia
    let u = null;
    for (const n of nodos) {
      if (!marcados.has(n) && (u === null || dist[n] < dist[u])) u = n;
    }
    if (dist[u] === Infinity) break; // los que quedan no se pueden alcanzar
    marcados.add(u);

    // 2. Revisar vecinos y mejorar distancias
    const cambios = [];
    for (const { v, w } of ady[u]) {
      if (!marcados.has(v) && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
        cambios.push(v);
      }
    }
    pasos.push({ u, dist: { ...dist }, prev: { ...prev }, cambios });
  }
  return { dist, prev, pasos, nodos };
}

function dibujarGrafo(camino = []) {
  const svg = $('lienzoGrafo');
  svg.innerHTML = '';
  const nodos = listaNodos();
  $('grafoVacio').hidden = nodos.length > 0;
  svg.style.display = nodos.length ? 'block' : 'none';
  if (!nodos.length) return;

  // Nodos acomodados en círculo
  const W = 560, H = 440, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 50;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const pos = {};
  nodos.forEach((n, i) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / nodos.length;
    pos[n] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });

  const enCamino = new Set();
  for (let i = 0; i < camino.length - 1; i++) enCamino.add(clave(camino[i], camino[i + 1]));

  const capaAristas = svgEl('g'), capaEtiquetas = svgEl('g'), capaNodos = svgEl('g');
  svg.append(capaAristas, capaEtiquetas, capaNodos);

  aristas.forEach((x) => {
    const p = pos[x.a], q = pos[x.b];
    const marcada = enCamino.has(clave(x.a, x.b));
    capaAristas.append(svgEl('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: 'arista' + (marcada ? ' en-camino' : '') }));

    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const texto = esOSPF() ? `${fmt(pesoDe(x))} (${fmt(x.valor)}M)` : fmt(x.valor);
    const ancho = texto.length * 7.5 + 14;
    const g = svgEl('g', { class: 'etiqueta' + (marcada ? ' en-camino' : '') });
    g.append(
      svgEl('rect', { x: mx - ancho / 2, y: my - 11, width: ancho, height: 22, rx: 6 }),
      svgEl('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, texto)
    );
    capaEtiquetas.append(g);
  });

  nodos.forEach((n) => {
    const g = svgEl('g', { class: 'nodo' + (camino.includes(n) ? ' en-camino' : '') });
    g.append(
      svgEl('circle', { cx: pos[n].x, cy: pos[n].y, r: 22 }),
      svgEl('text', { x: pos[n].x, y: pos[n].y, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, n.slice(0, 4))
    );
    capaNodos.append(g);
  });
}

function dibujarLista() {
  $('thValor').textContent = esOSPF() ? 'Ancho de banda' : 'Peso';
  const tb = $('listaAristas');
  if (!aristas.length) {
    tb.innerHTML = '<tr><td colspan="4" class="vacio">Todavía no hay conexiones.</td></tr>';
    return;
  }
  tb.innerHTML = aristas.map((x, i) => `
    <tr>
      <td>${esc(x.a)} – ${esc(x.b)}</td>
      <td class="num">${fmt(x.valor)}${esOSPF() ? ' Mbps' : ''}</td>
      <td class="num">${fmt(pesoDe(x))}</td>
      <td><button class="quitar" data-i="${i}" aria-label="Quitar ${esc(x.a)} – ${esc(x.b)}">Quitar</button></td>
    </tr>`).join('');
}

function llenarSelects() {
  const nodos = listaNodos();
  ['dOrigen', 'dDestino'].forEach((id, k) => {
    const sel = $(id);
    const anterior = sel.value;
    sel.innerHTML = nodos.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (nodos.includes(anterior)) sel.value = anterior;
    else if (nodos.length) sel.value = k === 0 ? nodos[0] : nodos[nodos.length - 1];
  });
}

function ocultarResultado() {
  $('resultadoCamino').hidden = true;
  $('bloqueTabla').hidden = true;
}

function actualizarGrafo() {
  dibujarLista();
  llenarSelects();
  dibujarGrafo();
  ocultarResultado();
}

function aplicarModo() {
  const ospf = esOSPF();
  $('campoRef').hidden = !ospf;
  $('notaOspf').hidden = !ospf;
  $('etiquetaValor').textContent = ospf ? 'Ancho de banda (Mbps)' : 'Peso';
  $('aValor').placeholder = ospf ? '100' : '4';
}

$('modoPeso').addEventListener('change', () => { aplicarModo(); actualizarGrafo(); });
$('refBw').addEventListener('input', actualizarGrafo);

$('formArista').addEventListener('submit', (e) => {
  e.preventDefault();
  const a = $('aOrigen').value.trim().toUpperCase();
  const b = $('aDestino').value.trim().toUpperCase();
  const valor = parseFloat($('aValor').value);
  if (!a || !b) { mensaje('msgGrafo', 'Escribe el nombre del nodo de origen y de destino.', 'error'); return; }
  if (a === b) { mensaje('msgGrafo', 'El origen y el destino deben ser nodos distintos.', 'error'); return; }
  if (!(valor > 0)) { mensaje('msgGrafo', 'El valor debe ser un número mayor que 0.', 'error'); return; }

  const existente = aristas.find((x) => clave(x.a, x.b) === clave(a, b));
  if (existente) {
    existente.valor = valor;
    mensaje('msgGrafo', `Conexión ${a} – ${b} actualizada.`, 'ok');
  } else {
    aristas.push({ a, b, valor });
    mensaje('msgGrafo', `Conexión ${a} – ${b} agregada.`, 'ok');
  }
  $('aOrigen').value = b; // facilita encadenar conexiones
  $('aDestino').value = '';
  $('aValor').value = '';
  $('aDestino').focus();
  actualizarGrafo();
});

$('listaAristas').addEventListener('click', (e) => {
  const boton = e.target.closest('.quitar');
  if (!boton) return;
  const x = aristas.splice(Number(boton.dataset.i), 1)[0];
  mensaje('msgGrafo', `Conexión ${x.a} – ${x.b} quitada.`);
  actualizarGrafo();
});

$('btnEjemploGrafo').addEventListener('click', () => {
  if (esOSPF()) {
    $('refBw').value = 100;
    aristas = [
      { a: 'R1', b: 'R2', valor: 100 }, { a: 'R1', b: 'R3', valor: 10 },
      { a: 'R2', b: 'R3', valor: 50 },  { a: 'R2', b: 'R4', valor: 10 },
      { a: 'R3', b: 'R4', valor: 100 }, { a: 'R3', b: 'R5', valor: 20 },
      { a: 'R4', b: 'R5', valor: 100 }, { a: 'R4', b: 'R6', valor: 25 },
      { a: 'R5', b: 'R6', valor: 50 },
    ];
    mensaje('msgGrafo', 'Ejemplo de red con routers cargado. Los valores son anchos de banda en Mbps.', 'ok');
  } else {
    aristas = [
      { a: 'A', b: 'B', valor: 4 }, { a: 'A', b: 'C', valor: 2 }, { a: 'B', b: 'C', valor: 1 },
      { a: 'B', b: 'D', valor: 5 }, { a: 'C', b: 'D', valor: 8 }, { a: 'C', b: 'E', valor: 10 },
      { a: 'D', b: 'E', valor: 2 }, { a: 'D', b: 'F', valor: 6 }, { a: 'E', b: 'F', valor: 2 },
    ];
    mensaje('msgGrafo', 'Ejemplo cargado. Es el mismo que se resuelve a mano en la guía.', 'ok');
  }
  $('dOrigen').value = ''; $('dDestino').value = '';
  actualizarGrafo();
});

$('btnVaciarGrafo').addEventListener('click', () => {
  aristas = [];
  mensaje('msgGrafo', 'Grafo vacío.');
  actualizarGrafo();
});

$('btnDijkstra').addEventListener('click', () => {
  const origen = $('dOrigen').value, destino = $('dDestino').value;
  if (!origen || !destino) { mensaje('msgGrafo', 'Agrega al menos una conexión para calcular un camino.', 'error'); return; }

  const r = dijkstra(origen);
  const res = $('resultadoCamino');
  res.hidden = false;

  if (r.dist[destino] === Infinity) {
    dibujarGrafo();
    res.innerHTML = `<p>No hay ningún camino de <strong>${esc(origen)}</strong> a <strong>${esc(destino)}</strong>. Revisa que estén conectados.</p>`;
  } else {
    const camino = [];
    for (let n = destino; n !== null; n = r.prev[n]) camino.unshift(n);
    dibujarGrafo(camino);
    res.innerHTML = `
      <p>Camino más corto de <strong>${esc(origen)}</strong> a <strong>${esc(destino)}</strong>:</p>
      <p class="camino-texto">${camino.map(esc).join(' → ')}</p>
      <p>Costo total: <strong>${fmt(r.dist[destino])}</strong></p>`;
  }
  dibujarTabla(r, origen);
});

function dibujarTabla(r, origen) {
  const nodos = r.nodos;
  let html = '<thead><tr><th>Paso</th><th>Se marca</th>' + nodos.map((n) => `<th>${esc(n)}</th>`).join('') + '</tr></thead><tbody>';
  html += '<tr><td>Inicio</td><td>—</td>' + nodos.map((n) => `<td>${n === origen ? '0' : '∞'}</td>`).join('') + '</tr>';

  const yaMarcados = new Set();
  r.pasos.forEach((p, i) => {
    html += `<tr><td>${i + 1}</td><td><strong>${esc(p.u)}</strong></td>`;
    nodos.forEach((n) => {
      if (yaMarcados.has(n)) { html += '<td class="hecho">—</td>'; return; }
      const d = p.dist[n];
      const valor = d === Infinity ? '∞' : fmt(d) + (p.prev[n] ? ` <small>(${esc(p.prev[n])})</small>` : '');
      const clase = n === p.u ? 'elegido' : (p.cambios.includes(n) ? 'cambio' : '');
      html += `<td class="${clase}">${valor}</td>`;
    });
    html += '</tr>';
    yaMarcados.add(p.u);
  });
  $('tablaDijkstra').innerHTML = html + '</tbody>';
  $('bloqueTabla').hidden = false;
}

/* ===== Estado inicial ===== */
aplicarModo();
dibujarArbol();
actualizarGrafo();
