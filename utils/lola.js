require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Rota de Autenticação (inalterada)
router.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events']
  });
  res.redirect(authUrl);
});

router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send('✅ Autenticação concluída! Pode fechar esta aba.');
  } catch (err) {
    res.status(500).send('Erro na autenticação');
  }
});

// FUNÇÃO CORRIGIDA: Criar evento no Google
async function criarEvento(dataString, titulo = 'Reserva TechBuy') {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Para bloquear um dia inteiro no Google, o 'end' deve ser o dia seguinte
  const dataInicio = new Date(dataString + 'T00:00:00');
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataFim.getDate() + 1);

  const formatar = (d) => d.toISOString().split('T')[0];

  const evento = {
    summary: titulo,
    start: { date: dataString }, 
    end: { date: formatar(dataFim) }, // O dia seguinte garante que o dia atual fique ocupado
    description: 'Reserva feita via site TechBuy'
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: evento
    });
    console.log('✅ Bloqueio no Google criado:', response.data.htmlLink);
  } catch (err) {
    console.error('❌ Erro Google Calendar:', err.message);
  }
}

module.exports = { router, criarEvento };