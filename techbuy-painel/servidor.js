const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const venom = require("venom-bot");
const open = require("open").default;
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage });

let client;
let conectado = false;
let qrCodeBase64 = "";

// Controle de tempo por número
const controleMensagens = new Map();

// Carrega vendedores.json da pasta dados
const caminhoVendedores = path.join(__dirname, "dados", "vendedores.json");
let vendedores = {};
if (fs.existsSync(caminhoVendedores)) {
  try {
    vendedores = JSON.parse(fs.readFileSync(caminhoVendedores));
  } catch (err) {
    console.error("❌ Erro ao ler vendedores.json:", err.message);
  }
}

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

// Cria o bot e captura o QR Code corretamente
venom
  .create(
    {
      session: "techbuy",
      multidevice: true,
      headless: "new",
      useChrome: false,
      disableWelcome: true
    },
    (base64Qrimg, asciiQR, attempts, urlCode) => {
      qrCodeBase64 = base64Qrimg;
      console.log("📸 QR Code atualizado");
    }
  )
  .then((bot) => {
    client = bot;

    // Aguarda login completo antes de marcar como conectado
    bot.waitForLogin().then(() => {
      conectado = true;
      console.log("✅ Bot logado e pronto para enviar mensagens!");

      // Resposta automática com controle de tempo
      client.onMessage(async (mensagem) => {
        const numero = mensagem.from;
        const agora = Date.now();
        const duasHoras = 2 * 60 * 60 * 1000;
        const ultima = controleMensagens.get(numero);

        if (!ultima || agora - ultima > duasHoras) {
          const vendedor = vendedores[numero];
          if (vendedor) {
            await client.sendText(numero, `Você está falando com o vendedor ${vendedor}. Em breve ele te responderá.`);
          } else {
            await client.sendText(numero, "Oi, bem-vindo à TechBuy! Sou Flavio, como posso te ajudar?");
          }
          controleMensagens.set(numero, agora);
        }
      });
    });
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
  if (!conectado || !client) {
    return res.status(400).json({ status: "erro", mensagem: "Bot não está conectado. Escaneie o QR Code primeiro." });
  }

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
            { buttonText: { displayText: btn3 || menuPadrao.btn3 } }
          ]
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

app.post("/vendedores", (req, res) => {
  const caminho = path.join(__dirname, "dados", "vendedores.json");
  const novosDados = req.body;

  try {
    fs.writeFileSync(caminho, JSON.stringify(novosDados, null, 2));
    res.json({ status: "sucesso", mensagem: "Vendedores atualizados com sucesso!" });
  } catch (err) {
    res.status(500).json({ status: "erro", mensagem: "Erro ao salvar vendedores." });
  }
});

app.get("/painel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "painel.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  open(`http://localhost:${PORT}/qrcode.html`);
});