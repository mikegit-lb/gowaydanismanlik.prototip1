(() => {
  const config = window.GOWAY_SITE_CONFIG || {};
  const site = config.site || {};
  const utilityContext = site.address || 'Denizli merkezli · Türkiye geneli hizmet';
  const slogans = config.slogans || ['Standartları sahada yaşatır.'];

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

    const primaryRoutes = (config.navigation?.primary || []).map((item) => [item.href, item.label]);
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const servicePages = config.navigation?.servicePages || [];
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

  const applySiteIdentity = () => {
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      if (site.phone) { link.href = site.phoneHref || 'tel:' + site.phone.replace(/\D/g, ''); link.textContent = site.phone; }
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      if (site.email) { link.href = site.emailHref || 'mailto:' + site.email; link.textContent = site.email; }
    });
    document.querySelectorAll('.utility-context, .footer-contact-block span, .home-footer-contact span').forEach((element) => {
      if (site.address) element.textContent = site.address;
    });
  };

  const ensureHeroMapping = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const heroConfig = config.heroes?.[currentPage];
    const picture = document.querySelector('.hero-media');
    if (!heroConfig || !picture) return;
    const srcset = (extension) => [400, 800, 1200, 1600].map((width) => `assets/hero/${heroConfig.asset}-${width}.${extension} ${width}w`).join(', ');
    picture.querySelector('source[type="image/avif"]')?.setAttribute('srcset', srcset('avif'));
    picture.querySelector('source[type="image/webp"]')?.setAttribute('srcset', srcset('webp'));
    const image = picture.querySelector('img');
    if (image) image.src = `assets/hero/${heroConfig.asset}-1200.webp`;
    const preload = document.querySelector('link[rel="preload"][as="image"]');
    if (preload) {
      preload.href = `assets/hero/${heroConfig.asset}-1200.webp`;
      preload.imagesrcset = srcset('webp');
    }
  };

  const utility = document.querySelector('.utility');
  ensureHeroMapping();
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
    if (phone && site.phone) {
      phone.href = site.phoneHref || 'tel:' + site.phone.replace(/\D/g, '');
      phone.textContent = site.phone;
    }
    container.insertBefore(createTicker(), phone || null);
    ensureSharedHeader();
    applySiteIdentity();
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
  phone.href = site.phoneHref || 'tel:' + (site.phone || '').replace(/\D/g, '');
  phone.textContent = site.phone || '';
  container.append(context, createTicker(), phone);
  generatedUtility.append(container);
  header.before(generatedUtility);
  ensureSharedHeader();
  applySiteIdentity();
})();
