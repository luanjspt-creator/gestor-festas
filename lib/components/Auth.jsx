import { useState } from "react";
import { supabase } from "../lib/supabase";

const T = {
  ink: "#1B2A4A", gold: "#C9A84C", goldSoft: "#E8DCB8", cream: "#FAF7F0",
  paper: "#FFFFFF", coral: "#E8654F", line: "#E5DFD2", muted: "#8A8474",
};

export default function Auth() {
  const [modo, setModo] = useState("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const submeter = async () => {
    setMsg(null);
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        setMsg({ tipo: "ok", texto: "Conta criada! Confirma o teu email e depois entra." });
      }
    } catch (e) {
      setMsg({ tipo: "erro", texto: e.message || "Algo correu mal. Tenta de novo." });
    }
    setCarregando(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", padding: 20 }}>
      <div style={{ background: T.paper, borderRadius: 18, padding: "32px 28px", maxWidth: 380, width: "100%", border: `1px solid ${T.line}`, boxShadow: "0 8px 30px rgba(27,42,74,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: T.gold, fontWeight: 700 }}>GESTOR DE FESTAS</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Planeta Festa · Vila Real</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
            {modo === "entrar" ? "Entra para gerir as tuas festas" : "Cria a tua conta"}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Email</div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={inp()} placeholder="o-teu@email.pt" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Senha</div>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submeter()}
            style={inp()} placeholder="mínimo 6 caracteres" />
        </div>

        {msg && (
          <div style={{ fontSize: 12.5, padding: "10px 12px", borderRadius: 8, marginBottom: 14,
            background: msg.tipo === "ok" ? "#E2EFDA" : "#FDECEA",
            color: msg.tipo === "ok" ? "#3E7C4F" : "#9B3030", fontWeight: 600 }}>
            {msg.texto}
          </div>
        )}

        <button onClick={submeter} disabled={carregando || !email || !senha}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none",
            background: carregando ? T.muted : T.ink, color: "#fff", fontWeight: 700, fontSize: 14,
            cursor: carregando ? "default" : "pointer", fontFamily: "inherit" }}>
          {carregando ? "Aguarda..." : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: T.muted }}>
          {modo === "entrar" ? "Ainda não tens conta? " : "Já tens conta? "}
          <button onClick={() => { setModo(modo === "entrar" ? "registar" : "entrar"); setMsg(null); }}
            style={{ border: "none", background: "none", color: T.coral, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
            {modo === "entrar" ? "Regista-te" : "Entra"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = () => ({ width: "100%", padding: "11px 12px", borderRadius: 9, border: `1px solid ${T.line}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: "#fff", color: T.ink });
