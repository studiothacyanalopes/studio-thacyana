const form = document.getElementById("form-agendamento");
const dataInput = document.getElementById("data");
const horarioSelect = document.getElementById("horario");
const mensagem = document.getElementById("mensagem");
const btnDesmarcar = document.getElementById("btn-desmarcar");

// horários de manhã e tarde
const horariosFixos = ["08:00", "10:00", "13:00", "15:00", "17:00"];

// pega agendamentos do localStorage
function pegarAgendamentos() {
  return JSON.parse(localStorage.getItem("agendamentos") || "{}");
}

// salva agendamentos
function salvarAgendamentos(agendamentos) {
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

// renderiza lista de horários no select, bloqueando os ocupados
function renderizarHorarios() {
  const dataSelecionada = dataInput.value;
  const agendamentos = pegarAgendamentos();
  const ocupados = agendamentos[dataSelecionada] || [];
  const clienteAtual = document.getElementById("whatsapp").value.replace(/\D/g, "");

  horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';

  horariosFixos.forEach(hora => {
    const option = document.createElement("option");
    option.value = hora;
    option.textContent = hora;

    const ocupacao = ocupados.find(a => a.hora === hora);

    if (ocupacao) {
      if (ocupacao.whatsapp !== clienteAtual) {
        option.disabled = true;
        option.textContent += " (indisponível)";
      } else {
        option.textContent += " (seu horário)";
      }
    }

    horarioSelect.appendChild(option);
  });
}

// ao mudar a data
dataInput.addEventListener("change", () => {
  renderizarHorarios();
});

// ao carregar página, preenche WhatsApp se existir
window.addEventListener("load", () => {
  const clienteAtual = localStorage.getItem("clienteAtual");
  if (clienteAtual) {
    document.getElementById("whatsapp").value = clienteAtual;
  }
  renderizarHorarios(); // garante que o próprio horário apareça
});

// evento de agendamento
form.addEventListener("submit", e => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
  const servico = document.getElementById("servico").value;
  const data = dataInput.value;
  const hora = horarioSelect.value;

  if (!nome || !whatsapp || !servico || !data || !hora) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  localStorage.setItem("clienteAtual", whatsapp);

  const agendamentos = pegarAgendamentos();
  if (!agendamentos[data]) agendamentos[data] = [];

  // se o cliente já tinha marcado esse horário, atualiza
  const existente = agendamentos[data].find(a => a.hora === hora && a.whatsapp === whatsapp);
  if (!existente) {
    agendamentos[data].push({hora, nome, whatsapp, servico});
  }

  salvarAgendamentos(agendamentos);

  mensagem.textContent = "Agendamento confirmado com sucesso!";

  // mensagem para studio
  const msgStudio = `💅 *Novo Agendamento - Studio Thacyana Lopes* 💕%0A%0A👤 Nome: ${nome}%0A📞 WhatsApp: ${whatsapp}%0A💄 Serviço: ${servico}%0A📅 Data: ${data}%0A⏰ Horário: ${hora}`;
  window.open(`https://wa.me/5562995446258?text=${msgStudio}`, "_blank");

  // mensagem para cliente
  const msgCliente = `✨ Olá ${nome}! Seu agendamento no Studio Thacyana Lopes foi confirmado! 💅%0A%0A📅 Data: ${data}%0A⏰ Horário: ${hora}%0A💄 Serviço: ${servico}%0A%0A💖 Esperamos por você!`;
  setTimeout(() => {
    window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
  }, 1500);

  form.reset();
  horarioSelect.innerHTML = '<option value="">Selecione a data primeiro</option>';
  renderizarHorarios();
});

// função para desmarcar horário do cliente atual
btnDesmarcar.addEventListener("click", () => {
  const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
  const data = dataInput.value;

  if (!whatsapp || !data) {
    alert("Preencha o WhatsApp e selecione a data para desmarcar.");
    return;
  }

  const agendamentos = pegarAgendamentos();
  if (!agendamentos[data]) {
    alert("Não há agendamentos para esta data.");
    return;
  }

  const encontrados = agendamentos[data].filter(a => a.whatsapp === whatsapp);
  if (encontrados.length === 0) {
    alert("Não encontramos nenhum agendamento com esse WhatsApp nessa data.");
    return;
  }

  if (confirm("Deseja realmente desmarcar seu(s) horário(s) nesta data?")) {
    agendamentos[data] = agendamentos[data].filter(a => a.whatsapp !== whatsapp);
    salvarAgendamentos(agendamentos);
    renderizarHorarios();
    mensagem.textContent = "Seu(s) horário(s) foram desmarcados com sucesso!";

    // mensagem para studio com nome e serviço
    encontrados.forEach(a => {
      const msgStudio = `❌ *Cancelamento - Studio Thacyana Lopes* ❌%0A%0A👤 Nome: ${a.nome}%0A📞 WhatsApp: ${a.whatsapp}%0A💄 Serviço: ${a.servico}%0A📅 Data: ${data}%0A⏰ Horário: ${a.hora}`;
      window.open(`https://wa.me/5562995446258?text=${msgStudio}`, "_blank");
    });

    // mensagem para cliente
    const msgCliente = `⚠️ Olá! Seu(s) horário(s) no Studio Thacyana Lopes foram desmarcados para o dia ${data}.`;
    setTimeout(() => {
      window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
    }, 1500);
  }
});

// função para gerar uma URL separada para ver todos os agendamentos (painel studio)
function gerarPainelAgendamentos() {
  const agendamentos = pegarAgendamentos();
  const jsonStr = encodeURIComponent(JSON.stringify(agendamentos, null, 2));
  const url = `data:text/json;charset=utf-8,${jsonStr}`;
  window.open(url, "_blank");
}
