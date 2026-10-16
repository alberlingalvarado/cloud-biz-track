// @ts-nocheck
/* Lógica original de "Gestión diaria" (sin cambios en reglas de negocio). */
import * as XLSX from "xlsx";

export const MARKUP = "<header>\n  <h1>Gestión diaria</h1>\n  <span class=\"meta\" id=\"hoy\"></span>\n</header>\n<nav>\n  <button data-tab=\"errores\" class=\"active\">Errores de marcación</button>\n  <button data-tab=\"calificados\">Calificados</button>\n  <button data-tab=\"cierres\">Cierres</button>\n  <button data-tab=\"comisiones\">Comisiones</button>\n  <button data-tab=\"entrantes\">Llamadas entrantes</button>\n  <button data-tab=\"exportar\">Exportar al cierre del día</button>\n</nav>\n<main>\n\n<!-- ERRORES -->\n<section id=\"tab-errores\">\n  <div class=\"card\">\n    <h2>Registrar contacto con error</h2>\n    <div class=\"row\">\n      <input id=\"err-link\" placeholder=\"Link del contacto (HubSpot o Genesys)\">\n    </div>\n    <div class=\"chips\" id=\"err-cats\"></div>\n    <div class=\"row\">\n      <input id=\"err-nota\" placeholder=\"Nota opcional\">\n      <button class=\"primary\" id=\"err-add\">Guardar</button>\n    </div>\n    <div class=\"row\" style=\"margin-top:10px\">\n      <input id=\"cat-new\" placeholder=\"Nueva categoría (crea su propia hoja)\">\n      <button id=\"cat-add\">Añadir categoría</button>\n    </div>\n  </div>\n  <div class=\"card\">\n    <h2>Registros de hoy <span class=\"count\" id=\"err-count\"></span></h2>\n    <div id=\"err-list\"></div>\n  </div>\n</section>\n\n<!-- CALIFICADOS -->\n<section id=\"tab-calificados\" class=\"hidden\">\n  <div class=\"card\">\n    <h2 id=\"cal-titulo\">Nuevo calificado</h2>\n    <div class=\"row\">\n      <label class=\"meta\" style=\"flex:1\">Fecha de calificación<input id=\"cal-calif\" type=\"date\" style=\"margin-top:4px\"></label>\n      <input id=\"cal-nombre\" placeholder=\"Nombre del cliente\">\n    </div>\n    <div class=\"row\" style=\"margin-top:8px\">\n      <input id=\"cal-link\" placeholder=\"Link del contacto\">\n      <input id=\"cal-hubspot\" placeholder=\"Link del negocio en HubSpot\">\n    </div>\n    <div class=\"row\" style=\"margin-top:8px\">\n      <label class=\"meta\" style=\"flex:1\">Fecha de pago tentativo<input id=\"cal-fecha\" type=\"date\" style=\"margin-top:4px\"></label>\n      <input id=\"cal-plan\" placeholder=\"Plan (ej. Pyme)\">\n      <input id=\"cal-monto\" type=\"number\" min=\"0\" placeholder=\"Monto del plan\">\n    </div>\n    <div class=\"row\" style=\"margin-top:8px\">\n      <input id=\"cal-recordatorio\" placeholder=\"Recordatorio (ej. llamar el martes)\">\n    </div>\n    <div class=\"row\" style=\"margin-top:10px\">\n      <button class=\"primary\" id=\"cal-add\">Guardar calificado</button>\n      <button id=\"cal-cancelar\" class=\"hidden\">Cancelar edición</button>\n    </div>\n  </div>\n  <div class=\"card\">\n    <h2>Calificados hoy: <span id=\"cal-hoy\">0</span> <span class=\"count\" id=\"cal-count\"></span></h2>\n    <p class=\"meta\">Ordenados por fecha de calificación (los más antiguos primero). A los 30 días sin pago pasan a cierre perdido.</p>\n    <div id=\"cal-list\"></div>\n  </div>\n</section>\n\n<!-- CIERRES -->\n<section id=\"tab-cierres\" class=\"hidden\">\n  <div class=\"card\">\n    <h2>Comisiones</h2>\n    <div class=\"total\" id=\"tot-mes\">Este mes: 0</div>\n    <div class=\"meta\" id=\"tot-todos\">Total histórico: 0</div>\n  </div>\n  <div class=\"card\">\n    <h2>Cierres ganados <span class=\"count\" id=\"cie-count\"></span></h2>\n    <div id=\"cie-list\"></div>\n  </div>\n  <div class=\"card\">\n    <h2>Cierres perdidos <span class=\"count\" id=\"per-count\"></span></h2>\n    <p class=\"meta\">Calificados que pasaron 30 días sin pago.</p>\n    <div id=\"per-list\"></div>\n  </div>\n</section>\n\n<!-- COMISIONES -->\n<section id=\"tab-comisiones\" class=\"hidden\">\n  <div class=\"card\">\n    <div class=\"row\">\n      <label class=\"meta\">Mes<input id=\"com-mes\" type=\"month\"></label>\n      <label class=\"meta\">Meta del mes<input id=\"com-meta\" type=\"number\" min=\"0\"></label>\n    </div>\n    <div id=\"com-resumen\" style=\"margin-top:12px\"></div>\n  </div>\n  <div class=\"card\">\n    <h2>Reglas de comisión</h2>\n    <div class=\"row\">\n      <label class=\"meta\">Tramo 1 (% de meta)<input id=\"cfg-t1\" type=\"number\"></label>\n      <label class=\"meta\">Comisión tramo 1 (%)<input id=\"cfg-c1\" type=\"number\"></label>\n      <label class=\"meta\">Tramo 2 (% de meta)<input id=\"cfg-t2\" type=\"number\"></label>\n      <label class=\"meta\">Comisión tramo 2 (%)<input id=\"cfg-c2\" type=\"number\"></label>\n    </div>\n    <div class=\"row\" style=\"margin-top:8px\">\n      <label class=\"meta\">Acelerador anual (% sobre valor con descuento)<input id=\"cfg-acel\" type=\"number\" step=\"0.1\"></label>\n      <label class=\"meta\">Descuento anual sugerido (%)<input id=\"cfg-desc\" type=\"number\"></label>\n    </div>\n  </div>\n  <div class=\"card\">\n    <h2>Cierres del mes</h2>\n    <div id=\"com-tabla\"></div>\n  </div>\n</section>\n\n<!-- ENTRANTES -->\n<section id=\"tab-entrantes\" class=\"hidden\">\n  <div class=\"card\">\n    <h2>Llamadas realizadas hoy</h2>\n    <div class=\"row\">\n      <input id=\"ll-hoy\" type=\"number\" min=\"0\" placeholder=\"Cantidad de llamadas realizadas\">\n      <button class=\"primary\" id=\"ll-guardar\">Guardar</button>\n    </div>\n  </div>\n  <div class=\"card\">\n    <h2>Registrar llamada entrante</h2>\n    <div class=\"row\">\n      <input id=\"en-link\" placeholder=\"Link del contacto\">\n      <select id=\"en-tipo\"><option>Soporte</option><option>Sales</option></select>\n    </div>\n    <div class=\"row\" style=\"margin-top:8px\">\n      <label class=\"meta\">Horas en cola<input id=\"en-h\" type=\"number\" min=\"0\" placeholder=\"0\"></label>\n      <label class=\"meta\">Minutos en cola<input id=\"en-m\" type=\"number\" min=\"0\" max=\"59\" placeholder=\"0\"></label>\n      <button class=\"primary\" id=\"en-add\" style=\"align-self:flex-end\">Guardar</button>\n    </div>\n  </div>\n  <div class=\"card\">\n    <h2>Entrantes de hoy: <span id=\"en-hoy\">0</span></h2>\n    <div class=\"meta\" id=\"en-resumen\"></div>\n    <div id=\"en-list\" style=\"margin-top:8px\"></div>\n  </div>\n  <div class=\"card\">\n    <h2>Resumen por día</h2>\n    <div id=\"en-dias\"></div>\n  </div>\n</section>\n\n<!-- EXPORTAR -->\n<section id=\"tab-exportar\" class=\"hidden\">\n  <div class=\"card\">\n    <h2>Exportar a Google Sheets</h2>\n    <p class=\"meta\">Cada hoja se copia en su pestaña. Copia la hoja y pégala en Google Sheets, o descarga el CSV e impórtalo.</p>\n    <div class=\"card\">\n      <h2>Resumen del día</h2>\n      <p class=\"meta\">Copia este texto y pégalo en un solo documento.</p>\n      <textarea id=\"res-texto\" rows=\"11\" readonly></textarea>\n      <div style=\"margin-top:8px\"><button class=\"primary\" id=\"res-copiar\">Copiar resumen</button></div>\n      <div class=\"row\" style=\"margin-top:10px\">\n        <button class=\"primary\" data-xl=\"dia\">Excel del día</button>\n        <button class=\"primary\" data-xl=\"semana\">Excel de la semana</button>\n        <button data-xl=\"todo\">Excel completo</button>\n      </div>\n      <div style=\"margin-top:10px\"><button id=\"json-bk\">Descargar respaldo .json</button></div>\n      <div style=\"margin-top:8px\"><label class=\"meta\">Restaurar desde respaldo .json <input id=\"json-rs\" type=\"file\" accept=\".json,application/json\"></label></div>\n    </div>\n    <div id=\"exp-list\"></div>\n  </div>\n</section>\n</main>";

