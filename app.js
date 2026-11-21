// Simple dengue risk viewer. Data comes from data.js (DATES, WARDS, MODEL).
// Idea: rain that fell 2-4 weeks ago predicts dengue cases now.

const wardSelect = document.getElementById('ward');
const weekSelect = document.getElementById('week');

// Friendly names for the model's inputs
const LABELS = {
  rain_2w_ago: 'Rain 2 weeks ago',
  rain_3w_ago: 'Rain 3 weeks ago',
  rain_4w_ago: 'Rain 4 weeks ago',
  temp_3w_ago: 'Temperature 3 weeks ago',
  humidity_3w_ago: 'Humidity 3 weeks ago',
  water_logging: 'Water-logging risk',
  sanitation: 'Sanitation (better = safer)',
  crowding: 'Crowding (people/km²)'
};

// Small helper: make an element with text (safe, never uses innerHTML)
function el(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}

// ---------- Fill the dropdowns ----------
function fillDropdowns() {
  // Wards grouped by city
  const cities = [...new Set(WARDS.map(w => w.city))];
  for (const city of cities) {
    const group = document.createElement('optgroup');
    group.label = city;
    for (const w of WARDS.filter(x => x.city === city)) {
      const o = el('option', w.id.replace(/_/g, ' '));
      o.value = w.id;
      group.appendChild(o);
    }
    wardSelect.appendChild(group);
  }
  // Weeks: newest first. Need 4 earlier weeks to look back, so skip the first 4.
  for (let i = DATES.length - 1; i >= 4; i--) {
    const o = el('option', 'Week of ' + DATES[i]);
    o.value = i;
    weekSelect.appendChild(o);
  }
}

// ---------- The "model": a weighted sum of inputs ----------
function getInputs(ward, i) {
  return {
    rain_2w_ago: ward.rain[i - 2],
    rain_3w_ago: ward.rain[i - 3],
    rain_4w_ago: ward.rain[i - 4],
    temp_3w_ago: ward.temp[i - 3],
    humidity_3w_ago: ward.hum[i - 3],
    water_logging: ward.wl,
    sanitation: ward.san,
    crowding: ward.density / 10000
  };
}

function predict(inputs) {
  let total = MODEL.intercept;
  const parts = {};
  MODEL.features.forEach((name, k) => {
    total += MODEL.coef[k] * inputs[name];
    // contribution = how much this input moves the result vs an average case
    parts[name] = MODEL.coef[k] * (inputs[name] - MODEL.means[name]);
  });
  return { cases: Math.max(0, total), parts };
}

function tierFor(cases) {
  const [c1, c2, c3] = MODEL.cuts;
  if (cases < c1) return 'Low';
  if (cases < c2) return 'Medium';
  if (cases < c3) return 'High';
  return 'Critical';
}

// ---------- Draw the page ----------
function render() {
  const ward = WARDS.find(w => w.id === wardSelect.value);
  const i = Number(weekSelect.value);
  if (!ward || !Number.isInteger(i) || i < 4 || i >= DATES.length) return;

  const result = predict(getInputs(ward, i));
  const tier = tierFor(result.cases);

  const badge = document.getElementById('tier');
  badge.textContent = tier;
  badge.className = 'badge ' + tier;
  document.getElementById('cases').textContent = result.cases.toFixed(1);

  // Drivers: biggest effect first
  const drivers = document.getElementById('drivers');
  drivers.replaceChildren();
  const sorted = Object.entries(result.parts).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxAbs = Math.max(...sorted.map(([, v]) => Math.abs(v)), 0.01);
  for (const [name, value] of sorted) {
    const row = el('div', undefined, 'row');
    const track = el('div', undefined, 'track');
    const bar = el('div', undefined, 'bar ' + (value >= 0 ? 'up' : 'down'));
    bar.style.width = (Math.abs(value) / maxAbs * 50) + '%';
    track.appendChild(bar);
    row.append(el('span', LABELS[name]), track,
               el('span', (value >= 0 ? '+' : '') + value.toFixed(1), 'num'));
    drivers.appendChild(row);
  }

  // Past weather table (1 to 4 weeks before the selected week)
  const history = document.getElementById('history');
  history.replaceChildren();
  for (let k = 0; k <= 4; k++) {
    const tr = document.createElement('tr');
    const label = k === 0 ? 'This week' : k + ' week' + (k > 1 ? 's' : '') + ' ago';
    tr.append(el('td', label), el('td', ward.rain[i - k]),
              el('td', ward.temp[i - k]), el('td', ward.hum[i - k]));
    history.appendChild(tr);
  }
  document.getElementById('ward-info').textContent =
    ward.city + ' · water-logging risk ' + ward.wl + ' · sanitation ' + ward.san +
    ' · ' + ward.density.toLocaleString() + ' people/km²';

  // What actually happened: this week and the next 4
  const actual = document.getElementById('actual');
  actual.replaceChildren();
  for (let k = 0; k <= 4; k++) {
    const tr = document.createElement('tr');
    const known = i + k < DATES.length;
    tr.append(el('td', known ? DATES[i + k] + (k === 0 ? ' (selected week)' : k >= 2 ? ' (in prediction window)' : '') : 'not recorded yet'),
              el('td', known ? ward.cases[i + k] : '-'));
    actual.appendChild(tr);
  }
}

fillDropdowns();
wardSelect.addEventListener('change', render);
weekSelect.addEventListener('change', render);
document.getElementById('footer').textContent =
  'Simple model fitted on data before ' + MODEL.test_from + '. Test error: average miss ' +
  MODEL.mae + ' cases (RMSE ' + MODEL.rmse + ').';
render();
