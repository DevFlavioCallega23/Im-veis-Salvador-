const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./service-account.json');

(async () => {
  try {
    const doc = new GoogleSpreadsheet('1rUIxb2TRfH45pq7OenjN6BGLMEx17qhKPBOVzCNbxbo');

    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key
    });

    await doc.loadInfo();
    console.log(`📄 Planilha acessada: ${doc.title}`);
    const sheet = doc.sheetsByIndex[0];
    console.log(`📄 Aba ativa: ${sheet.title} | Linhas: ${sheet.rowCount}`);
  } catch (err) {
    console.error('❌ Erro ao acessar planilha:', err.message);
  }
})();
