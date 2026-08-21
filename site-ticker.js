(() => {
  const utilityContext = 'Denizli merkezli · Türkiye geneli hizmet';
  const slogans = [
    'Standartları sahada yaşatır.',
    'Riski görünür, aksiyonu uygulanabilir kılar.',
    'Denetime değil, sürdürülebilir sisteme hazırlar.',
    'ISO, İSG ve kurumsal gelişimi tek yol haritasında buluşturur.',
    'Kâğıt üzerindeki sistemi sahada çalışan düzene dönüştürür.',
    'Ölçülebilir gelişim için net sorumluluklar oluşturur.'
  ];

  const createTicker = () => {
    const ticker = document.createElement('div');
    const stage = document.createElement('div');

    ticker.className = 'site-slogan-ticker';
    ticker.setAttribute('role', 'region');
    ticker.setAttribute('aria-label', `Goway sloganları: ${slogans.join(' ')}`);
    stage.className = 'site-slogan-stage';
    stage.setAttribute('aria-hidden', 'true');

    slogans.forEach((slogan, index) => {
      const item = document.createElement('span');
      item.className = 'site-slogan-item';
      item.style.setProperty('--ticker-delay', `${index * 7}s`);
      item.textContent = slogan;
      stage.append(item);
    });

    ticker.append(stage);
    return ticker;
  };

  const utility = document.querySelector('.utility');
  if (utility) {
    const container = utility.querySelector('.container');
    if (!container || container.querySelector('.site-slogan-ticker')) return;

    let context = container.querySelector(':scope > span');
    const phone = container.querySelector(':scope > a');
    if (!context) {
      context = document.createElement('span');
      container.prepend(context);
    }
    context.classList.add('utility-context');
    context.textContent = utilityContext;
    if (phone) {
      phone.href = 'tel:+905334390003';
      phone.textContent = '+90 533 439 00 03';
    }
    container.insertBefore(createTicker(), phone || null);
    return;
  }

  const header = document.querySelector('.site-header');
  if (!header) return;

  const generatedUtility = document.createElement('div');
  const container = document.createElement('div');
  const context = document.createElement('span');
  const phone = document.createElement('a');

  generatedUtility.className = 'utility utility-generated';
  container.className = 'container';
  context.className = 'utility-context';
  context.textContent = utilityContext;
  phone.href = 'tel:+905334390003';
  phone.textContent = '+90 533 439 00 03';
  container.append(context, createTicker(), phone);
  generatedUtility.append(container);
  header.before(generatedUtility);
})();
