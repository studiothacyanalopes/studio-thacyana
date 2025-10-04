document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-agendamento");
  const dataInput = document.getElementById("data");
  const horarioSelect = document.getElementById("horario");
  const mensagem = document.getElementById("mensagem");
  const btnDesmarcar = document.getElementById("btn-desmarcar");
  const horariosFixos = ["08:00", "10:00", "13:00", "15:00", "17:00"];
  const numeroStudio = "5562995446258"; // WhatsApp do Studio

  // Funções para LocalStorage
  function getAgendamentos() {
    return JSON.parse(localStorage.getItem("agendamentos") || "[]");
  }

  function saveAgendamentos(agendamentos) {
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
  }

  function limparSelect() {
    horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';
  }

  function renderizarHorarios() {
    const dataSelecionada = dataInput.value;
    const clienteAtual = document.getElementById("whatsapp").value.replace(/\D/g, "");
    limparSelect();

    if (!dataSelecionada) {
      horarioSelect.innerHTML = '<option value="">Selecione a data primeiro</option>';
      return;
    }

    const agendamentos = getAgendamentos().filter(a => a.data === dataSelecionada);

    horariosFixos.forEach(hora => {
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;

      const ocupado = agendamentos.find(a => a.hora === hora);
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

  // Preenche WhatsApp salvo
  const clienteAtual = localStorage.getItem("clienteAtual");
  if (clienteAtual) document.getElementById("whatsapp").value = clienteAtual;
  renderizarHorarios();

  dataInput.addEventListener("change", renderizarHorarios);

  // 💾 Agendamento
  form.addEventListener("submit", e => {
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

    localStorage.setItem("clienteAtual", whatsapp);

    // Salvar no LocalStorage
    const agendamentos = getAgendamentos();
    agendamentos.push({ nome, whatsapp, servico, data, hora });
    saveAgendamentos(agendamentos);

    // Abrir WhatsApp
    const msgStudio = `💅 *Novo Agendamento* 💕%0A👤 Nome: ${nome}%0A📞 WhatsApp: ${whatsapp}%0A💄 Serviço: ${servico}%0A📅 Data: ${data}%0A⏰ Horário: ${hora}`;
    window.open(`https://wa.me/${numeroStudio}?text=${msgStudio}`, "_blank");

    const msgCliente = `✨ Olá ${nome}! Seu agendamento no Studio Thacyana Lopes foi confirmado! 💅%0A📅 Data: ${data}%0A⏰ Horário: ${hora}%0A💄 Serviço: ${servico}%0A💖 Esperamos por você!`;
    window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");

    mensagem.textContent = "✅ Agendamento confirmado com sucesso!";
    renderizarHorarios();
    form.reset();
  });

  // ❌ Cancelamento
  btnDesmarcar.addEventListener("click", () => {
    const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
    const data = dataInput.value;

    if (!whatsapp || !data) {
      alert("Preencha o WhatsApp e selecione a data!");
      return;
    }

    let agendamentos = getAgendamentos();
    const agendamentosDoCliente = agendamentos.filter(a => a.whatsapp === whatsapp && a.data === data);

    if (!agendamentosDoCliente.length) {
      alert("Não encontramos agendamentos para esse WhatsApp nessa data.");
      return;
    }

    // Mostrar ao cliente os horários dele para cancelar
    const horariosParaCancelar = agendamentosDoCliente.map(a => a.hora).join(", ");
    if (!confirm(`Seus horários neste dia: ${horariosParaCancelar}\nDeseja realmente cancelar?`)) {
      return;
    }

    agendamentos = agendamentos.filter(a => !(a.whatsapp === whatsapp && a.data === data));
    saveAgendamentos(agendamentos);

    // Avisar Studio
    agendamentosDoCliente.forEach(a => {
      const msgStudio = `❌ *Cancelamento* ❌%0A👤 Nome: ${a.nome}%0A📞 WhatsApp: ${a.whatsapp}%0A💄 Serviço: ${a.servico}%0A📅 Data: ${a.data}%0A⏰ Horário: ${a.hora}`;
      window.open(`https://wa.me/${numeroStudio}?text=${msgStudio}`, "_blank");
    });

    // Avisar Cliente
    const msgCliente = `⚠️ Olá! Seus horários no Studio Thacyana Lopes foram desmarcados para o dia ${data}.`;
    setTimeout(() => {
      window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
    }, 1000);

    mensagem.textContent = "❌ Seu(s) horário(s) foram desmarcados com sucesso!";
    renderizarHorarios();
  });
});
