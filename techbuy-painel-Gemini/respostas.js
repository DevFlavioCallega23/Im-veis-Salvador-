// respostas.js
// Variável global para controle de mensagens (para evitar spam)
const DUAS_HORAS = 2 * 60 * 60 * 1000;

/**
 * Processa a mensagem recebida pelo WhatsApp e envia a resposta apropriada.
 * @param {object} client - O objeto cliente do Venom-Bot.
 * @param {object} mensagem - O objeto de mensagem recebida.
 * @param {object} vendedores - O mapa de vendedores carregado.
 * @param {Map} controleMensagens - O mapa para controle de tempo de saudação.
 * @param {object} menuPadrao - As opções de botão do menu padrão (do menu.json).
 * @param {object} TEXTOS - O mapa de textos locais carregados do text.js.
 */
module.exports.processarMensagem = async (client, mensagem, vendedores, controleMensagens, menuPadrao, TEXTOS) => {
    const numero = mensagem.from;
    const corpo = mensagem.body ? mensagem.body.toLowerCase().trim() : '';
    const agora = Date.now();
    const ultima = controleMensagens.get(numero);

    // --- 1. Lógica de Resposta para Botões e Comandos Fixos ---
    const btn1Texto = menuPadrao.btn1.toLowerCase().trim();
    const btn2Texto = menuPadrao.btn2.toLowerCase().trim();
    const btn3Texto = menuPadrao.btn3.toLowerCase().trim();
    
    // Respostas baseadas nas opções configuradas no menu.json
    if (corpo === btn1Texto || corpo === '1') {
        return await client.sendText(numero, TEXTOS['RESPOSTA_BTN1']);
    }
    if (corpo === btn2Texto || corpo === '2') {
        return await client.sendText(numero, TEXTOS['RESPOSTA_BTN2']);
    }
    if (corpo === btn3Texto || corpo === '3') {
        return await client.sendText(numero, TEXTOS['RESPOSTA_BTN3']);
    }
    if (corpo === 'menu' || corpo === 'm') {
        // Envia o menu interativo
        const buttons = {
            title: TEXTOS['MENU_TITULO'],
            buttons: [
                { buttonText: { displayText: menuPadrao.btn1 } },
                { buttonText: { displayText: menuPadrao.btn2 } },
                { buttonText: { displayText: menuPadrao.btn3 } }
            ]
        };
        return await client.sendButtons(numero, TEXTOS['SAUDACAO_INICIAL'], buttons);
    }

    // --- 2. Resposta de Saudação Inicial (Controle de Spam) ---
    // Só responde se for a primeira vez ou se passaram 2 horas (para evitar flood)
    if (!ultima || agora - ultima > DUAS_HORAS) {
        const vendedor = vendedores[numero];
        
        if (vendedor) {
            // Cliente mapeado: Resposta de vendedor
            await client.sendText(numero, TEXTOS['SAUDACAO_VENDEDOR'].replace('{vendedor}', vendedor));
        } else {
            // Cliente novo: Envia saudação e o menu interativo
            const buttons = {
                title: TEXTOS['MENU_TITULO'],
                buttons: [
                    { buttonText: { displayText: menuPadrao.btn1 } },
                    { buttonText: { displayText: menuPadrao.btn2 } },
                    { buttonText: { displayText: menuPadrao.btn3 } }
                ]
            };
            await client.sendButtons(numero, TEXTOS['SAUDACAO_INICIAL'], buttons);
        }
        
        controleMensagens.set(numero, agora);
    }
    
    // Nenhuma resposta é enviada para mensagens não tratadas após a saudação.
};