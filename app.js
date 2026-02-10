/*
08/10/25
FlavioCallega
WRW_BigBoss
*/

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDatasOcupadas } = require('./utils/parseICS');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===============================
// MAPA DE CALENDÁRIOS (ICS)
// ===============================
const calendarios = {
  casaPraia: 'https://www.airbnb.com.br/calendar/ical/41662018.ics?s=b8cedbfaf02c937a5ac60fb776cabbcb',
  farolBarraFlat: "https://www.airbnb.com.br/calendar/ical/1410986458634773223.ics?s=fa88a81f2866e81b17e7288342015f0d",
  ondinaApartHotel: "https://www.airbnb.com.br/calendar/ical/986288391373272410.ics?s=50fed0ae6384b400278ddcbaae39f438",
  smartConvencoes: "https://www.airbnb.com.br/calendar/ical/1320242268460204756.ics?t=e5b640cb9c234cf8bb622353c9a640e8"

  // futuros imóveis:
  // barraFlat: 'https://link-do-ics.ics',
  // smartConvencoes: 'https://link-do-ics.ics'
};

// ===============================
// ENDPOINT DE DISPONIBILIDADE
// ===============================
app.get('/disponibilidade/:imovelId', async (req, res) => {
  const { imovelId } = req.params;
  const urlICS = calendarios[imovelId];

  console.log(`📅 Consulta de disponibilidade: ${imovelId}`);

  if (!urlICS) {
    console.warn(`❌ Imóvel não encontrado: ${imovelId}`);
    return res.status(404).json({ erro: 'Imóvel não encontrado' });
  }

  try {
    const datasOcupadas = await getDatasOcupadas(urlICS);

    console.log(`✅ Datas ocupadas carregadas (${datasOcupadas.length})`);
    res.json(datasOcupadas);
  } catch (error) {
    console.error('🔥 Erro ao processar calendário:', error);
    res.status(500).json({ erro: 'Erro ao processar calendário' });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
