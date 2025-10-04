import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 🔑 Config do Firebase
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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-agendamento");
  const dataInput = document.getElementById("data");
  const horarioSelect = document.getElementById("horario");
  const mensagem = document.getElementById("mensagem");
  const btnDesmarcar = document.getElementById("btn-desmarcar");
  const horariosFixos = ["08:00", "10:00", "13:00", "15:00", "17:00"];
  const numeroStudio = "5562995446258"; // WhatsApp do Studio

  function limparSelect() {
    horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';
  }

  async function renderizarHorarios() {
    const dataSelecionada = dataInput.value;
    const clienteAtual = document.getElementById("whatsapp").value.replace(/\D/g, "");
    limparSelect();

    if (!dataSelecionada) {
      horarioSelect.innerHTML = '<option value="">Selecione a data primeiro</option>';
      return;
    }

    const q = query(collection(db, "agendamentos"), where("data", "==", dataSelecionada));
    const snapshot = await getDocs(q);
    const ocupados = snapshot.docs.map(doc => doc.data());

    horariosFixos.forEach(hora => {
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;

      const ocupado = ocupados.find(a => a.hora === hora);
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

    // Abrir WhatsApp do Studio imediatamente
    const msgStudio = `💅 *Novo Agendamento* 💕%0A👤 Nome: ${nome}%0A📞 WhatsApp: ${whatsapp}%0A💄 Serviço: ${servico}%0A📅 Data: ${data}%0A⏰ Horário: ${hora}`;
    window.open(`https://wa.me/${numeroStudio}?text=${msgStudio}`, "_blank");

    // Abrir WhatsApp do cliente após 1s
    const msgCliente = `✨ Olá ${nome}! Seu agendamento no Studio Thacyana Lopes foi confirmado! 💅%0A📅 Data: ${data}%0A⏰ Horário: ${hora}%0A💄 Serviço: ${servico}%0A💖 Esperamos por você!`;
    setTimeout(() => {
      window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
    }, 1000);

    // Salvar no Firestore em paralelo (não trava o WhatsApp)
    (async () => {
      try {
        await addDoc(collection(db, "agendamentos"), { nome, whatsapp, servico, data, hora });
        mensagem.textContent = "✅ Agendamento confirmado com sucesso!";
        renderizarHorarios();
        form.reset();
      } catch (err) {
        console.error("Erro ao salvar no Firestore:", err);
        alert("Erro ao salvar o agendamento, tente novamente.");
      }
    })();
  });

  // ❌ Desmarcar horário
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

        // Mensagem pro Studio
        const a = docSnap.data();
        const msgStudio = `❌ *Cancelamento* ❌%0A👤 Nome: ${a.nome}%0A📞 WhatsApp: ${a.whatsapp}%0A💄 Serviço: ${a.servico}%0A📅 Data: ${a.data}%0A⏰ Horário: ${a.hora}`;
        window.open(`https://wa.me/${numeroStudio}?text=${msgStudio}`, "_blank");
      }

      // Mensagem pro Cliente
      const msgCliente = `⚠️ Olá! Seu(s) horário(s) no Studio Thacyana Lopes foram desmarcados para o dia ${data}.`;
      setTimeout(() => {
        window.open(`https://wa.me/55${whatsapp}?text=${msgCliente}`, "_blank");
      }, 1500);

      mensagem.textContent = "❌ Seu(s) horário(s) foram desmarcados com sucesso!";
      renderizarHorarios();
    }
  });
});
