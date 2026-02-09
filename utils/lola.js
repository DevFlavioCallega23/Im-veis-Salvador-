/* 
30/10/25
WRW_BigBoss
FlavioCallega_&_Copilot
*/

require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// Rota para iniciar autenticação
router.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // força o refresh_token
    scope: ['https://www.googleapis.com/auth/calendar.events']
  });
  res.redirect(authUrl);
});

// Rota de callback após login
router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Código de autorização ausente na URL');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Tokens recebidos:', tokens); // debug opcional
    res.send('✅ Autenticação concluída com sucesso! Pode fechar esta aba.');
  } catch (err) {
    console.error('Erro na autenticação:', err);
    res.status(500).send('Erro na autenticação');
  }
});

// Função para criar evento no Google Calendar
async function criarEvento(data, titulo = 'Reserva TechBuy') {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const evento = {
    summary: titulo,
    start: { date: data },
    end: { date: data },
    description: 'Reserva feita via site TechBuy'
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: evento
    });
    console.log('✅ Evento criado:', response.data.htmlLink);
  } catch (err) {
    console.error('Erro ao criar evento:', err.message);
  }
}

module.exports = { router, criarEvento };