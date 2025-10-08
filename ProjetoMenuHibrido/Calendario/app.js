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
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const calendarios = {
  casaPraia: 'https://www.airbnb.com.br/calendar/ical/41662018.ics?s=b8cedbfaf02c937a5ac60fb776cabbcb'
};

app.get('/disponibilidade/:imovelId', async (req, res) => {
  const imovelId = req.params.imovelId;
  const url = calendarios[imovelId];
  if (!url) return res.status(404).send('Imóvel não encontrado');

  try {
    const datas = await getDatasOcupadas(url);
    res.json(datas);
  } catch (err) {
    res.status(500).send('Erro ao processar calendário');
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
 
