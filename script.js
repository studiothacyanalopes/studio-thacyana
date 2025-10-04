import { db, fs } from './index.html'; // referência ao Firebase já importado no HTML

const form = document.getElementById("form-agendamento");
const dataInput = document.getElementById("data");
const horarioSelect = document.getElementById("horario");
const mensagem = document.getElementById("mensagem");
const btnDesmarcar = document.getElementById("btn-desmarcar");

const horariosFixos = ["08:00", "10:00", "13:00", "15:00", "17:00"];

function limparSelect() {
  horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';
}

async function renderizarHorarios() {
  const dataSelecionada = dataInput.value;
  const clienteAtual = document.getElementById("whatsapp").value.replace(/\D/g, "");
  limparSelect();
  if (!dataSelecionada) return;

  const q = fs.query(fs.collection(db, "agendamentos"), fs.where("data", "==", dataSelecionada));
  const snapshot = await fs.getDocs(q);
  const ocupados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
        option.selected = true;
      }
    }

    horarioSelect.appendChild(option);
  });
}

window.addEventListener("load", () => {
  const clienteAtual = localStorage.getItem("clienteAtual");
  if (clienteAtual) document.getElementById("whatsapp").value = clienteAtual;
  renderizarHorarios();
});

dataInput.addEventListener("change", renderizarHorarios);

form.addEventListener("submit", async e => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
  const servico = document.getElementById("servico").value;
  const data = dataInput.value;
  const hora = horarioSelect.value;

  if (!nome || !whatsapp || !servico || !data || !hora) {
    alert("Preencha todos os campos!");
    return;
  }

  localStorage.setItem("clienteAtual", whatsapp);

  // Checa se horário já ocupado por outro cliente
  const q = fs.query(fs.collection(db, "agendamentos"), fs.where("data", "==", data), fs.where("hora", "==", hora));
  const snapshot = await fs.getDocs(q);
  if (snapshot.docs.some(doc => doc.data().whatsapp !== whatsapp)) {
    alert("Esse horário já está ocupado por outro cliente.");
    return;
  }

  await fs.addDoc(fs.collection(db, "agendamentos"), { nome, whatsapp, servico, data, hora });
  mensagem.textContent = "Agendamento confirmado com sucesso!";

  // mensagens WhatsApp
  const msgStudio = `💅 *Novo Agendamento - Studio Thacyana Lopes* 💕%0A%0A👤 Nome: ${nome}%0A📞 WhatsApp: ${whatsapp}%0A💄 Serviço: ${servico}%0A📅 Data: ${data}%0A⏰ Horário: ${hora}`;
  window.open(`https://wa.me/5562995446258?text=${msgStudio}`, "_blank");

  const msgCliente = `✨ Olá ${nome}! Seu agendamento foi confirmado 💅%0A📅 Data: ${data}%0A⏰ Horário: ${hora}%0A💄 Serviço: ${servico}`;
  setTimeout(() => window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank"), 1500);

  form.reset();
  renderizarHorarios();
});

btnDesmarcar.addEventListener("click", async () => {
  const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
  const data = dataInput.value;

  if (!whatsapp || !data) {
    alert("Preencha o WhatsApp e selecione a data para desmarcar.");
    return;
  }

  const q = fs.query(fs.collection(db, "agendamentos"), fs.where("data", "==", data), fs.where("whatsapp", "==", whatsapp));
  const snapshot = await fs.getDocs(q);

  if (snapshot.empty) {
    alert("Não encontramos nenhum agendamento com esse WhatsApp nessa data.");
    return;
  }

  if (confirm("Deseja realmente desmarcar seu(s) horário(s) nesta data?")) {
    for (const docSnap of snapshot.docs) {
      await fs.deleteDoc(fs.doc(db, "agendamentos", docSnap.id));
      const a = docSnap.data();
      const msgStudio = `❌ *Cancelamento - Studio Thacyana Lopes* ❌%0A👤 Nome: ${a.nome}%0A📞 WhatsApp: ${a.whatsapp}%0A💄 Serviço: ${a.servico}%0A📅 Data: ${a.data}%0A⏰ Horário: ${a.hora}`;
      window.open(`https://wa.me/5562995446258?text=${msgStudio}`, "_blank");
    }

    const msgCliente = `⚠️ Olá! Seu(s) horário(s) foram desmarcados para o dia ${data}.`;
    setTimeout(() => window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank"), 1500);

    mensagem.textContent = "Seu(s) horário(s) foram desmarcados com sucesso!";
    renderizarHorarios();
  }
});
