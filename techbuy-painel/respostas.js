const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const venom = require("venom-bot");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage });

let client;
let conectado = false;
let qrCodeBase64 = "";

// Carrega menu.json da pasta dados
const caminhoMenu = path.join(__dirname, "dados", "menu.json");
let menuPadrao = { btn1: "", btn2: "", btn3: "" };
if (fs.existsSync(caminhoMenu)) {
  try {
    menuPadrao = JSON.parse(fs.readFileSync(caminhoMenu));
  } catch (err) {
    console.error("❌ Erro ao ler menu.json:", err.message);
  }
}

venom
  .create({
    session: "techbuy",
    multidevice: true,
    headless: true,
    useChrome: false,
    disableWelcome: true,
  })
  .then((bot) => {
    client = bot;
    conectado = true;
    console.log("✅ Bot conectado!");
  })
  .catch((err) => {
    console.error("❌ Erro ao iniciar o bot:", err);
  });

app.get("/qr", (req, res) => {
  res.json({ qr: qrCodeBase64 });
});

app.get("/status", (req, res) => {
  res.json({ conectado });
});

app.post("/enviar", upload.single("imagem"), async (req, res) => {
  const { nome, mensagem, contatos, menu, btn1, btn2, btn3, sub1, sub2, sub3 } = req.body;
  const lista = JSON.parse(contatos);
  const enviados = [];

  for (const numero of lista) {
    try {
      if (req.file) {
        await client.sendImage(
          numero,
          `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
          "imagem.jpg",
          mensagem
        );
      } else {
        await client.sendText(numero, mensagem);
      }

      if (menu === "on") {
        const buttons = {
          title: "Escolha uma opção:",
          buttons: [
            { buttonText: { displayText: btn1 || menuPadrao.btn1 } },
            { buttonText: { displayText: btn2 || menuPadrao.btn2 } },
            { buttonText: { displayText: btn3 || menuPadrao.btn3 } },
          ],
        };
        await client.sendButtons(numero, "Menu interativo", buttons);
      }

      enviados.push({ numero, status: "sucesso" });
    } catch (err) {
      enviados.push({ numero, status: "erro", erro: err.message });
    }
  }

  res.json({ status: "sucesso", enviados });
});

app.get("/historico", (req, res) => {
  const caminho = path.join(__dirname, "dados", "historico.json");
  if (!fs.existsSync(caminho)) return res.json([]);
  const dados = JSON.parse(fs.readFileSync(caminho));
  res.json(dados);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
