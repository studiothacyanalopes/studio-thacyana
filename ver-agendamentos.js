// Importar cliente do Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lbymovgulispjtxuilyc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieW1vdmd1bGlzcGp0eHVpbHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTM5NTMsImV4cCI6MjA3NTE2OTk1M30.-w8GHaxKalnae1WdrKdScbHU_hbLqRerw3ZFJQ7CxaM";
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
  const tabelaBody = document.querySelector("#tabela-agendamentos tbody");
  const filtroMes = document.getElementById("filtro-mes");
  const mensagem = document.getElementById("mensagem");

  async function carregarAgendamentos() {
    const { data: agendamentos, error } = await supabase.from("agendamentos").select("*");

    if (error) {
      mensagem.textContent = "Erro ao carregar os agendamentos!";
      return;
    }

    let filtro = filtroMes.value;
    let dadosFiltrados = agendamentos;

    if (filtro) {
      dadosFiltrados = agendamentos.filter(a => {
        const mes = new Date(a.data).getMonth() + 1;
        return mes == filtro;
      });
    }

    tabelaBody.innerHTML = "";

    if (dadosFiltrados.length === 0) {
      tabelaBody.innerHTML = `<tr><td colspan="5">Nenhum agendamento encontrado</td></tr>`;
      return;
    }

    dadosFiltrados.forEach(a => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.nome}</td>
        <td>${a.whatsapp}</td>
        <td>${a.servico}</td>
        <td>${a.data}</td>
        <td>${a.hora}</td>
      `;
      tabelaBody.appendChild(tr);
    });
  }

  filtroMes.addEventListener("change", carregarAgendamentos);
  carregarAgendamentos();
});
