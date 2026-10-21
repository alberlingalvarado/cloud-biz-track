import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const HOJA_MAESTRO = "Maestro";
const HOJA_RESUMEN = "Resumen diario";

const CABECERAS = [
  "Fecha", "Agente", "Correo", "Tipo", "Nombre / categoría", "Link contacto", "Link HubSpot",
  "Plan", "Monto final", "Periodicidad", "Descuento", "Fecha de pago", "Fecha de calificación",
  "Fecha de registro", "Detalle", "Notas",
];
const CABECERAS_RESUMEN = [
  "Fecha", "Agente", "Correo", "Calificados", "Cierres ganados", "Monto ganados", "Cierres perdidos",
  "Errores de marcación", "Llamadas entrantes", "Soporte", "Sales", "Llamadas realizadas", "Minutos en cola",
];

/* Las filas llegan tal cual de la base de datos, así que se leen con acceso libre. */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Registro = any;
type Estado = {
  errores: Registro[];
  calificados: Registro[];
  cierres: Registro[];
  perdidos: Registro[];
  entrantes: Registro[];
  llamadasRealizadas: Record<string, number>;
};

const num = (v: unknown) => Number(v ?? 0) || 0;
const txt = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const redondeo = (n: number) => Math.round(n * 100) / 100;

/* Mismo cálculo que la app: monto menos el descuento escrito en la fila */
const neto = (c: Registro) => {
  const p = parseFloat(String(c.descuento ?? "").replace(",", "."));
  const pct = isNaN(p) ? 0 : p;
  return redondeo(num(c.monto) * (1 - pct / 100));
};

const fmtFecha = (f?: unknown) => {
  if (!f) return "";
  const [y, m, d] = String(f).split("-");
  return d && m && y ? `${d}/${m}/${y}` : String(f);
};
const notasTxt = (arr: unknown) =>
  (Array.isArray(arr) ? arr : []).map((n: any) => `${fmtFecha(n.fecha)}: ${txt(n.texto)}`).join(" | ");
const colaTxt = (min: number) => `${Math.floor((min || 0) / 60)}h ${(min || 0) % 60}m`;

