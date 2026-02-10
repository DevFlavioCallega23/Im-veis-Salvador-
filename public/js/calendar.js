function criarCalendario({ elementId, endpoint, whatsapp }) {
  const calendarEl = document.getElementById(elementId);
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    height: 'auto',
    eventClick(info) {
      if (info.event.title === 'Disponível' && whatsapp) {
        const data = info.event.startStr;
        const msg = `Olá! Tenho interesse em reservar o dia ${data}.`;
        window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    }
  });

  calendar.render();

  fetch(endpoint)
    .then(res => res.json())
    .then(diasOcupados => {
      const hoje = new Date();
      const dias = [];

      // Gera 6 meses de calendário
      for (let i = 0; i < 180; i++) {
        const d = new Date();
        d.setDate(hoje.getDate() + i);
        
        // Formata como YYYY-MM-DD local
        const dataLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dias.push(dataLocal);
      }

      const eventosDisponiveis = dias
        .filter(d => !diasOcupados.includes(d))
        .map(d => ({ title: 'Disponível', start: d, color: '#28a745' }));

      const eventosIndisponiveis = diasOcupados.map(d => ({
        title: 'Ocupado',
        start: d,
        color: '#dc3545',
        display: 'background' // Fica mais elegante visualmente
      }));

      calendar.addEventSource([...eventosDisponiveis, ...eventosIndisponiveis]);
    });
}