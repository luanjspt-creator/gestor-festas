import { supabase } from "./supabase";

function fromRow(row) {
  return {
    id: row.id,
    cliente: row.cliente || "",
    contacto: row.contacto || "",
    data: row.data || "",
    local: row.local || "",
    tema: row.tema || "",
    tipo: row.tipo || "",
    valor: Number(row.valor) || 0,
    sinal: Number(row.sinal) || 0,
    estado: row.estado || "Em negociação",
    briefing: row.briefing || { horaMontagem: "", horaFesta: "", endereco: "", obs: "" },
    checklist: row.checklist || [],
    gastos: row.gastos || [],
  };
}

function toRow(evento, userId) {
  return {
    user_id: userId,
    cliente: evento.cliente || "",
    contacto: evento.contacto || "",
    data: evento.data || null,
    local: evento.local || "",
    tema: evento.tema || "",
    tipo: evento.tipo || "",
    valor: Number(evento.valor) || 0,
    sinal: Number(evento.sinal) || 0,
    estado: evento.estado || "Em negociação",
    briefing: evento.briefing || { horaMontagem: "", horaFesta: "", endereco: "", obs: "" },
    checklist: evento.checklist || [],
    gastos: evento.gastos || [],
  };
}

export async function carregarEventos() {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .order("data", { ascending: true });
  if (error) { console.error("Erro ao carregar:", error); return []; }
  return (data || []).map(fromRow);
}

export async function criarEvento(evento) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Sem sessão");

  const { data, error } = await supabase
    .from("eventos")
    .insert(toRow(evento, userId))
    .select()
    .single();
  if (error) { console.error("Erro ao criar:", error); throw error; }
  return fromRow(data);
}

export async function atualizarEvento(id, mudancas) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data, error } = await supabase
    .from("eventos")
    .update(toRow({ ...mudancas }, userId))
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("Erro ao atualizar:", error); throw error; }
  return fromRow(data);
}

export async function apagarEvento(id) {
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  if (error) { console.error("Erro ao apagar:", error); throw error; }
}
