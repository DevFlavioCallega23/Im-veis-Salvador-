/*
  reserva.js
  Botão de reserva via WhatsApp
*/

function configurarReserva({ telefone, mensagem }) {
  const botao = document.querySelector('.reserva-btn');

  if (!botao) {
    console.error('❌ Botão de reserva não encontrado');
    return;
  }

  botao.addEventListener('click', () => {
    const texto = encodeURIComponent(
      `Olá! Gostaria de reservar o imóvel: ${mensagem}`
    );

    const url = `https://wa.me/${telefone}?text=${texto}`;
    window.open(url, '_blank');
  });
}
