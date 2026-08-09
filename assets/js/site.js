const moneyLocales = { GBP: 'en-GB', EUR: 'fr-FR', USD: 'en-US' };
const money = (value, currency = 'USD') => Number(value || 0).toLocaleString(
  moneyLocales[currency] || 'en-US', {
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

  const amazonModes = {
    amazonUk: { ...bom.amazonAlternatives.uk, fieldPrefix: 'amazon' },
    amazonEu: { ...bom.amazonAlternatives.eu, fieldPrefix: 'amazonEu' },
    amazonUs: { ...bom.amazonAlternatives.us, fieldPrefix: 'amazonUs' },
  };
  const selectedMarket = () => amazonModes[sourceMode] || null;
  const marketField = (item, market, field) => item[`${market.fieldPrefix}${field}`];

  const drawSummary = () => {
    summary.textContent = '';
    const market = selectedMarket();
    const values = market
      ? [
        ['Grand total', money(market.totals.grand, market.currency)],
        ['Amazon basket', money(market.totals.amazonBasket, market.currency)],
        ['Specialist motors', money(market.totals.currentSuppliers, market.currency)],
        ['Vs current BOM (converted)', `+${money(market.totals.difference, market.currency)} (${market.totals.differencePercent}%)`],
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
      const market = selectedMarket();
      const row = document.createElement('tr');
      const amazonLink = market ? marketField(item, market, 'Link') : '';
      const useAmazon = Boolean(market && item.category !== 'Motors' && amazonLink);
      const selectedLink = useAmazon ? amazonLink : item.link;
      const source = document.createElement('span');
      if (selectedLink) {
        const link = Object.assign(document.createElement('a'), {
          href: selectedLink.startsWith('http') ? selectedLink : `https://${selectedLink}`,
          textContent: 'Open',
          target: '_blank',
          rel: 'noreferrer',
        });
        if (useAmazon) {
          const hostname = new URL(link.href).hostname;
          link.textContent = hostname.endsWith('.fr')
            ? 'Amazon FR'
            : hostname.endsWith('.de')
              ? 'Amazon DE'
              : hostname.endsWith('.com')
                ? 'Amazon US'
                : 'Amazon UK';
        } else if (market) {
          link.textContent = 'Specialist';
        }
        source.append(link);
      } else {
        source.textContent = market && item.category === 'Motors'
          ? 'Specialist quote'
          : 'TBC';
      }
      if (useAmazon) {
        const small = document.createElement('small');
        small.textContent = market.availabilityLabel;
        source.append(small);
      }

      let unitPrice = money(item.unitPrice);
      let totalPrice = money(item.total);
      if (market && item.category === 'Motors') {
        unitPrice = valueWithNote(
          money(item.unitPrice / market.fx.usdPerUnit, market.currency),
          'converted from USD',
        );
        totalPrice = money(item.total / market.fx.usdPerUnit, market.currency);
      } else if (useAmazon && marketField(item, market, 'Included')) {
        unitPrice = valueWithNote('Included', marketField(item, market, 'Included'));
        totalPrice = money(0, market.currency);
      } else if (useAmazon) {
        unitPrice = valueWithNote(
          money(marketField(item, market, 'Price'), market.currency),
          marketField(item, market, 'Pack'),
        );
        totalPrice = money(marketField(item, market, 'Total'), market.currency);
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
      const market = selectedMarket();
      if (sourceNote) {
        if (market) {
          const motorPricing = market.currency === 'USD'
            ? 'Motors keep their specialist USD prices.'
            : `Motors keep their specialist sources and are converted at 1 ${market.currency} = $${market.fx.usdPerUnit} (${market.fx.source}, ${market.fx.asOf}).`;
          sourceNote.textContent = `${market.note} ${motorPricing}`;
        } else {
          sourceNote.textContent = 'Original BOM estimates in USD. Quantities are the number required for one arm.';
        }
      }
      if (priceHeading) priceHeading.textContent = market ? 'Pack / listing' : 'Unit';
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
