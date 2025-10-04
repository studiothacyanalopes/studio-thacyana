// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos
const form = document.getElementById("form-agendamento");
const dataInput = document.getElementById("data");
const horarioSelect = document.getElementById("horario");
const mensagem = document.getElementById("mensagem");
const btnDesmarcar = document.getElementById("btn-desmarcar");

const horariosFixos = ["08:00", "10:00", "13:00", "15:00", "17:00"];

// Renderizar horários
async function renderizarHorarios() {
  const dataSelecionada = dataInput.value;
  const clienteAtual = document.getElementById("whatsapp").value.replace(/\D/g, "");
  horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';

  if (!dataSelecionada) {
    horarioSelect.innerHTML = '<option value="">Selecione a data primeiro</option>';
    return;
  }

  const q = query(collection(db, "agendamentos"), where("data", "==", dataSelecionada));
  const snapshot = await getDocs(q);
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

// Eventos
window.addEventListener("load", () => {
  const clienteAtual = localStorage.getItem("clienteAtual");
  if (clienteAtual) document.getElementById("whatsapp").value = clienteAtual;
  renderizarHorarios();
});

dataInput.addEventListener("change", renderizarHorarios);

// Agendamento
form.addEventListener("submit", async e => {
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

  // Verifica se horário já ocupado
  const q = query(collection(db, "agendamentos"), where("data", "==", data), where("hora", "==", hora));
  const snapshot = await getDocs(q);
  if (snapshot.docs.some(doc => doc.data().whatsapp !== whatsapp)) {
    alert("Esse horário já está ocupado por outro cliente.");
    return;
  }

  await addDoc(collection(db, "agendamentos"), { nome, whatsapp, servico, data, hora });

  mensagem.textContent = "Agendamento confirmado com sucesso!";

  // Mensagens WhatsApp (abrir só depois do clique)
  const msgStudio = encodeURIComponent(`💅 *Novo Agendamento - Studio Thacyana Lopes* 💕\n\n👤 Nome: ${nome}\n📞 WhatsApp: ${whatsapp}\n💄 Serviço: ${servico}\n📅 Data: ${data}\n⏰ Horário: ${hora}`);
  const msgCliente = encodeURIComponent(`✨ Olá ${nome}! Seu agendamento no Studio Thacyana Lopes foi confirmado! 💅\n\n📅 Data: ${data}\n⏰ Horário: ${hora}\n💄 Serviço: ${servico}\n\n💖 Esperamos por você!`);

  window.open(`https://wa.me/5562995446258?text=${msgStudio}`, "_blank");
  setTimeout(() => {
    window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
  }, 1000);

  form.reset();
  renderizarHorarios();
});

// Desmarcar horário
btnDesmarcar.addEventListener("click", async () => {
  const whatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
  const data = dataInput.value;

  if (!whatsapp || !data) {
    alert("Preencha o WhatsApp e selecione a data!");
    return;
  }

  const q = query(collection(db, "agendamentos"), where("data", "==", data), where("whatsapp", "==", whatsapp));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    alert("Não encontramos agendamentos para esse WhatsApp nessa data.");
    return;
  }

  if (confirm("Deseja realmente desmarcar seu(s) horário(s) nesta data?")) {
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "agendamentos", docSnap.id));

      const a = docSnap.data();
      const msgStudio = encodeURIComponent(`❌ *Cancelamento - Studio Thacyana Lopes* ❌\n\n👤 Nome: ${a.nome}\n📞 WhatsApp: ${a.whatsapp}\n💄 Serviço: ${a.servico}\n📅 Data: ${a.data}\n⏰ Horário: ${a.hora}`);
      window.open(`https://wa.me/5562995446258?text=${msgStudio}`, "_blank");
    }

    const msgCliente = encodeURIComponent(`⚠️ Olá! Seus horários no Studio Thacyana Lopes foram desmarcados para o dia ${data}.`);
    setTimeout(() => {
      window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
    }, 1000);

    mensagem.textContent = "Seu(s) horário(s) foram desmarcados com sucesso!";
    renderizarHorarios();
  }
});
