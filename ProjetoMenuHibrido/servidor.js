// app.js
const express = require('express');
const app = express();
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

app.use(cors());

app.get('/disponibilidade/:imovelId', (req, res) => {
  const id = req.params.imovelId;
  db.all("SELECT data_ocupada FROM reservas WHERE imovel_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).send(err);
    const datas = rows.map(r => r.data_ocupada);
    res.json(datas);
  });
});

app.listen(3000, () => console.log('API rodando na porta 3000'));
