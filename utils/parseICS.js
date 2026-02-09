/*
FlavioCallega
08/10/25
WRW_BigBoss
*/
const ical = require('ical');
const axios = require('axios');

async function getDatasOcupadas(url) {
  const res = await axios.get(url);
  const data = res.data;
  const eventos = ical.parseICS(data);

  const datas = [];
  for (let k in eventos) {
    const ev = eventos[k];
    if (ev.type === 'VEVENT') {
      const dt = ev.start;
      datas.push(dt.toISOString().split('T')[0]); // formato YYYY-MM-DD
    }
  }

  return datas;
}

module.exports = { getDatasOcupadas };

