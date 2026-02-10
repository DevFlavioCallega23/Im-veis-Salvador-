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
  farolBarraFlat: "https://www.airbnb.com.br/calendar/ical/1410986458634773223.ics?t=e1273efb853e40b8b6b97e1ff196f189",
  ondinaApartHotel: "https://www.airbnb.com.br/calendar/ical/986288391373272410.ics?t=cc4351d9d0fe477582dfcaf0eb6d6678",
  smartConvencoes: "https://www.airbnb.com.br/calendar/ical/1320242268460204756.ics?t=e5b640cb9c234cf8bb622353c9a640e8",
  PlazaOndina: "https://www.airbnb.com.br/calendar/ical/1544328946353777106.ics?t=311c06c0f8854ad9abfc306706a0994b"

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
