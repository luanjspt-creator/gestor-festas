import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "../lib/supabase";
import { carregarEventos, criarEvento, atualizarEvento, apagarEvento } from "../lib/eventos";

// ============ TOKENS ============
const T = {
  ink: "#1B2A4A", inkSoft: "#3D4E6E", gold: "#C9A84C", goldSoft: "#E8DCB8",
  cream: "#FAF7F0", paper: "#FFFFFF", coral: "#E8654F", green: "#3E7C4F",
  greenSoft: "#E2EFDA", line: "#E5DFD2", muted: "#8A8474",
};

const CHECKLIST_PADRAO = [
  "Painel / backdrop", "Balões (cores confirmadas)", "Bomba de encher balões",
  "Estrutura / suportes", "Fitas, arames e cola", "Mesa decorativa e toalha",
  "Peças do tema", "Ferramentas (tesoura, alicate, fita métrica)", "Escada",
  "Kit de emergência (balões extra)",
];

const CATEGORIAS_GASTO = ["Materiais", "Balões", "Deslocação", "Impressões", "Fornecedor", "Outro"];
const ESTADOS = ["Em negociação", "Confirmada", "Realizada", "Cancelada"];

const eur = (v) => "€" + (Number(v) || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtData = (iso) => { if (!iso) return "—"; const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; };
const custosDe = (e) => (e.gastos || []).reduce((s, g) => s + (Number(g.valor) || 0), 0);
const lucroDe = (e) => (Number(e.valor) || 0) - custosDe(e);
const mcDe = (e) => { const v = Number(e.valor) || 0; return v > 0 ? (lucroDe(e) / v) * 100 : 0; };
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function GestorDeFestas({ sessao }) {
  const [eventos, setEventos] = useState(null);
  const [tela, setTela] = useState("dashboard");
  const [eventoId, setEventoId] = useState(null);
  const [privado, setPrivado] = useState(false);

  const mv = (v) => (privado ? "€ ••••" : eur(v));

  useEffect(() => {
    (async () => {
      const dados = await carregarEventos();
      setEventos(dados);
    })();
  }, []);

  const recarregar = async () => {
    const dados = await carregarEventos();
    setEventos(dados);
  };

  const handleCriar = async (dados) => {
    const novo = await criarEvento({
      ...dados,
      valor: Number(dados.valor) || 0,
      sinal: Number(dados.sinal) || 0,
      briefing: { horaMontagem: "", horaFesta: "", endereco: dados.local || "", obs: "" },
      checklist: CHECKLIST_PADRAO.map((t, i) => ({ id: "c" + i, texto: t, feito: false })),
      gastos: [],
    });
    await recarregar();
    return novo;
  };

  const handleAtualizar = async (id, mudancas) => {
    // Atualização otimista local + persistência
    setEventos((prev) => prev.map((e) => (e.id === id ? { ...e, ...mudancas } : e)));
    const atual = eventos.find((e) => e.id === id);
    await atualizarEvento(id, { ...atual, ...mudancas });
  };

  const handleApagar = async (id) => {
    await apagarEvento(id);
    await recarregar();
  };

  const sair = async () => { await supabase.auth.signOut(); };

  if (eventos === null) {
    return (
      <div style={{ minHeight: "100vh", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", color: T.ink }}>
        A carregar os teus eventos...
      </div>
    );
  }

  const evento = eventos.find((e) => e.id === eventoId);

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", color: T.ink }}>
      {/* HEADER */}
      <div style={{ background: T.ink, padding: "18px 20px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: T.gold, fontWeight: 700 }}>GESTOR DE FESTAS</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>Planeta Festa · Vila Real</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setPrivado(!privado)} title={privado ? "Mostrar valores" : "Esconder valores (modo gravação)"}
                style={{ padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${privado ? T.gold : "rgba(255,255,255,0.3)"}`,
                  background: privado ? T.gold : "transparent", color: privado ? T.ink : "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                {privado ? "🙈 Modo privado" : "👁 Esconder valores"}
              </button>
              <button onClick={sair} title="Sair" style={{ padding: "8px 12px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Sair
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["dashboard", "Dashboard"], ["eventos", "Eventos"]].map(([id, label]) => (
              <button key={id} onClick={() => { setTela(id); setEventoId(null); }}
                style={{ padding: "10px 22px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                  fontFamily: "inherit", borderRadius: "10px 10px 0 0",
                  background: tela === id && !evento ? T.cream : "rgba(255,255,255,0.08)",
                  color: tela === id && !evento ? T.ink : "#fff" }}>{label}</button>
            ))}
            {evento && (
              <button style={{ padding: "10px 22px", border: "none", fontSize: 13, fontWeight: 700, fontFamily: "inherit", borderRadius: "10px 10px 0 0", background: T.cream, color: T.ink }}>
                {evento.cliente}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 60px" }}>
        {privado && (
          <div style={{ background: T.goldSoft, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#7A6320", marginBottom: 14, textAlign: "center" }}>
            🙈 Modo privado ativo · valores cobrados escondidos (custos continuam visíveis)
          </div>
        )}
        {evento ? (
          <TelaEvento evento={evento} onAtualizar={handleAtualizar} onApagar={handleApagar} voltar={() => { setEventoId(null); setTela("eventos"); }} mv={mv} privado={privado} />
        ) : tela === "dashboard" ? (
          <Dashboard eventos={eventos} abrirEvento={(id) => setEventoId(id)} mv={mv} privado={privado} />
        ) : (
          <ListaEventos eventos={eventos} onCriar={handleCriar} abrirEvento={(id) => setEventoId(id)} mv={mv} privado={privado} />
        )}
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ eventos, abrirEvento, mv, privado }) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const [mesSel, setMesSel] = useState(null);

  const ativos = eventos.filter((e) => e.estado !== "Cancelada" && e.data);

  const stats = useMemo(() => {
    const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7)); inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date(inicioSemana); fimSemana.setDate(inicioSemana.getDate() + 7);
    let semana = 0, mes = 0, ano = 0, mesAnterior = 0, anoAnterior = 0, custosAno = 0;
    const porMes = Array(12).fill(0);
    ativos.forEach((e) => {
      const d = new Date(e.data + "T12:00:00");
      const v = Number(e.valor) || 0;
      if (d >= inicioSemana && d < fimSemana) semana += v;
      if (d.getFullYear() === anoAtual) {
        ano += v; custosAno += custosDe(e); porMes[d.getMonth()] += v;
        if (d.getMonth() === hoje.getMonth()) mes += v;
        if (d.getMonth() === hoje.getMonth() - 1) mesAnterior += v;
      }
      if (d.getFullYear() === anoAtual - 1) anoAnterior += v;
    });
    const mesesComValor = porMes.map((v, i) => ({ v, i })).filter((x) => x.v > 0);
    const melhor = mesesComValor.length ? mesesComValor.reduce((a, b) => (b.v > a.v ? b : a)) : null;
    const pior = mesesComValor.length ? mesesComValor.reduce((a, b) => (b.v < a.v ? b : a)) : null;
    return { semana, mes, ano, mesAnterior, anoAnterior, porMes, melhor, pior, custosAno, lucroAno: ano - custosAno };
  }, [eventos]);

  const varMes = stats.mesAnterior > 0 ? ((stats.mes - stats.mesAnterior) / stats.mesAnterior) * 100 : null;
  const varAno = stats.anoAnterior > 0 ? ((stats.ano - stats.anoAnterior) / stats.anoAnterior) * 100 : null;
  const chartData = MESES.map((m, i) => ({ mes: m, valor: stats.porMes[i], idx: i }));

  const proximos = ativos
    .filter((e) => new Date(e.data + "T23:59:59") >= hoje && e.estado !== "Realizada")
    .sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5);

  const analiseMes = useMemo(() => {
    if (mesSel === null) return null;
    const doMes = ativos.filter((e) => {
      const d = new Date(e.data + "T12:00:00");
      return d.getFullYear() === anoAtual && d.getMonth() === mesSel;
    }).sort((a, b) => a.data.localeCompare(b.data));
    if (doMes.length === 0) return { doMes: [], topLucro: null, topMC: null };
    const comCustos = doMes.filter((e) => custosDe(e) > 0);
    const base = comCustos.length > 0 ? comCustos : doMes;
    const topLucro = base.reduce((a, b) => (lucroDe(b) > lucroDe(a) ? b : a));
    const topMC = base.reduce((a, b) => (mcDe(b) > mcDe(a) ? b : a));
    return { doMes, topLucro, topMC, semCustos: comCustos.length === 0 };
  }, [mesSel, eventos]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi rotulo="Esta semana" valor={mv(stats.semana)} />
        <Kpi rotulo={MESES_FULL[hoje.getMonth()]} valor={mv(stats.mes)} extra={varMes !== null && !privado ? cmp(varMes, "vs mês anterior") : null} />
        <Kpi rotulo={`Ano ${anoAtual}`} valor={mv(stats.ano)} extra={varAno !== null && !privado ? cmp(varAno, `vs ${anoAtual - 1}`) : null} destaque />
        <Kpi rotulo="Lucro do ano" valor={mv(stats.lucroAno)} sub={`custos: ${eur(stats.custosAno)}`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ ...cardStyle(), cursor: stats.melhor ? "pointer" : "default" }} onClick={() => stats.melhor && setMesSel(stats.melhor.i)}>
          <div style={rotuloStyle()}>🏆 Melhor mês</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{stats.melhor ? `${MESES_FULL[stats.melhor.i]} · ${mv(stats.melhor.v)}` : "Sem dados"}</div>
        </div>
        <div style={{ ...cardStyle(), cursor: stats.pior ? "pointer" : "default" }} onClick={() => stats.pior && setMesSel(stats.pior.i)}>
          <div style={rotuloStyle()}>📉 Mês mais fraco</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{stats.pior ? `${MESES_FULL[stats.pior.i]} · ${mv(stats.pior.v)}` : "Sem dados"}</div>
        </div>
      </div>

      <div style={{ ...cardStyle(), marginBottom: 20 }}>
        <div style={{ ...rotuloStyle(), marginBottom: 6 }}>Faturação mensal · {anoAtual}{privado ? " (valores escondidos)" : ""}</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Toca numa barra ou num mês para ver as festas e a análise de lucro daquele mês.</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tick={privado ? false : { fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
              {!privado && <Tooltip formatter={(v) => [eur(v), "Faturação"]} contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontFamily: "inherit", fontSize: 12 }} />}
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} onClick={(d) => d && setMesSel(d.idx)} cursor="pointer">
                {chartData.map((d, i) => (
                  <Cell key={i} fill={mesSel === i ? T.coral : stats.melhor && i === stats.melhor.i ? T.gold : T.ink} opacity={mesSel !== null && mesSel !== i ? 0.35 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          {MESES.map((m, i) => (
            <button key={m} onClick={() => setMesSel(mesSel === i ? null : i)}
              style={{ padding: "5px 11px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                border: mesSel === i ? `1.5px solid ${T.coral}` : `1px solid ${T.line}`,
                background: mesSel === i ? T.coral : stats.porMes[i] > 0 ? "#fff" : T.cream,
                color: mesSel === i ? "#fff" : stats.porMes[i] > 0 ? T.ink : T.muted }}>{m}</button>
          ))}
          {mesSel !== null && (
            <button onClick={() => setMesSel(null)} style={{ padding: "5px 11px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "none", background: "transparent", color: T.coral }}>× limpar</button>
          )}
        </div>
      </div>

      {analiseMes && (
        <div style={{ ...cardStyle(), marginBottom: 20, border: `1.5px solid ${T.coral}` }}>
          <div style={{ ...rotuloStyle(), marginBottom: 10, color: T.coral }}>
            Análise · {MESES_FULL[mesSel]} {anoAtual} · {analiseMes.doMes.length} festa{analiseMes.doMes.length !== 1 ? "s" : ""}
          </div>
          {analiseMes.doMes.length === 0 && <div style={{ fontSize: 13, color: T.muted }}>Sem festas registadas neste mês.</div>}
          {analiseMes.doMes.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ background: T.greenSoft, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: "uppercase" }}>💰 Maior lucro (€)</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{analiseMes.topLucro.cliente} · {analiseMes.topLucro.tema}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{privado ? "€ ••••" : eur(lucroDe(analiseMes.topLucro))}</div>
                </div>
                <div style={{ background: "#FDF3EC", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, letterSpacing: 1, textTransform: "uppercase" }}>📈 Melhor MC (%)</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{analiseMes.topMC.cliente} · {analiseMes.topMC.tema}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.coral }}>{mcDe(analiseMes.topMC).toFixed(1)}% de margem</div>
                </div>
              </div>
              {analiseMes.semCustos && (
                <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10, fontStyle: "italic" }}>
                  ⚠️ Nenhuma festa deste mês tem custos registados, por isso a MC aparece a 100%. Regista os gastos em cada evento para uma análise real.
                </div>
              )}
              {analiseMes.doMes.map((e) => (
                <div key={e.id} onClick={() => abrirEvento(e.id)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 4px", borderBottom: `1px solid ${T.line}`, cursor: "pointer" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {e.cliente} · {e.tema}
                      {e.id === analiseMes.topLucro.id && " 💰"}
                      {e.id === analiseMes.topMC.id && " 📈"}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.muted }}>{fmtData(e.data)} · {e.tipo}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    <div style={{ fontWeight: 800 }}>{mv(e.valor)}</div>
                    <div style={{ color: T.muted }}>custos {eur(custosDe(e))}</div>
                    <div style={{ color: T.green, fontWeight: 700 }}>
                      {privado ? "lucro € ••••" : `lucro ${eur(lucroDe(e))}`} · MC {mcDe(e).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div style={cardStyle()}>
        <div style={{ ...rotuloStyle(), marginBottom: 10 }}>Próximas festas</div>
        {proximos.length === 0 && <div style={{ fontSize: 13, color: T.muted }}>Sem festas agendadas. Hora de prospetar! 🎈</div>}
        {proximos.map((e) => {
          const feitos = (e.checklist || []).filter((c) => c.feito).length;
          const total = (e.checklist || []).length;
          return (
            <div key={e.id} onClick={() => abrirEvento(e.id)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: `1px solid ${T.line}`, cursor: "pointer" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.cliente} · {e.tema}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{fmtData(e.data)} · {e.local}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{mv(e.valor)}</div>
                <div style={{ fontSize: 11, color: total > 0 && feitos === total ? T.green : T.coral }}>checklist {feitos}/{total}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cmp(pct, rotulo) {
  const pos = pct >= 0;
  return <span style={{ color: pos ? T.green : T.coral, fontSize: 11, fontWeight: 700 }}>{pos ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% {rotulo}</span>;
}

function Kpi({ rotulo, valor, extra, sub, destaque }) {
  return (
    <div style={{ ...cardStyle(), background: destaque ? T.ink : T.paper }}>
      <div style={{ ...rotuloStyle(), color: destaque ? T.goldSoft : T.muted }}>{rotulo}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: destaque ? "#fff" : T.ink, margin: "2px 0" }}>{valor}</div>
      {extra && <div>{extra}</div>}
      {sub && <div style={{ fontSize: 11, color: destaque ? T.goldSoft : T.muted }}>{sub}</div>}
    </div>
  );
}

const cardStyle = () => ({ background: T.paper, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.line}` });
const rotuloStyle = () => ({ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: T.muted, fontWeight: 700 });

// ============ LISTA DE EVENTOS ============
function ListaEventos({ eventos, onCriar, abrirEvento, mv, privado }) {
  const [criando, setCriando] = useState(false);
  const [filtro, setFiltro] = useState("proximas");
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  const criar = async (dados) => {
    const novo = await onCriar(dados);
    setCriando(false);
    if (novo) abrirEvento(novo.id);
  };

  const filtrados = useMemo(() => {
    if (filtro === "proximas") {
      return eventos.filter((e) => e.data && new Date(e.data + "T23:59:59") >= hoje && e.estado !== "Cancelada")
        .sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6);
    }
    if (filtro === "ano") {
      return [...eventos].filter((e) => e.data && new Date(e.data + "T12:00:00").getFullYear() === anoAtual)
        .sort((a, b) => a.data.localeCompare(b.data));
    }
    return eventos.filter((e) => {
      if (!e.data) return false;
      const d = new Date(e.data + "T12:00:00");
      return d.getFullYear() === anoAtual && d.getMonth() === filtro;
    }).sort((a, b) => a.data.localeCompare(b.data));
  }, [eventos, filtro]);

  const rotuloFiltro = filtro === "proximas" ? "Próximas festas (a partir de hoje)" : filtro === "ano" ? `Ano ${anoAtual} completo` : `${MESES_FULL[filtro]} ${anoAtual}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Eventos</div>
        <button onClick={() => setCriando(true)} style={btnPrimario()}>+ Nova festa</button>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
        <ChipFiltro ativo={filtro === "proximas"} onClick={() => setFiltro("proximas")} destaque>⏭ Próximas</ChipFiltro>
        <ChipFiltro ativo={filtro === "ano"} onClick={() => setFiltro("ano")}>Ano inteiro</ChipFiltro>
        {MESES.map((m, i) => (<ChipFiltro key={m} ativo={filtro === i} onClick={() => setFiltro(i)}>{m}</ChipFiltro>))}
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
        {rotuloFiltro} · {filtrados.length} evento{filtrados.length !== 1 ? "s" : ""}{filtro === "proximas" && " · máx. 6"}
      </div>

      {criando && <FormEvento onGuardar={criar} onCancelar={() => setCriando(false)} />}

      {filtrados.length === 0 && !criando && (
        <div style={{ ...cardStyle(), textAlign: "center", color: T.muted, fontSize: 13.5 }}>
          {filtro === "proximas" ? "Sem festas futuras agendadas. Adiciona uma nova festa ou verifica os meses anteriores. 🎈" : "Sem festas neste período."}
        </div>
      )}

      {filtrados.map((e) => {
        const custos = custosDe(e);
        const falta = (Number(e.valor) || 0) - (Number(e.sinal) || 0);
        return (
          <div key={e.id} onClick={() => abrirEvento(e.id)}
            style={{ ...cardStyle(), marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{e.cliente}</span>
                <Badge estado={e.estado} />
              </div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{e.tema} · {e.tipo}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{fmtData(e.data)} · {e.local}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{mv(e.valor)}</div>
              {falta > 0 && e.estado !== "Cancelada" && !privado && <div style={{ fontSize: 11, color: T.coral, fontWeight: 700 }}>falta {eur(falta)}</div>}
              {custos > 0 && !privado && <div style={{ fontSize: 11, color: T.muted }}>lucro {eur(lucroDe(e))} · MC {mcDe(e).toFixed(0)}%</div>}
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 12, color: T.muted, marginTop: 12 }}>
        Dica: para reconciliar o ano, adiciona as festas passadas com a data original e o estado "Realizada". Usa os filtros de mês para conferir.
      </div>
    </div>
  );
}

function ChipFiltro({ ativo, onClick, children, destaque }) {
  return (
    <button onClick={onClick}
      style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        border: ativo ? `1.5px solid ${destaque ? T.coral : T.ink}` : `1px solid ${T.line}`,
        background: ativo ? (destaque ? T.coral : T.ink) : "#fff", color: ativo ? "#fff" : T.inkSoft }}>{children}</button>
  );
}

function Badge({ estado }) {
  const cores = { "Em negociação": [T.goldSoft, "#7A6320"], "Confirmada": [T.greenSoft, T.green], "Realizada": ["#DCE6F5", T.ink], "Cancelada": ["#F5DCDC", "#9B3030"] };
  const [bg, fg] = cores[estado] || [T.line, T.inkSoft];
  return <span style={{ fontSize: 10.5, fontWeight: 700, background: bg, color: fg, padding: "2px 8px", borderRadius: 99 }}>{estado}</span>;
}

function FormEvento({ onGuardar, onCancelar, inicial }) {
  const [f, setF] = useState(inicial || { cliente: "", contacto: "", data: "", local: "", tema: "", tipo: "", valor: "", sinal: "", estado: "Em negociação" });
  const [aguardar, setAguardar] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });
  const guardar = async () => { if (!f.cliente) return; setAguardar(true); await onGuardar(f); setAguardar(false); };
  return (
    <div style={{ ...cardStyle(), marginBottom: 14, background: "#FFFDF7", border: `1.5px solid ${T.gold}` }}>
      <div style={{ ...rotuloStyle(), marginBottom: 10 }}>{inicial ? "Editar festa" : "Nova festa"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Campo rotulo="Cliente" valor={f.cliente} onChange={(v) => set("cliente", v)} />
        <Campo rotulo="WhatsApp" valor={f.contacto} onChange={(v) => set("contacto", v)} />
        <Campo rotulo="Data" tipo="date" valor={f.data} onChange={(v) => set("data", v)} />
        <Campo rotulo="Localidade" valor={f.local} onChange={(v) => set("local", v)} />
        <Campo rotulo="Tema" valor={f.tema} onChange={(v) => set("tema", v)} />
        <Campo rotulo="Tipo de serviço" valor={f.tipo} onChange={(v) => set("tipo", v)} />
        <Campo rotulo="Valor total (€)" tipo="number" valor={f.valor} onChange={(v) => set("valor", v)} />
        <Campo rotulo="Sinal pago (€)" tipo="number" valor={f.sinal} onChange={(v) => set("sinal", v)} />
        <div>
          <div style={campoRotulo()}>Estado</div>
          <select value={f.estado} onChange={(e) => set("estado", e.target.value)} style={inputStyle()}>
            {ESTADOS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={guardar} disabled={aguardar} style={btnPrimario()}>{aguardar ? "A guardar..." : "Guardar festa"}</button>
        <button onClick={onCancelar} style={btnSecundario()}>Cancelar</button>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, onChange, tipo = "text" }) {
  return (
    <div>
      <div style={campoRotulo()}>{rotulo}</div>
      <input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} style={inputStyle()} />
    </div>
  );
}

const campoRotulo = () => ({ fontSize: 11, fontWeight: 700, color: T.inkSoft, marginBottom: 3 });
const inputStyle = () => ({ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${T.line}`, fontSize: 13.5, fontFamily: "inherit", boxSizing: "border-box", background: "#fff", color: T.ink });
const btnPrimario = () => ({ padding: "10px 18px", borderRadius: 10, border: "none", background: T.ink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" });
const btnSecundario = () => ({ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.line}`, background: "#fff", color: T.inkSoft, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" });

// ============ TELA DO EVENTO ============
function TelaEvento({ evento, onAtualizar, onApagar, voltar, mv, privado }) {
  const [aba, setAba] = useState("resumo");
  const [editando, setEditando] = useState(false);
  const [novoItem, setNovoItem] = useState("");
  const [novoGasto, setNovoGasto] = useState({ desc: "", cat: "Materiais", valor: "" });

  const atualizar = (mudancas) => onAtualizar(evento.id, mudancas);
  const apagar = async () => {
    if (confirm(`Apagar a festa de ${evento.cliente}? Esta ação não pode ser desfeita.`)) {
      await onApagar(evento.id);
      voltar();
    }
  };

  const custos = custosDe(evento);
  const lucro = lucroDe(evento);
  const mc = mcDe(evento);
  const falta = (Number(evento.valor) || 0) - (Number(evento.sinal) || 0);
  const feitos = (evento.checklist || []).filter((c) => c.feito).length;
  const totalCheck = (evento.checklist || []).length;

  return (
    <div>
      <button onClick={voltar} style={{ ...btnSecundario(), marginBottom: 14 }}>← Voltar aos eventos</button>

      <div style={{ ...cardStyle(), marginBottom: 14, background: T.ink, color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{evento.cliente}</div>
            <div style={{ fontSize: 13, color: T.goldSoft }}>{evento.tema} · {fmtData(evento.data)} · {evento.local}</div>
            <div style={{ marginTop: 6 }}><Badge estado={evento.estado} /></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.gold }}>{mv(evento.valor)}</div>
            {!privado && (
              <div style={{ fontSize: 12, color: falta > 0 ? "#F5C6B8" : "#B8E5C0" }}>{falta > 0 ? `falta receber ${eur(falta)}` : "totalmente pago ✓"}</div>
            )}
            <div style={{ fontSize: 12, color: T.goldSoft }}>lucro: {privado ? "€ ••••" : eur(lucro)} · MC {mc.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["resumo", "Resumo"], ["briefing", "Briefing"], ["checklist", `Checklist ${feitos}/${totalCheck}`], ["gastos", `Gastos ${eur(custos)}`]].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)}
            style={{ padding: "8px 16px", borderRadius: 99, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              border: aba === id ? `1.5px solid ${T.ink}` : `1px solid ${T.line}`,
              background: aba === id ? T.ink : "#fff", color: aba === id ? "#fff" : T.inkSoft }}>{label}</button>
        ))}
      </div>

      {aba === "resumo" && !editando && (
        <div style={cardStyle()}>
          <Linha r="Cliente" v={evento.cliente} />
          <Linha r="WhatsApp" v={evento.contacto || "—"} />
          <Linha r="Data" v={fmtData(evento.data)} />
          <Linha r="Localidade" v={evento.local} />
          <Linha r="Tema" v={evento.tema} />
          <Linha r="Tipo de serviço" v={evento.tipo} />
          <Linha r="Valor total" v={mv(evento.valor)} />
          <Linha r="Sinal pago" v={privado ? "€ ••••" : eur(evento.sinal)} />
          <Linha r="Falta receber" v={privado ? "€ ••••" : eur(falta)} cor={falta > 0 ? T.coral : T.green} />
          <Linha r="Custos" v={eur(custos)} />
          <Linha r="Lucro previsto" v={privado ? "€ ••••" : eur(lucro)} cor={T.green} />
          <Linha r="Margem de contribuição" v={mc.toFixed(1) + "%"} cor={mc >= 50 ? T.green : mc >= 30 ? T.gold : T.coral} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => setEditando(true)} style={btnPrimario()}>Editar dados</button>
            <button onClick={apagar} style={{ ...btnSecundario(), color: "#9B3030" }}>Apagar festa</button>
          </div>
        </div>
      )}
      {aba === "resumo" && editando && (
        <FormEvento inicial={{ cliente: evento.cliente, contacto: evento.contacto, data: evento.data, local: evento.local, tema: evento.tema, tipo: evento.tipo, valor: evento.valor, sinal: evento.sinal, estado: evento.estado }}
          onGuardar={async (f) => { await atualizar({ ...f, valor: Number(f.valor) || 0, sinal: Number(f.sinal) || 0 }); setEditando(false); }}
          onCancelar={() => setEditando(false)} />
      )}

      {aba === "briefing" && (
        <div style={cardStyle()}>
          <div style={{ ...rotuloStyle(), marginBottom: 12 }}>Briefing do evento</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Campo rotulo="Hora de montagem" tipo="time" valor={evento.briefing?.horaMontagem || ""} onChange={(v) => atualizar({ briefing: { ...evento.briefing, horaMontagem: v } })} />
            <Campo rotulo="Hora da festa" tipo="time" valor={evento.briefing?.horaFesta || ""} onChange={(v) => atualizar({ briefing: { ...evento.briefing, horaFesta: v } })} />
          </div>
          <Campo rotulo="Endereço completo" valor={evento.briefing?.endereco || ""} onChange={(v) => atualizar({ briefing: { ...evento.briefing, endereco: v } })} />
          <div style={{ marginTop: 10 }}>
            <div style={campoRotulo()}>Observações (cores, pedidos especiais, acesso ao local...)</div>
            <textarea value={evento.briefing?.obs || ""} onChange={(e) => atualizar({ briefing: { ...evento.briefing, obs: e.target.value } })} rows={5} style={{ ...inputStyle(), resize: "vertical" }} />
          </div>
        </div>
      )}

      {aba === "checklist" && (
        <div style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={rotuloStyle()}>Checklist de montagem</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: totalCheck > 0 && feitos === totalCheck ? T.green : T.coral }}>
              {totalCheck > 0 && feitos === totalCheck ? "✓ Tudo pronto!" : `${totalCheck - feitos} por confirmar`}
            </div>
          </div>
          {(evento.checklist || []).map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 2px", borderBottom: `1px solid ${T.line}` }}>
              <input type="checkbox" checked={item.feito}
                onChange={() => atualizar({ checklist: evento.checklist.map((c) => (c.id === item.id ? { ...c, feito: !c.feito } : c)) })}
                style={{ width: 18, height: 18, accentColor: T.green, cursor: "pointer" }} />
              <span style={{ flex: 1, fontSize: 14, textDecoration: item.feito ? "line-through" : "none", color: item.feito ? T.muted : T.ink }}>{item.texto}</span>
              <button onClick={() => atualizar({ checklist: evento.checklist.filter((c) => c.id !== item.id) })}
                style={{ border: "none", background: "none", color: T.muted, cursor: "pointer", fontSize: 15 }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={novoItem} onChange={(e) => setNovoItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && novoItem.trim()) { atualizar({ checklist: [...(evento.checklist || []), { id: "c" + Date.now(), texto: novoItem.trim(), feito: false }] }); setNovoItem(""); } }}
              placeholder="Adicionar item (ex: luzes LED, tapete...)" style={inputStyle()} />
            <button onClick={() => { if (novoItem.trim()) { atualizar({ checklist: [...(evento.checklist || []), { id: "c" + Date.now(), texto: novoItem.trim(), feito: false }] }); setNovoItem(""); } }} style={btnPrimario()}>+</button>
          </div>
        </div>
      )}

      {aba === "gastos" && (
        <div style={cardStyle()}>
          <div style={{ ...rotuloStyle(), marginBottom: 12 }}>Gastos deste evento</div>
          {(evento.gastos || []).length === 0 && <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>Ainda sem gastos registados.</div>}
          {(evento.gastos || []).map((g) => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 2px", borderBottom: `1px solid ${T.line}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{g.desc}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{g.cat}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{eur(g.valor)}</span>
                <button onClick={() => atualizar({ gastos: evento.gastos.filter((x) => x.id !== g.id) })}
                  style={{ border: "none", background: "none", color: T.muted, cursor: "pointer", fontSize: 15 }}>×</button>
              </div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr auto", gap: 8, marginTop: 12, alignItems: "end" }}>
            <div>
              <div style={campoRotulo()}>Descrição</div>
              <input value={novoGasto.desc} onChange={(e) => setNovoGasto({ ...novoGasto, desc: e.target.value })} placeholder="Balões dourados" style={inputStyle()} />
            </div>
            <div>
              <div style={campoRotulo()}>Categoria</div>
              <select value={novoGasto.cat} onChange={(e) => setNovoGasto({ ...novoGasto, cat: e.target.value })} style={inputStyle()}>
                {CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={campoRotulo()}>Valor €</div>
              <input type="number" value={novoGasto.valor} onChange={(e) => setNovoGasto({ ...novoGasto, valor: e.target.value })} style={inputStyle()} />
            </div>
            <button onClick={() => {
              if (novoGasto.desc && novoGasto.valor) {
                atualizar({ gastos: [...(evento.gastos || []), { id: "g" + Date.now(), ...novoGasto, valor: Number(novoGasto.valor) }] });
                setNovoGasto({ desc: "", cat: "Materiais", valor: "" });
              }
            }} style={btnPrimario()}>+</button>
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: T.greenSoft, borderRadius: 10, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, flexWrap: "wrap", gap: 6 }}>
            <span>Total de gastos: {eur(custos)}</span>
            <span style={{ color: T.green }}>Lucro: {privado ? "€ ••••" : eur(lucro)} · MC {mc.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Linha({ r, v, cor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 2px", borderBottom: `1px solid ${T.line}`, fontSize: 14 }}>
      <span style={{ color: T.muted, fontWeight: 600 }}>{r}</span>
      <span style={{ fontWeight: 700, color: cor || T.ink }}>{v}</span>
    </div>
  );
}

