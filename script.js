// Importar cliente do Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lbymovgulispjtxuilyc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieW1vdmd1bGlzcGp0eHVpbHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTM5NTMsImV4cCI6MjA3NTE2OTk1M30.-w8GHaxKalnae1WdrKdScbHU_hbLqRerw3ZFJQ7CxaM";
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-agendamento");
  const dataInput = document.getElementById("data");
  const horarioSelect = document.getElementById("horario");
  const mensagem = document.getElementById("mensagem");
  const btnDesmarcar = document.getElementById("btn-desmarcar");
  const horariosFixos = ["08:00", "10:00", "13:00", "15:00", "17:00"];
  const numeroStudio = "5562995446258"; // WhatsApp Studio

  // 🕐 Carregar horários
  async function renderizarHorarios() {
    const dataSelecionada = dataInput.value;
    const clienteAtual = document.getElementById("whatsapp").value.replace(/\D/g, "");
    horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';

    if (!dataSelecionada) {
      horarioSelect.innerHTML = '<option value="">Selecione a data primeiro</option>';
      return;
    }

    const { data: agendamentos } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("data", dataSelecionada);

    horariosFixos.forEach((hora) => {
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;

      const ocupado = agendamentos?.find((a) => a.hora === hora);
      if (ocupado) {
        if (ocupado.whatsapp !== clienteAtual) {
          option.disabled = true;
          option.textContent += " (indisponível)";
        } else {
          option.textContent += " (seu horário)";
          option.selected = true;
        }
      }

      horarioSelect.appendChild(option);
    });
  }

  dataInput.addEventListener("change", renderizarHorarios);

  // ✅ Agendar horário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
    const servico = document.getElementById("servico").value;
    const data = dataInput.value;
    const hora = horarioSelect.value;

    if (!nome || !whatsapp || !servico || !data || !hora) {
      alert("Preencha todos os campos!");
      return;
    }

    // Verificar se já está ocupado
    const { data: existentes } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("data", data)
      .eq("hora", hora);

    if (existentes && existentes.length > 0) {
      alert("Esse horário já está ocupado!");
      return;
    }

    // Inserir no Supabase
    await supabase.from("agendamentos").insert([{ nome, whatsapp, servico, data, hora }]);

    // Enviar pro WhatsApp do Studio
    const msgStudio = `💅 *Novo Agendamento* 💕%0A👤 Nome: ${nome}%0A📞 WhatsApp: ${whatsapp}%0A💄 Serviço: ${servico}%0A📅 Data: ${data}%0A⏰ Horário: ${hora}`;
    window.open(`https://wa.me/${numeroStudio}?text=${msgStudio}`, "_blank");

    // Enviar confirmação pro cliente
    const msgCliente = `✨ Olá ${nome}! Seu agendamento no *Studio Thacyana Lopes* foi confirmado! 💅%0A📅 Data: ${data}%0A⏰ Horário: ${hora}%0A💄 Serviço: ${servico}%0A💖 Esperamos por você!`;
    window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");

    mensagem.textContent = "✅ Agendamento confirmado com sucesso!";
    form.reset();
    renderizarHorarios();
  });

  // ❌ Cancelar agendamento
  btnDesmarcar.addEventListener("click", async () => {
    const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
    const data = dataInput.value;

    if (!whatsapp || !data) {
      alert("Preencha o WhatsApp e selecione a data!");
      return;
    }

    const { data: agendamentos } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("whatsapp", whatsapp)
      .eq("data", data);

    if (!agendamentos || agendamentos.length === 0) {
      alert("Nenhum agendamento encontrado para esse número e data.");
      return;
    }

    const horarios = agendamentos.map((a) => a.hora).join(", ");
    if (!confirm(`Seus horários neste dia: ${horarios}\nDeseja realmente cancelar?`)) return;

    // Deletar todos os agendamentos do cliente nessa data
    await supabase.from("agendamentos").delete().eq("whatsapp", whatsapp).eq("data", data);

    // Avisar Studio
    agendamentos.forEach((a) => {
      const msgStudio = `❌ *Cancelamento* ❌%0A👤 Nome: ${a.nome}%0A📞 WhatsApp: ${a.whatsapp}%0A💄 Serviço: ${a.servico}%0A📅 Data: ${a.data}%0A⏰ Horário: ${a.hora}`;
      window.open(`https://wa.me/${numeroStudio}?text=${msgStudio}`, "_blank");
    });

    // Avisar Cliente
    const msgCliente = `⚠️ Olá! Seus horários no *Studio Thacyana Lopes* foram desmarcados para o dia ${data}.`;
    setTimeout(() => {
      window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
    }, 1000);

    mensagem.textContent = "❌ Seus horários foram desmarcados com sucesso!";
    renderizarHorarios();
  });
});