export function estadoVacio(){
  return {
    cats: ["Registro por error","Cuelga el teléfono","No atiende llamada","Calificado en marcación"],
    errores: [], calificados: [], cierres: [], perdidos: [], entrantes: [],
    metas: {}, llamadasRealizadas: {},
    config: {tramo1:60, tasa1:20, tramo2:100, tasa2:35, acelerador:1.5, descuentoAnual:10}
  };
}

export function initGestion(initialState, onSave){
const DIAS_LIMITE = 30;
let calEditId = null, cierreConfId = null, cierreEditId = null, errCat = null, perdidoEditId = null, perdidoConfId = null;

const hoyISO = () => new Date().toISOString().slice(0,10);
const ahora = () => new Date().toLocaleString("es", {hour:"2-digit", minute:"2-digit"});
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2,10);
const aFecha = f => new Date(f + "T00:00:00").getTime();
const diasEntre = (desde, hasta) => Math.floor((aFecha(hasta) - aFecha(desde)) / 86400000);
const sumarDias = (f, n) => { const d = new Date(f + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const fmt = f => { if (!f) return "sin fecha"; const [y,m,d] = f.split("-"); return `${d}/${m}/${y}`; };
const money = n => Number(n || 0).toLocaleString("es", {minimumFractionDigits:0, maximumFractionDigits:2});
const neto = c => { const p = parseFloat(String(c.descuento || "").replace(",", ".")); const pct = isNaN(p) ? 0 : p; return Math.round((c.monto || 0) * (1 - pct / 100) * 100) / 100; };

let state = {
  cats: ["Registro por error","Cuelga el teléfono","No atiende llamada","Calificado en marcación"],
  errores: [],      // {id, fecha, hora, link, categoria, nota}
  calificados: [],  // {id, fecha, nombre, link, hubspot, pagoFecha, plan, recordatorio}
  cierres: [],      // {id, fechaCierre, nombre, fechaCalificacion, link, hubspot, plan, monto}
  perdidos: [],     // {id, fecha, fechaPerdido, nombre, link, hubspot, plan}
  metas: {},        // {"2026-10": 2500}
  entrantes: [],    // {id, fecha, hora, link, tipo, colaMin}
  llamadasRealizadas: {},  // {"2026-10-15": 40}
  config: {tramo1:60, tasa1:20, tramo2:100, tasa2:35, acelerador:1.5, descuentoAnual:10}
};

function save(){ onSave(state); }

/* Pasa a perdidos los calificados con más de 30 días sin pago */
function revisarVencidos(){
  const hoy = hoyISO();
  const vencidos = state.calificados.filter(c => !c.estado && diasEntre(c.fecha, hoy) >= DIAS_LIMITE);
  if (!vencidos.length) return;
  vencidos.forEach(c => state.perdidos.push({id:c.id, fecha:c.fecha, fechaPerdido:hoy, nombre:c.nombre, link:c.link, hubspot:c.hubspot, plan:c.plan, notas:c.notas || []}));
  vencidos.forEach(c => { c.estado = "perdido"; c.fechaEstado = hoy; });
  save();
}

/* TABS */
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll("nav button").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  ["errores","calificados","cierres","comisiones","entrantes","exportar"].forEach(t => document.getElementById("tab-"+t).classList.toggle("hidden", t !== b.dataset.tab));
  renderAll();
});

