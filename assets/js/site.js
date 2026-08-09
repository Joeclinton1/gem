const money = (value, currency = 'USD') => Number(value || 0).toLocaleString(
  currency === 'GBP' ? 'en-GB' : 'en-US', {
    style: 'currency',
    currency,
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
  const sourceButtons = document.querySelectorAll('[data-bom-source]');
  const sourceNote = document.querySelector('#bom-source-note');
  const priceHeading = document.querySelector('[data-bom-price-heading]');
  if (!tableBody || !summary || !sourceButtons.length) return;
  const response = await fetch('./assets/data/bom.json');
  const bom = await response.json();
  let sourceMode = 'current';

  const amazon = bom.amazonAlternative;
  const checkedAt = new Date(`${amazon.checkedAt}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const drawSummary = () => {
    summary.textContent = '';
    const values = sourceMode === 'amazon'
      ? [
        ['Grand total', money(amazon.totals.grand, amazon.currency)],
        ['Amazon basket', money(amazon.totals.amazonBasket, amazon.currency)],
        ['Specialist motors', money(amazon.totals.currentSuppliers, amazon.currency)],
        ['Vs current BOM (converted)', `+${money(amazon.totals.difference, amazon.currency)} (${amazon.totals.differencePercent}%)`],
      ]
      : [
        ['Grand total', money(bom.totals.grand)],
        ['Units counted', bom.totals.units],
        ['Categories', bom.categories.length],
        ['Estimate', 'Core arm parts'],
      ];

    values.forEach(([label, value]) => {
      const item = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = label;
      const strong = document.createElement('strong');
      strong.textContent = value;
      item.append(span, strong);
      summary.append(item);
    });
  };

  const valueWithNote = (value, note) => {
    const wrapper = document.createElement('span');
    wrapper.append(text(value));
    if (note) {
      const small = document.createElement('small');
      small.textContent = note;
      wrapper.append(small);
    }
    return wrapper;
  };

  const drawItems = () => {
    tableBody.textContent = '';
    bom.items.forEach(item => {
      const row = document.createElement('tr');
      const useAmazon = sourceMode === 'amazon' && item.category !== 'Motors' && item.amazonLink;
      const selectedLink = useAmazon ? item.amazonLink : item.link;
      const source = document.createElement('span');
      if (selectedLink) {
        const link = Object.assign(document.createElement('a'), {
          href: selectedLink.startsWith('http') ? selectedLink : `https://${selectedLink}`,
          textContent: useAmazon ? 'Amazon' : 'Open',
          target: '_blank',
          rel: 'noreferrer',
        });
        if (sourceMode === 'amazon' && !useAmazon) link.textContent = 'Specialist';
        source.append(link);
      } else {
        source.textContent = sourceMode === 'amazon' && item.category === 'Motors'
          ? 'Specialist quote'
          : 'TBC';
      }
      if (useAmazon && item.amazonPrime) {
        const small = document.createElement('small');
        small.textContent = 'Prime eligible when checked';
        source.append(small);
      }

      let unitPrice = money(item.unitPrice);
      let totalPrice = money(item.total);
      if (sourceMode === 'amazon' && item.category === 'Motors') {
        unitPrice = valueWithNote(
          money(item.unitPrice / amazon.fx.gbpToUsd, amazon.currency),
          'converted from USD',
        );
        totalPrice = money(item.total / amazon.fx.gbpToUsd, amazon.currency);
      } else if (useAmazon && item.amazonIncluded) {
        unitPrice = valueWithNote('Included', item.amazonIncluded);
        totalPrice = '£0.00';
      } else if (useAmazon) {
        unitPrice = valueWithNote(
          money(item.amazonPrice, amazon.currency),
          item.amazonPack,
        );
        totalPrice = money(item.amazonTotal, amazon.currency);
      }

      [
        item.name,
        item.category,
        unitPrice,
        String(item.quantity),
        totalPrice,
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

  sourceButtons.forEach(button => {
    button.addEventListener('click', () => {
      sourceMode = button.dataset.bomSource;
      sourceButtons.forEach(candidate => {
        candidate.setAttribute('aria-pressed', String(candidate === button));
      });
      if (sourceNote) {
        sourceNote.textContent = sourceMode === 'amazon'
          ? `Amazon UK prices and Prime filter checked ${checkedAt}. Motors keep their specialist sources and are converted at £1 = $${amazon.fx.gbpToUsd} (${amazon.fx.source}, ${amazon.fx.asOf}). Recheck price and Prime at checkout.`
          : 'Original BOM estimates in USD. Quantities are the number required for one arm.';
      }
      if (priceHeading) priceHeading.textContent = sourceMode === 'amazon' ? 'Pack / listing' : 'Unit';
      drawSummary();
      drawItems();
    });
  });

  drawSummary();
  drawItems();
};

addIcons();
renderBuildSteps();
renderBom();
