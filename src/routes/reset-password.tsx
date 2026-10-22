import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import "@/legacy/gestion.css";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña · Gestión diaria" },
      { name: "description", content: "Crea una nueva contraseña para tu cuenta de Gestión diaria." },
      { property: "og:title", content: "Nueva contraseña · Gestión diaria" },
      { property: "og:description", content: "Crea una nueva contraseña para tu cuenta de Gestión diaria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: NuevaClave,
});

function NuevaClave() {
  const [listo, setListo] = useState(false);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === "PASSWORD_RECOVERY" || s) setListo(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setListo(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass !== pass2) { setMsg("Las contraseñas no coinciden."); return; }
    setCargando(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ password: pass });
    setCargando(false);
    if (error) { setMsg("No se pudo cambiar la contraseña. Pide un enlace nuevo e intenta otra vez."); return; }
    setMsg("Contraseña actualizada. Entrando…");
    setTimeout(() => { window.location.href = "/"; }, 1200);
  };

  return (
    <>
      <header><h1>Gestión diaria</h1></header>
      <main style={{ maxWidth: 420 }}>
        <form className="card" onSubmit={guardar}>
          <h2>Nueva contraseña</h2>
          {!listo ? (
            <p className="meta">Abre esta página desde el enlace que te llegó al correo. Si ya venció, pide uno nuevo en “¿Olvidaste tu contraseña?”.</p>
          ) : (
            <>
              <div className="row"><input type="password" required minLength={6} placeholder="Nueva contraseña" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
              <div className="row" style={{ marginTop: 8 }}><input type="password" required minLength={6} placeholder="Repite la contraseña" value={pass2} onChange={(e) => setPass2(e.target.value)} /></div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="primary" type="submit" disabled={cargando}>Guardar contraseña</button>
              </div>
            </>
          )}
          {msg && <p className="meta" style={{ marginTop: 8 }}>{msg}</p>}
          <p className="meta" style={{ marginTop: 10 }}><a href="/">Volver a iniciar sesión</a></p>
        </form>
      </main>
    </>
  );
}
