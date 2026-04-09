/*
07/11/25
WRW_BigBoss
FlavioCallega_&_Copilot
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ical = require('node-ical');

async function sincronizarTodos() {
  const calendarios = JSON.parse(fs.readFileSync('./calendarios.json', 'utf8'));
  const destino = path.join(__dirname, 'public', 'calendarios');

  if (!fs.existsSync(destino)) {
    fs.mkdirSync(destino, { recursive: true });
  }

  for (const nome in calendarios) {
    const url = calendarios[nome];
    try {
      const response = await axios.get(url);
      const eventos = ical.parseICS(response.data);

      const datas = new Set();
      for (const k in eventos) {
        const ev = eventos[k];
        if (ev.type === 'VEVENT' && ev.start && ev.end) {
          const inicio = new Date(ev.start);
          const fim = new Date(ev.end);
          for (let d = new Date(inicio); d < fim; d.setDate(d.getDate() + 1)) {
            datas.add(d.toISOString().split('T')[0]);
          }
        }
      }

      const caminho = path.join(destino, `${nome}.json`);
      fs.writeFileSync(caminho, JSON.stringify(Array.from(datas)));
      console.log(`✅ ${nome} sincronizado com ${datas.size} datas ocupadas`);
    } catch (err) {
      console.error(`❌ Erro ao sincronizar ${nome}:`, err.message);
    }
  }
}

sincronizarTodos();