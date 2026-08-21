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

  const ensureSharedHeader = () => {
    const header = document.querySelector('.site-header');
    const container = header?.querySelector(':scope > .container');
    const nav = container?.querySelector(':scope > .page-nav');
    if (!header || !container || !nav) return;

    const primaryRoutes = [
      ['index.html', 'Ana Sayfa'],
      ['hizmetler.html', 'Hizmetler'],
      ['uzman-kadro.html', 'Uzman Kadro'],
      ['cozumler.html', 'Çözümler'],
      ['hakkimizda.html', 'Hakkımızda'],
      ['sss.html', 'SSS'],
      ['iletisim.html', 'İletişim']
    ];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const servicePages = [
      'iso-yonetim-sistemleri.html', 'iso-denetim-hazirligi.html', 'isg-yonetimi.html',
      'saha-guvenligi.html', 'yangin-acil-durum.html', 'kurumsal-egitim.html',
      'surdurulebilirlik.html', 'entegre-program.html', 'tekstil-standartlari.html',
      'cevre-danismanligi.html', 'tesvik-danismanligi.html', 'ciktilar.html',
      'ihtiyac-rehberi.html', 'katalog.html', 'calisma-modelleri.html', 'medya.html',
      'is-ortaklari.html'
    ];
    const activePage = primaryRoutes.some(([href]) => href === currentPage)
      ? currentPage
      : servicePages.includes(currentPage) ? 'hizmetler.html' : '';

    nav.classList.add('nav-links');
    nav.setAttribute('aria-label', 'Ana menü');
    nav.replaceChildren(...primaryRoutes.map(([href, label]) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      if (href === activePage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      return link;
    }));
    if (container.querySelector(':scope > .header-actions')) return;

    const actions = document.createElement('div');
    const cta = document.createElement('a');
    actions.className = 'header-actions';
    cta.className = 'button primary header-cta';
    cta.href = 'on-gorusme.html';
    cta.textContent = 'Ücretsiz Ön Görüşme';
    actions.append(cta);
    container.append(actions);
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
    ensureSharedHeader();
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
  ensureSharedHeader();
})();
