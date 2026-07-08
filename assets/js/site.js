const money = value => Number(value || 0).toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const text = value => document.createTextNode(value ?? '');

const addIcons = () => {
  document.querySelectorAll('[data-icon]').forEach(el => {
    if (el.querySelector('i')) return;
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', el.dataset.icon);
    el.prepend(icon);
  });
  window.lucide?.createIcons();
};

const renderBuildSteps = async () => {
  const container = document.querySelector('#build-steps');
  if (!container) return;
  const response = await fetch('./assets/data/build-steps.json');
  const steps = await response.json();
  container.textContent = '';
  steps.forEach(step => {
    const article = document.createElement('article');
    article.className = 'build-step';

    const media = document.createElement('div');
    media.className = 'build-step-media';
    const img = document.createElement('img');
    img.src = step.image;
    img.alt = step.title;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      img.remove();
      media.append(text(`Image ${String(step.id).padStart(2, '0')}`));
    }, { once: true });
    media.append(img);

    const body = document.createElement('div');
    body.className = 'build-step-body';
    const kicker = document.createElement('div');
    kicker.className = 'build-step-kicker';
    kicker.textContent = `Step ${String(step.id).padStart(2, '0')} - ${step.phase}`;
    const title = document.createElement('h3');
    title.textContent = step.title;
    const copy = document.createElement('p');
    copy.textContent = step.description;
    body.append(kicker, title, copy);

    article.append(media, body);
    container.append(article);
  });
};

const renderBom = async () => {
  const tableBody = document.querySelector('#bom-table tbody');
  const summary = document.querySelector('#bom-summary');
  if (!tableBody || !summary) return;
  const response = await fetch('./assets/data/bom.json');
  const bom = await response.json();

  summary.innerHTML = '';
  [
    ['Grand total', money(bom.totals.grand)],
    ['Units counted', bom.totals.units],
    ['Categories', bom.categories.length],
    ['Estimate', 'Core arm parts'],
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = value;
    item.append(span, strong);
    summary.append(item);
  });

  tableBody.textContent = '';
  bom.items.forEach(item => {
    const row = document.createElement('tr');
    const source = item.link
      ? Object.assign(document.createElement('a'), {
        href: item.link.startsWith('http') ? item.link : `https://${item.link}`,
        textContent: 'Open',
        target: '_blank',
        rel: 'noreferrer',
      })
      : document.createElement('span');
    if (!item.link) source.textContent = 'TBC';

    [
      item.name,
      item.category,
      money(item.unitPrice),
      String(item.quantity),
      money(item.total),
      source,
    ].forEach(value => {
      const td = document.createElement('td');
      if (value instanceof Node) td.append(value);
      else td.textContent = value;
      row.append(td);
    });
    tableBody.append(row);
  });
};

addIcons();
renderBuildSteps();
renderBom();
