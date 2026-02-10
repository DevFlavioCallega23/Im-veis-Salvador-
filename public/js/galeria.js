/*
  galeria.js
  Controla galeria de imagens e modal
*/

function iniciarGaleria(fotosPorCategoria) {
  const modal = document.getElementById('modal');
  const container = document.getElementById('imagens-categoria');
  const fechar = document.querySelector('.fechar');

  if (!modal || !container || !fechar) {
    console.error('❌ Estrutura do modal não encontrada');
    return;
  }

  function montarModal() {
    container.innerHTML = Object.entries(fotosPorCategoria)
      .map(([categoria, imagens]) => {
        const titulo = categoria.charAt(0).toUpperCase() + categoria.slice(1);

        return `
          <div class="categoria-bloco">
            <h3>${titulo}</h3>
            <div class="categoria-imagens">
              ${imagens.map(src => `<img src="${src}" alt="${categoria}">`).join('')}
            </div>
          </div>
        `;
      })
      .join('');
  }

  function abrirModal() {
    montarModal();
    modal.style.display = 'block';
  }

  function fecharModal() {
    modal.style.display = 'none';
  }

  // Clique nas imagens da galeria principal
  document.querySelectorAll('.galeria-airbnb img').forEach(img => {
    img.addEventListener('click', abrirModal);
  });

  fechar.addEventListener('click', fecharModal);

  window.addEventListener('click', e => {
    if (e.target === modal) fecharModal();
  });

  // Disponibiliza globalmente se quiser chamar manualmente
  window.abrirModal = abrirModal;
}