/* "alberling.alvarado@alegra.com" -> "Alberling Alvarado" (válida como nombre de pestaña) */
function nombreDesdeCorreo(email: string) {
  const local = txt(email).split("@")[0] || "Agente";
  const nombre = local
    .split(/[._\-+]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return (nombre.replace(/[:\\/?[\]*]/g, " ").slice(0, 31).trim()) || "Agente";
}

function leerEstado(fila: Registro): Estado {
  return {
    errores: Array.isArray(fila.errores) ? fila.errores : [],
    calificados: Array.isArray(fila.calificados) ? fila.calificados : [],
    cierres: Array.isArray(fila.cierres) ? fila.cierres : [],
    perdidos: Array.isArray(fila.perdidos) ? fila.perdidos : [],
    entrantes: Array.isArray(fila.entrantes) ? fila.entrantes : [],
    llamadasRealizadas: fila.llamadas_realizadas && typeof fila.llamadas_realizadas === "object" ? fila.llamadas_realizadas : {},
  };
}

/* Misma regla que la app para contar calificados de un día (incluye los ya cerrados) */
function contarCalificados(e: Estado, f: string) {
  const ids = new Set(e.calificados.map((c) => c.id));
  return (
    e.calificados.filter((c) => c.fecha === f).length +
    e.cierres.filter((c) => !c.calId && c.fechaCalificacion === f).length +
    e.perdidos.filter((p) => !ids.has(p.id) && p.fecha === f).length
  );
}

function filasDeAgente(e: Estado, agente: string, correo: string) {
  const filas: (string | number)[][] = [];
  const base = (fecha: string, tipo: string) => [txt(fecha), agente, correo, tipo];

  e.errores.forEach((x) =>
    filas.push([
      ...base(x.fecha, "Error de marcación"), txt(x.categoria), txt(x.link), "", "", "", "", "", "", "", "", "",
      `Hora ${txt(x.hora)}${x.campana ? ` · Campaña: ${txt(x.campana)}` : ""}${x.nota ? ` · ${txt(x.nota)}` : ""}`, "",
    ]),
  );

  e.calificados.forEach((c) =>
    filas.push([
      ...base(c.fecha, "Calificado"), txt(c.nombre), txt(c.link), txt(c.hubspot), txt(c.plan), num(c.monto), "", "",
      txt(c.pagoFecha), txt(c.fecha), "",
      `${txt(c.recordatorio)}${c.estado ? ` · Estado: ${c.estado === "ganado" ? "cierre ganado" : "cierre perdido"}` : ""}`,
      notasTxt(c.notas),
    ]),
  );

  e.cierres.forEach((c) =>
    filas.push([
      ...base(c.fechaCierre, "Cierre ganado"), txt(c.nombre), txt(c.link), txt(c.hubspot), txt(c.plan), neto(c),
      txt(c.periodicidad), txt(c.descuento), txt(c.fechaCierre), txt(c.fechaCalificacion), txt(c.fechaRegistro), "",
      notasTxt(c.notas),
    ]),
  );

  e.perdidos.forEach((p) =>
    filas.push([
      ...base(p.fechaPerdido, "Cierre perdido"), txt(p.nombre), txt(p.link), txt(p.hubspot), txt(p.plan), "", "", "",
      "", txt(p.fecha), "", "", notasTxt(p.notas),
    ]),
  );

  e.entrantes.forEach((x) =>
    filas.push([
      ...base(x.fecha, "Llamada entrante"), txt(x.tipo), txt(x.link), "", "", "", "", "", "", "", "", "",
      `En cola ${colaTxt(num(x.colaMin))}`, "",
    ]),
  );

  Object.keys(e.llamadasRealizadas || {}).forEach((f) =>
    filas.push([
      ...base(f, "Llamadas realizadas"), "", "", "", "", "", "", "", "", "", "", "", `Total: ${num(e.llamadasRealizadas[f])}`, "",
    ]),
  );

  return filas.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

function resumenDeAgente(e: Estado, agente: string, correo: string) {
  const dias = new Set<string>();
  e.errores.forEach((x) => dias.add(txt(x.fecha)));
  e.calificados.forEach((x) => dias.add(txt(x.fecha)));
  e.cierres.forEach((x) => dias.add(txt(x.fechaCierre)));
  e.perdidos.forEach((x) => dias.add(txt(x.fechaPerdido)));
  e.entrantes.forEach((x) => dias.add(txt(x.fecha)));
  Object.keys(e.llamadasRealizadas || {}).forEach((f) => dias.add(f));
  dias.delete("");

  return [...dias].sort().map((f) => {
    const cie = e.cierres.filter((c) => c.fechaCierre === f);
    const ent = e.entrantes.filter((x) => x.fecha === f);
    const sop = ent.filter((x) => x.tipo === "Soporte").length;
    return [
      f, agente, correo,
      contarCalificados(e, f),
      cie.length,
      redondeo(cie.reduce((s, c) => s + neto(c), 0)),
      e.perdidos.filter((p) => p.fechaPerdido === f).length,
      e.errores.filter((x) => x.fecha === f).length,
      ent.length, sop, ent.length - sop,
      num(e.llamadasRealizadas[f]),
      ent.reduce((s, x) => s + num(x.colaMin), 0),
    ];
  });
}

async function sheets(path: string, method: "GET" | "POST", body?: unknown) {
  const clave = process.env["GOOGLE_SHEETS_API_KEY"];
  const api = process.env["LOVABLE_API_KEY"];
  if (!clave || !api) throw new Error("La conexión con Google Sheets no está disponible");
  const respuesta = await fetch(GATEWAY + path, {
    method,
    headers: {
      Authorization: `Bearer ${api}`,
      "X-Connection-Api-Key": clave,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    console.error(`Google Sheets ${method} ${path} -> ${respuesta.status}: ${detalle.slice(0, 400)}`);
    throw new Error(`Google no dejó escribir la hoja (${respuesta.status})`);
  }
  return (await respuesta.json()) as any;
}

const cotizar = (t: string) => `'${t.replace(/'/g, "''")}'`;
const letra = (n: number) => {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
const rango = (titulo: string, filas: number, columnas: number) =>
  `${cotizar(titulo)}!A1:${letra(columnas)}${Math.max(filas, 1)}`.replace(/ /g, "%20");

export const sincronizarSheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: cfg } = await context.supabase
        .from("sheets_config")
        .select("spreadsheet_id, spreadsheet_url")
        .eq("id", 1)
        .maybeSingle();
      if (!cfg?.spreadsheet_id) return { ok: false, error: "Todavía no hay un documento maestro guardado." };
      const id = cfg.spreadsheet_id;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [datos, usuarios] = await Promise.all([
        supabaseAdmin
          .from("gestion_datos")
          .select("user_id, errores, calificados, cierres, perdidos, entrantes, llamadas_realizadas"),
        supabaseAdmin.auth.admin.listUsers({ pageSize: 1000 }),
      ]);

      const correos = new Map<string, string>(
        (usuarios.data.users || []).map((u: any) => [u.id, u.email || ""]),
      );

      const maestro: (string | number)[][] = [];
      const resumen: (string | number)[][] = [];
      const porAgente = new Map<string, (string | number)[][]>();

      for (const fila of datos.data || []) {
        const correo = correos.get(fila.user_id) || "";
        const agente = nombreDesdeCorreo(correo);
        const e = leerEstado(fila);
        const filas = filasDeAgente(e, agente, correo);
        maestro.push(...filas);
        porAgente.set(agente, filas);
        resumen.push(...resumenDeAgente(e, agente, correo));
      }

      maestro.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
      resumen.sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])));

      const titulos = [HOJA_MAESTRO, HOJA_RESUMEN, ...[...porAgente.keys()]];
      const existentes: string[] = (await sheets(`/spreadsheets/${id}?fields=sheets.properties.title`, "GET"))
        .sheets?.map((s: any) => s.properties.title as string) || [];
      const faltantes = titulos.filter((t) => !existentes.includes(t));
      if (faltantes.length) {
        await sheets(`/spreadsheets/${id}:batchUpdate`, "POST", {
          requests: faltantes.map((t) => ({ addSheet: { properties: { title: t } } })),
        });
      }

      for (const t of titulos) {
        await sheets(`/spreadsheets/${id}/values/${cotizar(t)}!A1:Z10000:clear`, "POST", {});
      }

      const bloques = [
        { titulo: HOJA_MAESTRO, filas: [CABECERAS, ...maestro] },
        { titulo: HOJA_RESUMEN, filas: [CABECERAS_RESUMEN, ...resumen] },
        ...[...porAgente.entries()].map(([titulo, filas]) => ({ titulo, filas: [CABECERAS, ...filas] })),
      ];

      await sheets(`/spreadsheets/${id}/values:batchUpdate`, "POST", {
        valueInputOption: "RAW",
        data: bloques.map((b) => ({
          range: rango(b.titulo, b.filas.length, Math.max(CABECERAS.length, CABECERAS_RESUMEN.length)),
          values: b.filas,
        })),
      });

      return {
        ok: true,
        url: cfg.spreadsheet_url,
        filas: maestro.length,
        agentes: porAgente.size,
        dias: resumen.length,
      };
    } catch (err) {
      console.error("No se pudo enviar a Google Sheets:", err);
      return { ok: false, error: err instanceof Error ? err.message : "No se pudo enviar a Google Sheets" };
    }
  });
