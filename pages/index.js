import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Auth from "../components/Auth";
import GestorDeFestas from "../components/GestorDeFestas";

export default function Home() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (carregando) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>A carregar...</div>;
  }
  if (!sessao) return <Auth />;
  return <GestorDeFestas sessao={sessao} />;
}
