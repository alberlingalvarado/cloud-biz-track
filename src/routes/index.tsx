import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import "@/legacy/gestion.css";
import { MARKUP as MARKUP_HTML, initGestion, estadoVacio } from "@/legacy/gestion";
import { useServerFn } from "@tanstack/react-start";
import { sincronizarSheets } from "@/lib/sheets.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestión diaria" },
      { name: "description", content: "Registro diario de errores, calificados, cierres, comisiones y llamadas." },
      { property: "og:title", content: "Gestión diaria" },
      { property: "og:description", content: "Registro diario de errores, calificados, cierres, comisiones y llamadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: Index,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Estado = any;

function aFila(s: Estado, userId: string) {
  return {
    user_id: userId,
    cats: s.cats,
    errores: s.errores,
    calificados: s.calificados,
    cierres: s.cierres,
    perdidos: s.perdidos,
    entrantes: s.entrantes,
    llamadas_realizadas: s.llamadasRealizadas,
    metas: s.metas,
    config: s.config,
    updated_at: new Date().toISOString(),
  };
}
function deFila(r: any): Estado {
  return {
    cats: r.cats,
    errores: r.errores,
    calificados: r.calificados,
    cierres: r.cierres,
    perdidos: r.perdidos,
    entrantes: r.entrantes,
    llamadasRealizadas: r.llamadas_realizadas,
    metas: r.metas,
    config: r.config,
  };
}

function Index() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const actual = useRef<string | null>(null);
  useEffect(() => {
    const aplicar = (s: Session | null) => {
      const id = s?.user.id ?? null;
      // Evita volver a renderizar al refrescarse el token: solo cambia si cambia la cuenta.
      if (actual.current === id && id !== null) return;
      actual.current = id;
      setSession(s);
    };
    const { data } = supabase.auth.onAuthStateChange((_e, s) => aplicar(s));
    supabase.auth.getSession().then(({ data }) => aplicar(data.session));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <main><p className="meta">Cargando…</p></main>;
  if (!session) return <Acceso />;
  return <App key={session.user.id} userId={session.user.id} email={session.user.email ?? ""} />;
}


function Acceso() {
  const [modo, setModo] = useState<"entrar" | "registro" | "olvido">("entrar");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setCargando(true);
    const correo = email.trim().toLowerCase();
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email: correo, password: pass });
      if (error) setMsg("Correo o contraseña incorrectos. Si no recuerdas la contraseña, usa “¿Olvidaste tu contraseña?”.");
    } else if (modo === "olvido") {
      const { error } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo: `${window.location.origin}/reset-password` });
      setMsg(error ? "No se pudo enviar el correo. Intenta de nuevo en un minuto." : "Te enviamos un correo con un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.");
    } else {
      const { data, error } = await supabase.auth.signUp({ email: correo, password: pass, options: { emailRedirectTo: window.location.origin } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
    }
    setCargando(false);
  };
  const cambiar = (m: typeof modo) => (e: React.MouseEvent) => { e.preventDefault(); setMsg(""); setModo(m); };
  return (
    <>
      <header><h1>Gestión diaria</h1></header>
      <main style={{ maxWidth: 420 }}>
        <form className="card" onSubmit={enviar}>
          <h2>{modo === "entrar" ? "Iniciar sesión" : modo === "olvido" ? "Recuperar contraseña" : "Crear cuenta"}</h2>
          <div className="row"><input type="email" required placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {modo !== "olvido" && (
            <div className="row" style={{ marginTop: 8 }}><input type="password" required minLength={6} placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
          )}
          {msg && <p className="meta" style={{ marginTop: 8 }}>{msg}</p>}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="primary" type="submit" disabled={cargando}>
              {modo === "entrar" ? "Entrar" : modo === "olvido" ? "Enviar enlace" : "Crear cuenta"}
            </button>
          </div>
          {modo === "entrar" && (
            <p className="meta" style={{ marginTop: 10 }}>
              <a href="#" onClick={cambiar("olvido")}>¿Olvidaste tu contraseña?</a>
            </p>
          )}
          <p className="meta" style={{ marginTop: 10 }}>
            {modo === "entrar" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <a href="#" onClick={cambiar(modo === "entrar" ? "registro" : "entrar")}>
              {modo === "entrar" ? "Crear cuenta" : "Iniciar sesión"}
            </a>
          </p>
        </form>
      </main>
    </>
  );
}

function App({ userId, email }: { userId: string; email: string }) {
  const [fase, setFase] = useState<"cargando" | "primera" | "lista">("cargando");
  const [urlMaestro, setUrlMaestro] = useState("");
  const enviar = useServerFn(sincronizarSheets);
  const datos = useRef<Estado>({});
  const iniciado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendiente = useRef<Estado | null>(null);
  const aviso = useRef<HTMLSpanElement | null>(null);

  // El aviso se escribe directo en el DOM: así la app no se vuelve a dibujar
  // al guardar y nunca se pierden los botones de las pestañas.
  const setAviso = (t: string) => { if (aviso.current) aviso.current.textContent = t ? " · " + t : ""; };

  const guardar = async (s: Estado) => {
    setAviso("Guardando…");
    const { error } = await supabase.from("gestion_datos").upsert(aFila(s, userId) as any);
    setAviso(error ? "No se pudo guardar en la nube" : "Guardado en la nube");
  };
  const onSave = (s: Estado) => {
    pendiente.current = JSON.parse(JSON.stringify(s));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { const p = pendiente.current; pendiente.current = null; if (p) guardar(p); }, 500);
  };
  // Antes de enviar a Google Sheets se escribe lo que quede pendiente, para que
  // la hoja refleje exactamente lo que se ve en pantalla.
  const onSync = async () => {
    const p = pendiente.current;
    if (p) {
      pendiente.current = null;
      if (timer.current) clearTimeout(timer.current);
      await guardar(p);
    }
    return await enviar();
  };

  // Aviso dentro de la tarjeta de Google Sheets, sin recargar nada.
  const avisa = (r: unknown) => {
    const t = document.getElementById("gs-estado");
    const x = r as { ok?: boolean; filas?: number; agentes?: number };
    if (t && x.ok) {
      const n = x.agentes ?? 0;
      t.textContent = `Actualizado en Google Sheets: ${x.filas ?? 0} filas de ${n} ${n === 1 ? "agente" : "agentes"}.`;
    }
  };

  useEffect(() => {
    supabase.from("gestion_datos").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data) {
        datos.current = deFila(data);
        setFase("lista");
        // Al abrir la app se manda el día a Google Sheets sin que nadie lo pida.
        onSync().then(avisa).catch(() => {});
      }
      else setFase("primera");
    });
    supabase.from("sheets_config").select("spreadsheet_url").eq("id", 1).maybeSingle()
      .then(({ data }) => setUrlMaestro(data?.spreadsheet_url ?? ""));
    const flush = () => { const p = pendiente.current; if (p) { pendiente.current = null; guardar(p); } };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [userId]);

  // Si React volviera a crear este contenedor, se reconstruye la app completa
  // (markup + eventos), en lugar de quedar con botones muertos.
  const montar = (nodo: HTMLDivElement | null) => {
    if (!nodo || nodo.dataset["listo"] === "1") return;
    nodo.dataset["listo"] = "1";
    nodo.innerHTML = MARKUP_HTML;
    iniciado.current = true;
    initGestion(datos.current, onSave, { onSync, sheetsUrl: urlMaestro });
  };

  // El enlace vive dentro de la interfaz antigua, así que se actualiza a mano
  // cuando la dirección del documento maestro llega después de abrir la app.
  useEffect(() => {
    const a = document.getElementById("gs-abrir") as HTMLAnchorElement | null;
    if (a && urlMaestro) a.href = urlMaestro;
  }, [urlMaestro, fase]);

  const empezar = async (inicial: Estado) => {
    const s = { ...estadoVacio(), ...inicial, config: { ...estadoVacio().config, ...(inicial.config || {}) } };
    await guardar(s);
    datos.current = s;
    setFase("lista");
  };
  const importar = async (f?: File) => {
    if (!f) return;
    try { await empezar(JSON.parse(await f.text())); }
    catch { alert("Ese archivo no es un respaldo válido."); }
  };
  const salir = async () => {
    const p = pendiente.current; if (p) { pendiente.current = null; await guardar(p); }
    await supabase.auth.signOut();
    window.location.reload();
  };

  const barra = (
    <div className="meta" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "8px 16px 0" }}>
      <span>{email}<span ref={aviso} /></span>
      <button className="small" onClick={salir}>Cerrar sesión</button>
    </div>
  );

  if (fase === "cargando") return <>{barra}<main><p className="meta">Cargando tus datos…</p></main></>;
  if (fase === "primera") return (
    <>
      {barra}
      <header><h1>Gestión diaria</h1></header>
      <main>
        <div className="card">
          <h2>Bienvenido</h2>
          <p className="meta">Si ya usabas la app, importa tu respaldo .json para cargar tu historial anterior.</p>
          <div style={{ marginTop: 8 }}><label className="meta">Importar respaldo .json <input type="file" accept=".json,application/json" onChange={(e) => importar(e.target.files?.[0])} /></label></div>
          <div style={{ marginTop: 10 }}><button onClick={() => empezar({})}>Empezar sin datos</button></div>
        </div>
      </main>
    </>
  );
  return <>{barra}<div suppressHydrationWarning ref={montar} /></>;
}

