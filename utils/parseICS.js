/*
30/10/25
WRW_BigBoss
FlavioCallega_&_Copilot
*/

const axios = require('axios');
const ical = require('ical');

/**
 * Função que busca e interpreta um arquivo .ics remoto
 * Retorna um array com as datas ocupadas no formato YYYY-MM-DD
 */
async function getDatasOcupadas(url) {
  try {
    const res = await axios.get(url);
    const data = res.data;
    const eventos = ical.parseICS(data);

    const datas = new Set();

    for (let k in eventos) {
      const ev = eventos[k];
      if (ev.type === 'VEVENT' && ev.start && ev.end) {
        const inicio = new Date(ev.start);
        const fim = new Date(ev.end);

        for (let d = new Date(inicio); d < fim; d.setDate(d.getDate() + 1)) {
          datas.add(d.toISOString().split('T')[0]);
        }
      }
    }

    return Array.from(datas);
  } catch (err) {
    console.error('Erro ao buscar ou interpretar o .ics:', err.message);
    return [];
  }
}

module.exports = {getDatasOcupadas};