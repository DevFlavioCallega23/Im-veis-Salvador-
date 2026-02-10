/*
  calendar.js
  Responsável por criar e carregar o calendário de disponibilidade
*/

function criarCalendario({ elementId, endpoint, whatsapp }) {
  const calendarEl = document.getElementById(elementId);

  if (!calendarEl) {
    console.error('❌ Elemento do calendário não encontrado:', elementId);
    return;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    height: 'auto',
    selectable: false,

    eventClick(info) {
      if (info.event.title === 'Disponível' && whatsapp) {
        const data = info.event.startStr;
        const msg = `Olá! Tenho interesse em reservar o dia ${data}.`;
        const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      }
    }
  });

  calendar.render();

  fetch(endpoint)
    .then(res => res.json())
    .then(diasOcupados => {
      const hoje = new Date();
      const meses = 6;
      const dias = [];

      for (let i = 0; i < meses * 31; i++) {
        const d = new Date(hoje);
        d.setDate(d.getDate() + i);
        dias.push(d.toISOString().split('T')[0]);
      }

      const eventosDisponiveis = dias
        .filter(d => !diasOcupados.includes(d))
        .map(d => ({
          title: 'Disponível',
          start: d,
          color: '#28a745'
        }));

      const eventosIndisponiveis = diasOcupados.map(d => ({
        title: 'Indisponível',
        start: d,
        color: '#dc3545'
      }));

      calendar.removeAllEvents();
      calendar.addEventSource([
        ...eventosDisponiveis,
        ...eventosIndisponiveis
      ]);
    })
    .catch(err => {
      console.error('❌ Erro ao carregar calendário:', err);
    });
}
