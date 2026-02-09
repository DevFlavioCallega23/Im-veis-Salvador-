/*
30/10/25
WRW_BigBoss
FlavioCallega_&_Copilot
*/

const ical = require('node-ical');
const axios = require('axios');
const { criarEvento } = require('./lola');

const AIRBNB_ICS_URL = 'https://www.airbnb.com.br/calendar/ical/41662018.ics?s=b8cedbfaf02c937a5ac60fb776cabbcb';

async function importarReservasAirbnb() {
  try {
    const response = await axios.get(AIRBNB_ICS_URL);
    const eventos = ical.parseICS(response.data);

    for (const k in eventos) {
      const evento = eventos[k];
      if (evento.type === 'VEVENT') {
        const dataInicio = evento.start.toISOString().split('T')[0];
        console.log(`📅 Reserva encontrada: ${evento.summary} em ${dataInicio}`);
        await criarEvento(dataInicio, evento.summary);
      }
    }

    console.log('✅ Sincronização com Airbnb concluída!');
  } catch (err) {
    console.error('Erro ao importar reservas do Airbnb:', err.message);
  }
}

module.exports = { importarReservasAirbnb };
