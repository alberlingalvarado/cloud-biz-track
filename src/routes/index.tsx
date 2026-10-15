import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import "@/legacy/gestion.css";

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

type Estado = Record<string, any>;

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
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <main><p className="meta">Cargando…</p></main>;
  if (!session) return <Acceso />;
  return <App key={session.user.id} userId={session.user.id} email={session.user.email ?? ""} />;
}

function Acceso() {
  const [modo, setModo] = useState<"entrar" | "registro">("entrar");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setCargando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setMsg("Correo o contraseña incorrectos.");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: window.location.origin } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
    }
    setCargando(false);
  };
  return (
    <>
      <header><h1>Gestión diaria</h1></header>
      <main style={{ maxWidth: 420 }}>
        <form className="card" onSubmit={enviar}>
          <h2>{modo === "entrar" ? "Iniciar sesión" : "Crear cuenta"}</h2>
          <div className="row"><input type="email" required placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="row" style={{ marginTop: 8 }}><input type="password" required minLength={6} placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
          {msg && <p className="meta" style={{ marginTop: 8 }}>{msg}</p>}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="primary" type="submit" disabled={cargando}>{modo === "entrar" ? "Entrar" : "Crear cuenta"}</button>
          </div>
          <p className="meta" style={{ marginTop: 10 }}>
            {modo === "entrar" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <a href="#" onClick={(e) => { e.preventDefault(); setMsg(""); setModo(modo === "entrar" ? "registro" : "entrar"); }}>
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
  const [estadoGuardado, setEstadoGuardado] = useState("");
  const datos = useRef<Estado>({});
  const iniciado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendiente = useRef<Estado | null>(null);

  const guardar = async (s: Estado) => {
    setEstadoGuardado("Guardando…");
    const { error } = await supabase.from("gestion_datos").upsert(aFila(s, userId) as any);
    setEstadoGuardado(error ? "No se pudo guardar en la nube" : "Guardado en la nube");
  };
  const onSave = (s: Estado) => {
    pendiente.current = JSON.parse(JSON.stringify(s));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { const p = pendiente.current; pendiente.current = null; if (p) guardar(p); }, 500);
  };

  useEffect(() => {
    supabase.from("gestion_datos").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data) { datos.current = deFila(data); setFase("lista"); }
      else setFase("primera");
    });
    const flush = () => { const p = pendiente.current; if (p) { pendiente.current = null; guardar(p); } };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [userId]);

  useEffect(() => {
    if (fase !== "lista" || iniciado.current) return;
    iniciado.current = true;
    import("@/legacy/gestion").then(({ initGestion }) => initGestion(datos.current, onSave));
  }, [fase]);

  const empezar = async (inicial: Estado) => {
    const { initGestion: _i, ...rest } = {} as any; void _i; void rest;
    const { estadoVacio } = await import("@/legacy/gestion");
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
      <span>{email}{estadoGuardado ? " · " + estadoGuardado : ""}</span>
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
  return <>{barra}<div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MARKUP_HTML }} /></>;
}

import { MARKUP as MARKUP_HTML } from "@/legacy/gestion";
