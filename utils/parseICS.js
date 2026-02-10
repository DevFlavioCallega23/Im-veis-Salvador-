/*
FlavioCallega
10/02/26
WRW_BigBoss
*/const ical = require('ical');
const axios = require('axios');

async function getDatasOcupadas(url) {
  const res = await axios.get(url);
  const eventos = ical.parseICS(res.data);

  const datasOcupadas = new Set();

  for (let k in eventos) {
    const ev = eventos[k];

    if (ev.type === 'VEVENT' && ev.start && ev.end) {
      let atual = new Date(ev.start);
      const fim = new Date(ev.end);

      // Airbnb: end = checkout (não bloqueia o último dia)
      while (atual < fim) {
        datasOcupadas.add(
          atual.toISOString().split('T')[0]
        );
        atual.setDate(atual.getDate() + 1);
      }
    }
  }

  return Array.from(datasOcupadas);
}

module.exports = { getDatasOcupadas };