/* ERRORES */
function renderCats(){
  const box = document.getElementById("err-cats");
  box.innerHTML = state.cats.map(c =>
    `<button class="${errCat===c?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  box.querySelectorAll("button").forEach(b => b.onclick = () => { errCat = b.dataset.cat; renderCats(); });
}
function renderErrores(){
  const hoy = hoyISO();
  const lista = state.errores.filter(e => e.fecha === hoy);
  document.getElementById("err-count").textContent = lista.length;
  document.getElementById("err-list").innerHTML = lista.length ? lista.slice().reverse().map(e => `
    <div class="item">
      <div><strong>${esc(e.categoria)}</strong> · <span class="meta">${esc(e.hora)}</span>
        <div><a href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.link)}</a></div>
        ${e.nota ? `<div class="meta">${esc(e.nota)}</div>` : ""}
      </div>
      <button class="small" data-del="${e.id}">Eliminar</button>
    </div>`).join("") : `<p class="empty">Sin registros hoy.</p>`;
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    state.errores = state.errores.filter(x => x.id !== b.dataset.del); save(); renderErrores();
  });
  renderCats();
}
document.getElementById("err-add").onclick = () => {
  const link = document.getElementById("err-link").value.trim();
  if (!link || !errCat) { alert("Escribe el link y elige una categoría."); return; }
  state.errores.push({id:uid(), fecha:hoyISO(), hora:ahora(), link, categoria:errCat, nota:document.getElementById("err-nota").value.trim()});
  save();
  document.getElementById("err-link").value = ""; document.getElementById("err-nota").value = "";
  renderErrores();
};
document.getElementById("cat-add").onclick = () => {
  const n = document.getElementById("cat-new").value.trim();
  if (!n || state.cats.includes(n)) return;
  state.cats.push(n); save(); document.getElementById("cat-new").value = ""; renderErrores();
};

/* FORMULARIO CALIFICADOS */
function limpiarCalForm(){
  calEditId = null;
  document.getElementById("cal-add").textContent = "Guardar calificado";
  document.getElementById("cal-titulo").textContent = "Nuevo calificado";
  document.getElementById("cal-cancelar").classList.add("hidden");
  ["cal-nombre","cal-link","cal-hubspot","cal-fecha","cal-plan","cal-monto","cal-recordatorio"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("cal-calif").value = hoyISO();
}
function cargarCalForm(c){
  calEditId = c.id;
  document.getElementById("cal-add").textContent = "Guardar cambios";
  document.getElementById("cal-titulo").textContent = "Editando calificado";
  document.getElementById("cal-cancelar").classList.remove("hidden");
  document.getElementById("cal-calif").value = c.fecha || hoyISO();
  document.getElementById("cal-nombre").value = c.nombre || "";
  document.getElementById("cal-link").value = c.link || "";
  document.getElementById("cal-hubspot").value = c.hubspot || "";
  document.getElementById("cal-fecha").value = c.pagoFecha || "";
  document.getElementById("cal-plan").value = c.plan || "";
  document.getElementById("cal-monto").value = c.monto || "";
  document.getElementById("cal-recordatorio").value = c.recordatorio || "";
  window.scrollTo({top:0, behavior:"smooth"});
}
document.getElementById("cal-cancelar").onclick = () => { limpiarCalForm(); };
document.getElementById("cal-add").onclick = () => {
  const link = document.getElementById("cal-link").value.trim();
  if (!link) { alert("Escribe el link del contacto."); return; }
  const datos = {
    fecha: document.getElementById("cal-calif").value || hoyISO(),
    nombre: document.getElementById("cal-nombre").value.trim(),
    link,
    hubspot: document.getElementById("cal-hubspot").value.trim(),
    pagoFecha: document.getElementById("cal-fecha").value,
    plan: document.getElementById("cal-plan").value.trim(),
    monto: Number(document.getElementById("cal-monto").value) || 0,
    recordatorio: document.getElementById("cal-recordatorio").value.trim()
  };
  if (calEditId) {
    const c = state.calificados.find(x => x.id === calEditId);
    if (c) Object.assign(c, datos);
  } else {
    state.calificados.push({id:uid(), pagado:false, ...datos});
  }
  save(); limpiarCalForm(); renderCalificados();
};

/* CALIFICADOS */
function renderCalificados(){
  revisarVencidos();
  const hoy = hoyISO();
  const act = state.calificados.slice().sort((a,b) => (a.estado ? 1 : 0) - (b.estado ? 1 : 0) || a.fecha.localeCompare(b.fecha));
  document.getElementById("cal-count").textContent = act.filter(c => !c.estado).length + " pendientes";
  document.getElementById("cal-hoy").textContent = contarCalificados(hoy);
  document.getElementById("cal-list").innerHTML = act.length ? act.map(c => {
    const dias = diasEntre(c.fecha, hoy);
    const restantes = DIAS_LIMITE - dias;
    if (c.estado) return `
    <div class="item" style="opacity:.75">
      <div style="flex:1">
        <div style="font-size:16px;font-weight:700">${fmt(c.fecha)} - ${esc(c.nombre || "Sin nombre")} · <span class="${c.estado === 'perdido' ? 'danger' : ''}">${c.estado === "ganado" ? "✅ Cierre ganado" : "❌ Cierre perdido"} ${fmt(c.fechaEstado)}</span></div>
        <div class="meta"><a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.link)}</a></div>
        <div class="meta">Plan: ${esc(c.plan || "—")} · Monto: ${money(c.monto)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="small" disabled>Cerrado</button>
        <button class="small" data-delc="${c.id}">Eliminar</button>
      </div>
    </div>`;
    const pagoHoy = c.pagoFecha && c.pagoFecha <= hoy;
    const conf = cierreConfId === c.id ? `
      <div class="inline">
        <div class="row">
          <input id="conf-monto" type="number" min="0" value="${c.monto || ""}" placeholder="Monto pagado">
          <input id="conf-plan" value="${esc(c.plan)}" placeholder="Plan que pagó">
          <input id="conf-fecha" type="date" value="${hoy}" title="Fecha en que pagó">
          <select id="conf-period" data-desc="conf-desc" onchange="sugerirDescuento(this)"><option>Mensual</option><option>Anual</option></select>
          <input id="conf-desc" placeholder="Descuento (vacío = sin descuento)">
        </div>
        <div class="row" style="margin-top:8px">
          <button class="primary small" data-confirmar="${c.id}">Confirmar cierre</button>
          <button class="small" data-cancelar-conf>Cancelar</button>
        </div>
      </div>` : "";
    return `
    <div class="item">
      <div style="flex:1">
        ${pagoHoy ? `<div class="alert">⏰ Agendar hoy: ${esc(c.recordatorio || "contactar para pago")}</div>` : ""}
        <div style="font-size:16px;font-weight:700">${fmt(c.fecha)} - ${esc(c.nombre || "Sin nombre")} · <span class="${restantes <= 7 ? 'danger' : ''}">vence ${fmt(sumarDias(c.fecha, DIAS_LIMITE))}</span></div>
        <div class="meta">Quedan ${restantes} días · <a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.link)}</a></div>
        <div class="meta">Plan: ${esc(c.plan || "—")} · Monto: ${money(c.monto)} · Pago tentativo: ${fmt(c.pagoFecha)}</div>
        ${c.recordatorio && !pagoHoy ? `<div class="meta">Recordatorio: ${esc(c.recordatorio)}</div>` : ""}
        ${c.hubspot ? `<div class="meta">HubSpot: <a href="${esc(c.hubspot)}" target="_blank" rel="noopener">negocio</a></div>` : ""}
        <div class="notas">
          ${(c.notas || []).map(n => `<div class="nota"><span class="meta">${fmt(n.fecha)}</span> ${esc(n.texto)} <button class="small" data-delnota="${c.id}|${n.id}">×</button></div>`).join("")}
          <div class="row" style="margin-top:6px">
            <input id="nota-${c.id}" placeholder="Escribe una nota de seguimiento">
            <button class="small" data-nota="${c.id}">Agregar nota</button>
          </div>
        </div>
        ${conf}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="small primary" data-pagado="${c.id}">Pagó → cierre</button>
        <button class="small" data-editc="${c.id}">Editar</button>
        <button class="small" data-delc="${c.id}">Eliminar</button>
      </div>
    </div>`;}).join("") : `<p class="empty">No hay calificados pendientes.</p>`;

  document.querySelectorAll("[data-pagado]").forEach(b => b.onclick = () => { cierreConfId = b.dataset.pagado; renderCalificados(); });
  document.querySelectorAll("[data-cancelar-conf]").forEach(b => b.onclick = () => { cierreConfId = null; renderCalificados(); });
  document.querySelectorAll("[data-editc]").forEach(b => b.onclick = () => {
    const c = state.calificados.find(x => x.id === b.dataset.editc);
    if (c) cargarCalForm(c);
  });
  document.querySelectorAll("[data-nota]").forEach(b => b.onclick = () => {
    const c = state.calificados.find(x => x.id === b.dataset.nota);
    const inp = document.getElementById("nota-" + c.id);
    const texto = inp.value.trim();
    if (!c || !texto) return;
    c.notas = c.notas || [];
    c.notas.push({id:uid(), fecha:hoyISO(), texto});
    save(); renderCalificados();
  });
  document.querySelectorAll("[data-delnota]").forEach(b => b.onclick = () => {
    const [cid, nid] = b.dataset.delnota.split("|");
    const c = state.calificados.find(x => x.id === cid);
    if (c) c.notas = (c.notas || []).filter(n => n.id !== nid);
    save(); renderCalificados();
  });
  document.querySelectorAll("[data-delc]").forEach(b => b.onclick = () => {
    state.calificados = state.calificados.filter(x => x.id !== b.dataset.delc); save(); renderCalificados();
  });
  document.querySelectorAll("[data-confirmar]").forEach(b => b.onclick = () => {
    const c = state.calificados.find(x => x.id === b.dataset.confirmar);
    if (!c) return;
    state.cierres.push({
      id:uid(),
      fechaCierre: document.getElementById("conf-fecha").value || hoyISO(),
      fechaRegistro: hoyISO(),
      fechaCalificacion: c.fecha,
      nombre: c.nombre, link:c.link, hubspot:c.hubspot, notas: c.notas || [],
      plan: document.getElementById("conf-plan").value.trim(),
      monto: Number(document.getElementById("conf-monto").value) || 0,
      periodicidad: document.getElementById("conf-period").value,
      descuento: document.getElementById("conf-desc").value.trim(),
      calId: c.id
    });
    c.estado = "ganado"; c.fechaEstado = hoyISO();
    cierreConfId = null;
    save(); renderCalificados();
  });
}

/* Calificados de una fecha: incluye los que ya pasaron a cierre (ganado o perdido) */
function contarCalificados(f){
  const ids = new Set(state.calificados.map(c => c.id));
  return state.calificados.filter(c => c.fecha === f).length
    + state.cierres.filter(c => !c.calId && c.fechaCalificacion === f).length
    + state.perdidos.filter(p => !ids.has(p.id) && p.fecha === f).length;
}

/* CIERRES */
function renderCierres(){
  revisarVencidos();
  const mes = hoyISO().slice(0,7);
  const totalMes = state.cierres.filter(c => c.fechaCierre.startsWith(mes)).reduce((s,c) => s + neto(c), 0);
  const totalTodos = state.cierres.reduce((s,c) => s + neto(c), 0);
  document.getElementById("tot-mes").textContent = `Este mes: ${money(totalMes)} (${state.cierres.filter(c => c.fechaCierre.startsWith(mes)).length} cierres)`;
  document.getElementById("tot-todos").textContent = `Total histórico: ${money(totalTodos)} (${state.cierres.length} cierres)`;
  document.getElementById("cie-count").textContent = state.cierres.length;
  document.getElementById("cie-list").innerHTML = state.cierres.length ? state.cierres.slice().reverse().map(c => {
    const edit = cierreEditId === c.id ? `
      <div class="inline">
        <div class="row">
          <input id="ce-monto" type="number" min="0" value="${c.monto||0}" placeholder="Monto">
          <input id="ce-plan" value="${esc(c.plan)}" placeholder="Plan">
          <input id="ce-fecha" type="date" value="${esc(c.fechaCierre)}">
        </div>
        <div class="row" style="margin-top:8px">
          <select id="ce-period" data-desc="ce-desc" onchange="sugerirDescuento(this)"><option ${c.periodicidad!=="Anual"?"selected":""}>Mensual</option><option ${c.periodicidad==="Anual"?"selected":""}>Anual</option></select>
          <input id="ce-desc" value="${esc(c.descuento)}" placeholder="Descuento (vacío = sin descuento)">
        </div>
        <div class="row" style="margin-top:8px">
          <button class="primary small" data-guardar-cierre="${c.id}">Guardar</button>
          <button class="small" data-cancelar-cierre>Cancelar</button>
        </div>
      </div>` : "";
    return `
    <div class="item">
      <div style="flex:1">
        <div style="font-size:16px;font-weight:700">${fmt(c.fechaCierre)} - ${esc(c.nombre || "Sin nombre")} · ${money(neto(c))}${c.descuento ? ` <span class="meta">(bruto ${money(c.monto)})</span>` : ""}</div>
        <div class="meta">Plan: ${esc(c.plan || "—")} · ${esc(c.periodicidad || "")}${c.descuento ? " · Descuento: " + esc(c.descuento) : ""} · Calificado: ${fmt(c.fechaCalificacion)} · Registrado: ${fmt(c.fechaRegistro)}${c.periodicidad === "Anual" ? ` · <strong>Comisionable: ${money(valorComisionable(c))}</strong>` : ""}</div>
        <div class="meta"><a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.link)}</a></div>
        ${c.hubspot ? `<div class="meta">HubSpot: <a href="${esc(c.hubspot)}" target="_blank" rel="noopener">negocio</a></div>` : ""}
        <div class="notas">
          ${(c.notas || []).map(n => `<div class="nota"><span class="meta">${fmt(n.fecha)}</span> ${esc(n.texto)} <button class="small" data-delcnota="${c.id}|${n.id}">×</button></div>`).join("")}
          <div class="row" style="margin-top:6px">
            <input id="cnota-${c.id}" placeholder="Nota para conciliar (ej. pagado en sistema, factura #)">
            <button class="small" data-cnota="${c.id}">Agregar nota</button>
          </div>
        </div>
        ${edit}
      </div>
      <div><button class="small" data-editar-cierre="${c.id}">Editar</button></div>
    </div>`;}).join("") : `<p class="empty">Aún no hay cierres.</p>`;

  document.querySelectorAll("[data-editar-cierre]").forEach(b => b.onclick = () => { cierreEditId = b.dataset.editarCierre; renderCierres(); });
  document.querySelectorAll("[data-cancelar-cierre]").forEach(b => b.onclick = () => { cierreEditId = null; renderCierres(); });
  document.querySelectorAll("[data-cnota]").forEach(b => b.onclick = () => {
    const c = state.cierres.find(x => x.id === b.dataset.cnota);
    const texto = document.getElementById("cnota-" + b.dataset.cnota).value.trim();
    if (!c || !texto) return;
    c.notas = c.notas || [];
    c.notas.push({id:uid(), fecha:hoyISO(), texto});
    save(); renderCierres();
  });
  document.querySelectorAll("[data-delcnota]").forEach(b => b.onclick = () => {
    const [cid, nid] = b.dataset.delcnota.split("|");
    const c = state.cierres.find(x => x.id === cid);
    if (c) c.notas = (c.notas || []).filter(n => n.id !== nid);
    save(); renderCierres();
  });
  document.querySelectorAll("[data-guardar-cierre]").forEach(b => b.onclick = () => {
    const c = state.cierres.find(x => x.id === b.dataset.guardarCierre);
    if (c) {
      c.monto = Number(document.getElementById("ce-monto").value) || 0;
      c.plan = document.getElementById("ce-plan").value.trim();
      c.fechaCierre = document.getElementById("ce-fecha").value || c.fechaCierre;
      c.periodicidad = document.getElementById("ce-period").value;
      c.descuento = document.getElementById("ce-desc").value.trim();
    }
    cierreEditId = null; save(); renderCierres();
  });

  document.getElementById("per-count").textContent = state.perdidos.length;
  document.getElementById("per-list").innerHTML = state.perdidos.length ? state.perdidos.slice().reverse().map(p => {
    const confForm = perdidoConfId === p.id ? `
      <div class="inline">
        <div class="row">
          <input id="pc-monto" type="number" min="0" placeholder="Monto pagado">
          <input id="pc-plan" value="${esc(p.plan)}" placeholder="Plan que pagó">
          <input id="pc-fecha" type="date" value="${hoyISO()}" title="Fecha en que pagó">
          <select id="pc-period" data-desc="pc-desc" onchange="sugerirDescuento(this)"><option>Mensual</option><option>Anual</option></select>
          <input id="pc-desc" placeholder="Descuento (vacío = sin descuento)">
        </div>
        <div class="row" style="margin-top:8px">
          <button class="primary small" data-pc-confirmar="${p.id}">Confirmar cierre</button>
          <button class="small" data-pc-cancelar>Cancelar</button>
        </div>
      </div>` : "";
    const editForm = perdidoEditId === p.id ? `
      <div class="inline">
        <div class="row">
          <input id="pe-nombre" value="${esc(p.nombre)}" placeholder="Nombre del cliente">
          <input id="pe-fecha" type="date" value="${esc(p.fecha)}" title="Fecha de calificación">
          <input id="pe-plan" value="${esc(p.plan)}" placeholder="Plan">
        </div>
        <div class="row" style="margin-top:8px">
          <input id="pe-link" value="${esc(p.link)}" placeholder="Link del contacto">
          <input id="pe-hubspot" value="${esc(p.hubspot)}" placeholder="Link del negocio en HubSpot">
        </div>
        <div class="row" style="margin-top:8px">
          <button class="primary small" data-pe-guardar="${p.id}">Guardar cambios</button>
          <button class="small" data-pe-cancelar>Cancelar</button>
        </div>
      </div>` : "";
    return `
    <div class="item">
      <div style="flex:1">
        <div><strong>${esc(p.nombre || p.plan || "Perdido")}</strong> · <span class="meta">Calificado ${fmt(p.fecha)} · perdido ${fmt(p.fechaPerdido)}</span></div>
        <div class="meta"><a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link)}</a></div>
        ${p.hubspot ? `<div class="meta">HubSpot: <a href="${esc(p.hubspot)}" target="_blank" rel="noopener">negocio</a></div>` : ""}
        ${confForm}${editForm}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="small primary" data-pc="${p.id}">Pagó → cierre</button>
        <button class="small" data-pe="${p.id}">Editar</button>
        <button class="small" data-pd="${p.id}">Eliminar</button>
      </div>
    </div>`;}).join("") : `<p class="empty">Sin cierres perdidos.</p>`;

  document.querySelectorAll("[data-pc]").forEach(b => b.onclick = () => { perdidoConfId = b.dataset.pc; perdidoEditId = null; renderCierres(); });
  document.querySelectorAll("[data-pc-cancelar]").forEach(b => b.onclick = () => { perdidoConfId = null; renderCierres(); });
  document.querySelectorAll("[data-pe]").forEach(b => b.onclick = () => { perdidoEditId = b.dataset.pe; perdidoConfId = null; renderCierres(); });
  document.querySelectorAll("[data-pe-cancelar]").forEach(b => b.onclick = () => { perdidoEditId = null; renderCierres(); });
  document.querySelectorAll("[data-pd]").forEach(b => b.onclick = () => {
    state.perdidos = state.perdidos.filter(x => x.id !== b.dataset.pd); save(); renderCierres();
  });
  document.querySelectorAll("[data-pe-guardar]").forEach(b => b.onclick = () => {
    const p = state.perdidos.find(x => x.id === b.dataset.peGuardar);
    if (p) {
      p.nombre = document.getElementById("pe-nombre").value.trim();
      p.fecha = document.getElementById("pe-fecha").value || p.fecha;
      p.plan = document.getElementById("pe-plan").value.trim();
      p.link = document.getElementById("pe-link").value.trim();
      p.hubspot = document.getElementById("pe-hubspot").value.trim();
    }
    perdidoEditId = null; save(); renderCierres();
  });
  document.querySelectorAll("[data-pc-confirmar]").forEach(b => b.onclick = () => {
    const p = state.perdidos.find(x => x.id === b.dataset.pcConfirmar);
    if (!p) return;
    state.cierres.push({
      id: uid(),
      fechaCierre: document.getElementById("pc-fecha").value || hoyISO(),
      fechaRegistro: hoyISO(),
      fechaCalificacion: p.fecha,
      nombre: p.nombre, link: p.link, hubspot: p.hubspot, notas: p.notas || [],
      plan: document.getElementById("pc-plan").value.trim(),
      monto: Number(document.getElementById("pc-monto").value) || 0,
      periodicidad: document.getElementById("pc-period").value,
      descuento: document.getElementById("pc-desc").value.trim()
    });
    state.perdidos = state.perdidos.filter(x => x.id !== p.id);
    perdidoConfId = null;
    save(); renderCierres();
  });
}

/* COMISIONES */
let comMes = hoyISO().slice(0,7);
window.sugerirDescuento = sugerirDescuento;
function sugerirDescuento(sel){
  const d = document.getElementById(sel.dataset.desc);
  if (d && sel.value === "Anual" && !d.value) d.value = state.config.descuentoAnual + "%";
}
function valorComisionable(c){
  const n = neto(c);
  return c.periodicidad === "Anual" ? n * (1 + state.config.acelerador / 100) : n;
}
function resumenMes(m){
  const cfg = state.config;
  const cs = state.cierres.filter(c => c.fechaCierre.startsWith(m));
  const ventas = cs.reduce((s,c) => s + valorComisionable(c), 0);
  const meta = state.metas[m] ?? 2500;
  const pct = meta ? ventas / meta * 100 : 0;
  const tasa = pct >= cfg.tramo2 ? cfg.tasa2 : pct >= cfg.tramo1 ? cfg.tasa1 : 0;
  return {cs, ventas, meta, pct, tasa, comision: ventas * tasa / 100};
}
function renderComisiones(){
  const cfg = state.config;
  document.getElementById("com-mes").value = comMes;
  const r = resumenMes(comMes);
  document.getElementById("com-meta").value = r.meta;
  document.getElementById("com-resumen").innerHTML = `
    <div class="total">Comisión del mes: ${money(r.comision)}</div>
    <div class="meta">Ventas comisionables: ${money(r.ventas)} de meta ${money(r.meta)} (${r.pct.toFixed(1)}%)</div>
    <div class="meta">Tasa aplicada: ${r.tasa}%</div>
    <div class="total" style="margin-top:10px">Te faltan ${money(Math.max(0, r.meta - r.ventas))} para la meta</div>
    <div class="meta">Para llegar a ${state.config.tramo1}% (${money(r.meta * state.config.tramo1 / 100)}): faltan ${money(Math.max(0, r.meta * state.config.tramo1 / 100 - r.ventas))} · comisión ${money(r.meta * state.config.tramo1 / 100 * state.config.tasa1 / 100)}</div>
    <div class="meta">Para llegar a ${state.config.tramo2}% (${money(r.meta * state.config.tramo2 / 100)}): faltan ${money(Math.max(0, r.meta * state.config.tramo2 / 100 - r.ventas))} · comisión ${money(r.meta * state.config.tramo2 / 100 * state.config.tasa2 / 100)}</div>`;
  document.getElementById("com-tabla").innerHTML = r.cs.length ? r.cs.map(c => `
    <div class="item">
      <div><strong>${esc(c.nombre || "Sin nombre")}</strong> · <span class="meta">${fmt(c.fechaCierre)} · ${esc(c.plan || "")} · ${esc(c.periodicidad || "")}</span></div>
      <div>${money(neto(c))}${c.periodicidad === "Anual" ? ` → <strong>${money(valorComisionable(c))}</strong>` : ""}</div>
    </div>`).join("") : `<p class="empty">Sin cierres en este mes.</p>`;
  document.getElementById("cfg-t1").value = cfg.tramo1;
  document.getElementById("cfg-c1").value = cfg.tasa1;
  document.getElementById("cfg-t2").value = cfg.tramo2;
  document.getElementById("cfg-c2").value = cfg.tasa2;
  document.getElementById("cfg-acel").value = cfg.acelerador;
  document.getElementById("cfg-desc").value = cfg.descuentoAnual;
}
document.getElementById("com-mes").onchange = e => { comMes = e.target.value || comMes; renderComisiones(); };
document.getElementById("com-meta").onchange = e => { state.metas[comMes] = Number(e.target.value) || 0; save(); renderComisiones(); };
[["cfg-t1","tramo1"],["cfg-c1","tasa1"],["cfg-t2","tramo2"],["cfg-c2","tasa2"],["cfg-acel","acelerador"],["cfg-desc","descuentoAnual"]].forEach(([id,k]) => {
  document.getElementById(id).onchange = e => { state.config[k] = Number(e.target.value) || 0; save(); renderAll(); };
});

/* LLAMADAS ENTRANTES */
const fmtCola = min => `${Math.floor((min||0)/60)}h ${(min||0)%60}m`;
function resumenDias(){
  const dias = {};
  const get = f => dias[f] = dias[f] || {fecha:f, entrantes:0, soporte:0, sales:0, cola:0, realizadas:0};
  state.entrantes.forEach(e => { const d = get(e.fecha); d.entrantes++; if (e.tipo === "Soporte") d.soporte++; else d.sales++; d.cola += e.colaMin || 0; });
  Object.keys(state.llamadasRealizadas).forEach(f => get(f).realizadas = state.llamadasRealizadas[f]);
  return Object.values(dias).sort((a,b) => b.fecha.localeCompare(a.fecha));
}
function renderEntrantes(){
  const hoy = hoyISO();
  document.getElementById("ll-hoy").value = state.llamadasRealizadas[hoy] ?? "";
  const hoyList = state.entrantes.filter(e => e.fecha === hoy);
  const sop = hoyList.filter(e => e.tipo === "Soporte").length;
  document.getElementById("en-hoy").textContent = hoyList.length;
  document.getElementById("en-resumen").textContent = `Soporte: ${sop} · Sales: ${hoyList.length - sop}`;
  document.getElementById("en-list").innerHTML = hoyList.length ? hoyList.slice().reverse().map(e => `
    <div class="item">
      <div><strong>${esc(e.tipo)}</strong> · <span class="meta">${esc(e.hora)} · en cola ${fmtCola(e.colaMin)}</span>
        <div><a href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.link)}</a></div>
      </div>
      <button class="small" data-delen="${e.id}">Eliminar</button>
    </div>`).join("") : `<p class="empty">Sin llamadas entrantes hoy.</p>`;
  document.querySelectorAll("[data-delen]").forEach(b => b.onclick = () => {
    state.entrantes = state.entrantes.filter(x => x.id !== b.dataset.delen); save(); renderEntrantes();
  });
  const dias = resumenDias();
  document.getElementById("en-dias").innerHTML = dias.length ? `
    <table>
      <tr><th>Fecha</th><th>Entrantes</th><th>Soporte</th><th>Sales</th><th>Realizadas</th><th>Cola promedio</th></tr>
      ${dias.map(d => `<tr><td>${fmt(d.fecha)}</td><td>${d.entrantes}</td><td>${d.soporte}</td><td>${d.sales}</td><td>${d.realizadas}</td><td>${d.entrantes ? fmtCola(Math.round(d.cola / d.entrantes)) : "—"}</td></tr>`).join("")}
    </table>` : `<p class="empty">Sin datos todavía.</p>`;
}
document.getElementById("ll-guardar").onclick = () => {
  const v = document.getElementById("ll-hoy").value;
  if (v === "") return;
  state.llamadasRealizadas[hoyISO()] = Number(v) || 0;
  save(); renderEntrantes();
};
document.getElementById("en-add").onclick = () => {
  const link = document.getElementById("en-link").value.trim();
  if (!link) { alert("Escribe el link del contacto."); return; }
  const h = Number(document.getElementById("en-h").value) || 0;
  const m = Number(document.getElementById("en-m").value) || 0;
  state.entrantes.push({id:uid(), fecha:hoyISO(), hora:ahora(), link, tipo:document.getElementById("en-tipo").value, colaMin:h*60 + m});
  save();
  document.getElementById("en-link").value = "";
  document.getElementById("en-h").value = "";
  document.getElementById("en-m").value = "";
  renderEntrantes();
};

/* EXPORTAR */
function tsv(rows, headers){
  const clean = v => String(v ?? "").replace(/[\t\r\n]+/g," ");
  return [headers.join("\t"), ...rows.map(r => r.map(clean).join("\t"))].join("\n");
}
function csv(rows, headers){
  const q = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
  return [headers.map(q).join(","), ...rows.map(r => r.map(q).join(","))].join("\n");
}
function sheetsFor(){
  const sheets = {};
  state.cats.forEach(c => {
    const rows = state.errores.filter(e => e.categoria === c).map(e => [e.fecha, e.hora, e.link, e.nota]);
    sheets[c] = {headers:["Fecha","Hora","Link contacto / HubSpot","Nota"], rows};
  });
  sheets["Calificados"] = {headers:["Fecha calificación","Nombre cliente","Link contacto","HubSpot negocio","Fecha pago tentativo","Plan","Recordatorio","Notas de seguimiento"],
    rows: state.calificados.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(c => [c.fecha, c.nombre || "", c.link, c.hubspot, c.pagoFecha, c.plan, c.recordatorio, (c.notas || []).map(n => fmt(n.fecha) + ": " + n.texto).join(" | ")])};
  const porDia = {};
  state.calificados.forEach(c => porDia[c.fecha] = 0);
  state.cierres.forEach(c => { if (c.fechaCalificacion) porDia[c.fechaCalificacion] = 0; });
  state.perdidos.forEach(p => { if (p.fecha) porDia[p.fecha] = 0; });
  Object.keys(porDia).forEach(f => porDia[f] = contarCalificados(f));
  sheets["Conteo diario"] = {headers:["Fecha","Calificados"],
    rows: Object.keys(porDia).sort().map(f => [f, porDia[f]])};
  sheets["Cierres ganados"] = {headers:["Fecha de pago","Fecha de registro","Nombre cliente","Fecha calificación","Link contacto","HubSpot negocio","Plan","Monto final","Periodicidad","Descuento","Notas"],
    rows: state.cierres.map(c => [c.fechaCierre, c.fechaRegistro || "", c.nombre || "", c.fechaCalificacion, c.link, c.hubspot, c.plan, neto(c), c.periodicidad || "", c.descuento || "", (c.notas || []).map(n => fmt(n.fecha) + ": " + n.texto).join(" | ")])};
  const meses = [...new Set(state.cierres.map(c => c.fechaCierre.slice(0,7)))].sort();
  sheets["Comisiones"] = {headers:["Mes","Meta","Ventas comisionables","% de meta","Tasa","Comisión"],
    rows: meses.map(m => { const r = resumenMes(m); return [m, r.meta, Math.round(r.ventas), r.pct.toFixed(1)+"%", r.tasa+"%", Math.round(r.comision)]; })};
  sheets["Llamadas entrantes"] = {headers:["Fecha","Hora","Link contacto","Tipo","Tiempo en cola (min)"],
    rows: state.entrantes.map(e => [e.fecha, e.hora, e.link, e.tipo, e.colaMin])};
  sheets["Resumen llamadas"] = {headers:["Fecha","Entrantes","Soporte","Sales","Realizadas","Cola promedio (min)"],
    rows: resumenDias().map(d => [d.fecha, d.entrantes, d.soporte, d.sales, d.realizadas, d.entrantes ? Math.round(d.cola / d.entrantes) : 0])};
  sheets["Cierres perdidos"] = {headers:["Fecha calificación","Fecha perdido","Nombre cliente","Link contacto","HubSpot negocio","Plan"],
    rows: state.perdidos.map(p => [p.fecha, p.fechaPerdido, p.nombre || "", p.link, p.hubspot, p.plan])};
  return sheets;
}
function download(name, text){
  const blob = new Blob(["\ufeff"+text], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
/* EXCEL */
function rangoSemana(){
  const d = new Date();
  const dow = (d.getDay() + 6) % 7;
  const lunes = new Date(d); lunes.setDate(d.getDate() - dow);
  return [lunes.toISOString().slice(0,10), hoyISO()];
}
function filasUnificadas(){
  const filas = [];
  const notasTxt = arr => (arr || []).map(n => fmt(n.fecha) + ": " + n.texto).join(" | ");
  state.errores.forEach(e => filas.push([e.fecha, "Error de marcación", e.categoria, e.link, "", "", "", "", "", "", "", "", `Hora ${e.hora}${e.nota ? " · " + e.nota : ""}`, ""]));
  state.calificados.forEach(c => filas.push([c.fecha, "Calificado", c.nombre || "", c.link, c.hubspot || "", c.plan || "", c.monto || 0, "", "", c.pagoFecha || "", c.fecha, "", c.recordatorio || "", notasTxt(c.notas)]));
  state.cierres.forEach(c => filas.push([c.fechaCierre, "Cierre ganado", c.nombre || "", c.link, c.hubspot || "", c.plan || "", neto(c), c.periodicidad || "", c.descuento || "", c.fechaCierre, c.fechaCalificacion || "", c.fechaRegistro || "", "", notasTxt(c.notas)]));
  state.perdidos.forEach(p => filas.push([p.fechaPerdido, "Cierre perdido", p.nombre || "", p.link, p.hubspot || "", p.plan || "", "", "", "", "", p.fecha, "", "", notasTxt(p.notas)]));
  state.entrantes.forEach(e => filas.push([e.fecha, "Llamada entrante", e.tipo, e.link, "", "", "", "", "", "", "", "", `En cola ${fmtCola(e.colaMin)}`, ""]));
  Object.keys(state.llamadasRealizadas).forEach(f => filas.push([f, "Llamadas realizadas", "", "", "", "", "", "", "", "", "", "", `Total: ${state.llamadasRealizadas[f]}`, ""]));
  return filas.sort((a,b) => String(a[0]).localeCompare(String(b[0])));
}
function construirLibro(desde, hasta){
  const wb = XLSX.utils.book_new();
  const headers = ["Fecha","Tipo","Nombre / categoría","Link contacto","Link HubSpot","Plan","Monto final","Periodicidad","Descuento","Fecha de pago","Fecha de calificación","Fecha de registro","Detalle","Notas"];
  const rows = filasUnificadas().filter(r => !desde || (r[0] >= desde && r[0] <= hasta));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Registro");
  return wb;
}
function descargarExcel(tipo){
  let desde = null, hasta = null, nombre = "gestion-diaria-completo";
  if (tipo === "dia"){ desde = hasta = hoyISO(); nombre = "gestion-diaria-" + hoyISO(); }
  if (tipo === "semana"){ [desde, hasta] = rangoSemana(); nombre = `gestion-diaria-semana-${desde}-a-${hasta}`; }
  XLSX.writeFile(construirLibro(desde, hasta), nombre + ".xlsx");
}
document.getElementById("json-rs").onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    state = {...estadoVacio(), ...d};
    save();
    renderAll();
    alert("Respaldo restaurado.");
  } catch(err) { alert("Ese archivo no es un respaldo válido."); }
};
document.getElementById("json-bk").onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "data.json"; a.click();
};
document.querySelectorAll("[data-xl]").forEach(b => b.onclick = () => descargarExcel(b.dataset.xl));

function renderResumenDia(){
  const hoy = hoyISO();
  const ent = state.entrantes.filter(e => e.fecha === hoy);
  const colaMin = ent.reduce((s,e) => s + (e.colaMin || 0), 0);
  const sop = ent.filter(e => e.tipo === "Soporte").length;
  const err = state.errores.filter(e => e.fecha === hoy);
  const errReg = err.filter(e => e.categoria === "Registro por error").length;
  const cal = contarCalificados(hoy);
  const cierres = state.cierres.filter(c => c.fechaCierre === hoy);
  const montoCierres = cierres.reduce((s,c) => s + neto(c), 0);
  const perd = state.perdidos.filter(p => p.fechaPerdido === hoy).length;
  const real = state.llamadasRealizadas[hoy] ?? 0;
  const texto = [
    `Resumen del día ${fmt(hoy)}`,
    `Horas en cola: ${fmtCola(colaMin)}`,
    `Llamadas entrantes: ${ent.length} (Soporte ${sop}, Sales ${ent.length - sop})`,
    `Llamadas realizadas: ${real}`,
    `Registros por error: ${errReg}`,
    `Errores de marcación: ${err.length - errReg}`,
    `Calificados: ${cal}`,
    `Cierres ganados: ${cierres.length} - $${money(montoCierres)}`,
    `Cierres perdidos: ${perd}`
  ].join("\n");
  document.getElementById("res-texto").value = texto;
}
document.getElementById("res-copiar").onclick = async () => {
  const t = document.getElementById("res-texto");
  try { await navigator.clipboard.writeText(t.value); document.getElementById("res-copiar").textContent = "¡Copiado!"; setTimeout(() => document.getElementById("res-copiar").textContent = "Copiar resumen", 1500); }
  catch(e){ t.select(); alert("Selecciona el texto y cópialo con Ctrl+C."); }
};
function renderExportar(){
  renderResumenDia();
  const sheets = sheetsFor();
  const names = Object.keys(sheets);
  document.getElementById("exp-list").innerHTML = names.map((name,i) => `
    <div class="item">
      <div><strong>${esc(name)}</strong> <span class="meta">${sheets[name].rows.length} filas</span></div>
      <div class="row" style="flex:0 0 auto">
        <button class="small" data-copy="${i}">Copiar hoja</button>
        <button class="small" data-csv="${i}">Descargar CSV</button>
      </div>
    </div>`).join("") + `<div style="margin-top:12px"><button class="primary" id="exp-all">Descargar todas las hojas</button></div>`;
  document.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => {
    const s = sheets[names[b.dataset.copy]];
    try { await navigator.clipboard.writeText(tsv(s.rows, s.headers)); b.textContent = "¡Copiado!"; setTimeout(()=>b.textContent="Copiar hoja",1500); }
    catch(e){ alert("No se pudo copiar. Usa Descargar CSV."); }
  });
  document.querySelectorAll("[data-csv]").forEach(b => b.onclick = () => {
    const n = names[b.dataset.csv]; const s = sheets[n];
    download(`${n}-${hoyISO()}.csv`, csv(s.rows, s.headers));
  });
  document.getElementById("exp-all").onclick = () => names.forEach((n,i) => setTimeout(() => {
    const s = sheets[n]; download(`${n}-${hoyISO()}.csv`, csv(s.rows, s.headers));
  }, i*300));
}

function renderAll(){
  renderErrores(); renderCalificados(); renderCierres(); renderComisiones(); renderEntrantes(); renderExportar();
}

document.getElementById("hoy").textContent = new Date().toLocaleDateString("es", {weekday:"long", day:"numeric", month:"long"});
document.getElementById("cal-calif").value = hoyISO();
state = {...estadoVacio(), ...initialState, config: {...estadoVacio().config, ...(initialState.config || {})}};
renderAll();
}
