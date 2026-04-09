const ical = require('node-ical');
const axios = require('axios');

async function getDatasOcupadas(url) {
  try {
    const res = await axios.get(url);
    const eventos = ical.parseICS(res.data);
    const datasOcupadas = new Set();

    for (let k in eventos) {
      const ev = eventos[k];

      if (ev.type === 'VEVENT' && ev.start && ev.end) {
        let atual = new Date(ev.start);
        const fim = new Date(ev.end);

        // Loop para marcar cada dia entre o check-in e check-out
        while (atual < fim) {
          // Extraímos ano, mês e dia manualmente para ignorar o fuso horário
          const ano = atual.getFullYear();
          const mes = String(atual.getMonth() + 1).padStart(2, '0');
          const dia = String(atual.getDate()).padStart(2, '0');
          
          datasOcupadas.add(`${ano}-${mes}-${dia}`);
          
          // Avança um dia
          atual.setDate(atual.getDate() + 1);
        }
      }
    }
    return Array.from(datasOcupadas);
  } catch (error) {
    console.error("Erro ao processar ICS:", error.message);
    return [];
  }
}

module.exports = { getDatasOcupadas };