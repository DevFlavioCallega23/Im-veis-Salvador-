// servidor.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const venom = require("venom-bot");
// Importa a lógica do chatbot e os textos locais
const { processarMensagem } = require("./respostas");
const textos = require("./text"); 

const app = express();
const PORT = 3000;

// FUNÇÃO CRÍTICA ADICIONADA: Delay para estabilizar a conexão
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Variáveis de estado e cache
let client;
let conectado = false;
let qrCodeBase64 = "";
let vendedores = {};
let menuPadrao = {};
const controleMensagens = new Map(); // Para controle de tempo no chatbot

// --- Configuração e Funções de Dados ---
const caminhoVendedores = path.join(__dirname, "dados", "vendedores.json");
const caminhoMenu = path.join(__dirname, "dados", "menu.json");
const caminhoHistorico = path.join(__dirname, "dados", "historico.json");

app.use(express.json());
app.use(express.static("public"));
app.use(multer({ storage: multer.memoryStorage() }).single("imagem")); // Configura o multer

function carregarVendedores() {
    try {
        if (fs.existsSync(caminhoVendedores)) {
            vendedores = JSON.parse(fs.readFileSync(caminhoVendedores, 'utf-8'));
        }
    } catch (err) {
        console.error("❌ Erro ao ler vendedores.json:", err.message);
    }
}

function carregarMenu() {
    try {
        if (fs.existsSync(caminhoMenu)) {
            menuPadrao = JSON.parse(fs.readFileSync(caminhoMenu, 'utf-8'));
        }
    } catch (err) {
        console.error("❌ Erro ao ler menu.json:", err.message);
    }
}

function salvarHistorico(registro) {
    try {
        let historico = [];
        if (fs.existsSync(caminhoHistorico)) {
            const dados = fs.readFileSync(caminhoHistorico, 'utf-8');
            if (dados.trim()) historico = JSON.parse(dados);
        }
        
        registro.data = new Date().toLocaleString('pt-BR');
        historico.push(registro);
        
        fs.writeFileSync(caminhoHistorico, JSON.stringify(historico, null, 2));
    } catch (err) {
        console.error("❌ Erro ao salvar histórico:", err.message);
    }
}

// Carrega dados iniciais
carregarVendedores();
carregarMenu();

// --- Inicialização do VENOM ---
venom
    .create(
        {
            session: "techbuy",
            multidevice: true,
            headless: false, // <-- MUDE AQUI para false
            useChrome: false,
            disableWelcome: true
        },
        (base64Qrimg) => {
            // CAPTURA DO QR CODE
            qrCodeBase64 = base64Qrimg;
            console.log("📸 QR Code atualizado. Acesse http://localhost:3000/qrcode.html");
        },
        (status) => {
            console.log('Status da sessão:', status);
        }
    )
    .then((bot) => {
        client = bot;

        // Monitora o estado da conexão
        client.onStateChange(async (state) => {
            console.log('🤖 Status do Bot:', state);
            conectado = state === 'CONNECTED';
            
            // Se o estado for 'CONNECTED', mas a flag de logado ainda não foi setada, logamos
            if (conectado && !client.isLogged) {
                client.isLogged = true; 
                console.log("✅ Bot logado e pronto para enviar mensagens!");
            }
            
            if (!conectado) qrCodeBase64 = "";
        });
        

        // LÓGICA DO CHATBOT (Resposta automática)
        client.onMessage(async (mensagem) => {
            if (!mensagem.isGroupMsg) {
                // Passa o mapa de textos locais para a lógica de resposta
                await processarMensagem(client, mensagem, vendedores, controleMensagens, menuPadrao, textos);
            }
        });
    })
    .catch((err) => {
        console.error("❌ Erro ao iniciar o bot:", err);
    });

// --- Rotas da API ---

app.get("/qr", (req, res) => {
    res.json({ qr: qrCodeBase64 });
});

app.get("/status", (req, res) => {
    res.json({ conectado });
});

app.post("/enviar", async (req, res) => {
    
    // 1. Check de inicialização
    if (!client) {
        return res.status(400).json({ status: "erro", mensagem: "Bot ainda não inicializou o cliente." });
    }

    // 2. Check de Login e Status com resiliência (CRÍTICO PARA ESTABILIDADE)
    let estaLogado = await client.isLoggedIn();
    
    // Tenta esperar um pouco se não estiver logado instantaneamente (Resolve problemas de timing)
    if (!estaLogado) {
        console.log("⚠️ Conexão instável. Aguardando 2 segundos para estabilizar...");
        await sleep(2000); // Espera 2 segundos
        estaLogado = await client.isLoggedIn(); // Tenta novamente
    }

    if (!estaLogado) {
        // Retorna o erro se falhar o segundo check
        return res.status(400).json({ status: "erro", mensagem: "Bot não está conectado ou a sessão caiu. Verifique o QR Code." });
    }


    const { nome, mensagem, contatos, menu, btn1, btn2, btn3 } = req.body;
    const lista = JSON.parse(contatos);
    const resultados = [];

    for (const numero of lista) {
        const registro = { nome, numero, mensagem, status: "sucesso" };
        try {
            if (req.file) {
                // req.file é fornecido pelo multer
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
            
            salvarHistorico(registro);
            resultados.push(registro);
        } catch (err) {
            registro.status = "erro";
            registro.erro = err.message;
            salvarHistorico(registro);
            resultados.push(registro);
        }
    }

    res.json({ status: "sucesso", enviados: resultados });
});

app.get("/historico", (req, res) => {
    if (!fs.existsSync(caminhoHistorico)) return res.json([]);
    try {
        const dados = JSON.parse(fs.readFileSync(caminhoHistorico, 'utf-8'));
        res.json(dados);
    } catch (err) {
        res.status(500).json({ status: "erro", mensagem: "Erro ao ler histórico." });
    }
});

app.get("/vendedores", (req, res) => {
    carregarVendedores(); 
    res.json(vendedores);
});

app.post("/vendedores", (req, res) => {
    const novosDados = req.body;

    try {
        fs.writeFileSync(caminhoVendedores, JSON.stringify(novosDados, null, 2));
        vendedores = novosDados;
        res.json({ status: "sucesso", mensagem: "Vendedores atualizados com sucesso!" });
    } catch (err) {
        res.status(500).json({ status: "erro", mensagem: "Erro ao salvar vendedores." });
    }
});

app.post("/salvar-menu", (req, res) => {
    const novosDados = req.body;

    try {
        fs.writeFileSync(caminhoMenu, JSON.stringify(novosDados, null, 2));
        menuPadrao = novosDados;
        res.json({ status: "sucesso", mensagem: "Menu atualizado com sucesso!" });
    } catch (err) {
        res.status(500).json({ status: "erro", mensagem: "Erro ao salvar menu." });
    }
});

// Rotas para as páginas HTML (não alteradas)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/qrcode.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "qrcode.html"));
});

app.get("/painel", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "painel.html"));
});

app.get("/ver-historico", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "historico.html"));
});

app.get("/menu", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "menu.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});