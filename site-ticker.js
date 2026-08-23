(() => {
  const config = window.GOWAY_SITE_CONFIG || {};
  const site = config.site || {};
  const navigation = config.navigation || {};
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const legalPages = new Set(['404.html', 'cerez-politikasi.html', 'gizlilik-politikasi.html', 'kvkk-aydinlatma-metni.html', 'kullanim-sartlari.html']);
  const popupExcluded = new Set([...legalPages, 'on-gorusme.html', 'iletisim.html']);
  const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  const track = (eventName, detail = {}) => {
    const safeDetail = Object.fromEntries(Object.entries(detail).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)));
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...safeDetail });
    window.dispatchEvent(new CustomEvent('goway:analytics', { detail: { event: eventName, ...safeDetail } }));
  };
  window.gowayTrack = track;

  const createTicker = () => {
    const slogans = config.slogans || ['Standartları sahada yaşatır.'];
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

  const activeNavigationPage = () => {
    const primary = navigation.primary || [];
    if (primary.some((item) => item.href === currentPage)) return currentPage;
    if ((navigation.sectorPages || []).includes(currentPage)) return 'sektorel-cozumler.html';
    if ((navigation.resourcePages || []).includes(currentPage)) return 'kaynaklar.html';
    if ((navigation.servicePages || []).includes(currentPage)) return 'hizmetler.html';
    return '';
  };

  const ensureSharedHeader = () => {
    const header = document.querySelector('.site-header');
    const container = header?.querySelector(':scope > .container');
    const nav = container?.querySelector(':scope > .page-nav, :scope > .nav-links');
    if (!header || !container || !nav) return;
    container.querySelector('.brand')?.removeAttribute('aria-label');

    nav.id = nav.id || 'site-navigation';
    nav.classList.add('nav-links');
    nav.setAttribute('aria-label', 'Ana menü');
    const activePage = activeNavigationPage();
    nav.replaceChildren(...(navigation.primary || []).map((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      if (item.href === activePage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      return link;
    }));

    let toggle = container.querySelector('.menu-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'menu-toggle';
      toggle.innerHTML = '<span></span><span></span><span></span><span class="visually-hidden">Menüyü aç</span>';
      container.insertBefore(toggle, nav);
    }
    if (toggle.parentElement !== container) container.insertBefore(toggle, nav);
    if (toggle.querySelectorAll(':scope > span:not(.visually-hidden)').length !== 3) toggle.innerHTML = '<span></span><span></span><span></span><span class="visually-hidden">Menüyü aç</span>';
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-expanded', 'false');

    if (!container.querySelector(':scope > .header-actions')) {
      const actions = document.createElement('div');
      actions.className = 'header-actions';
      actions.innerHTML = '<a class="button primary header-cta" href="on-gorusme.html">Ücretsiz Ön Görüşme</a>';
      container.append(actions);
    }

    let backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'nav-backdrop';
      backdrop.setAttribute('aria-label', 'Menüyü kapat');
      backdrop.hidden = true;
      header.after(backdrop);
    }

    let returnFocus = null;
    const mobileQuery = window.matchMedia('(max-width: 820px)');
    const placeNavigation = () => {
      if (mobileQuery.matches) document.body.append(nav);
      else container.insertBefore(nav, container.querySelector('.header-actions'));
    };
    placeNavigation();
    mobileQuery.addEventListener('change', placeNavigation);
    const setOpen = (open) => {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.visually-hidden').textContent = open ? 'Menüyü kapat' : 'Menüyü aç';
      backdrop.hidden = !open;
      if (open) {
        returnFocus = document.activeElement;
        track('nav_open', { page: currentPage });
        requestAnimationFrame(() => nav.querySelector('a')?.focus());
      } else if (returnFocus && document.contains(returnFocus)) {
        returnFocus.focus();
      }
    };
    toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    nav.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (event) => {
      if (!document.body.classList.contains('menu-open')) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
      if (event.key !== 'Tab') return;
      const items = [...nav.querySelectorAll(focusableSelector)];
      if (!items.length) return;
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 821px)').addEventListener('change', (event) => { if (event.matches) setOpen(false); });
  };

  const ensureUtility = () => {
    if (document.querySelector('.topbar')) return;
    let utility = document.querySelector('.utility');
    const header = document.querySelector('.site-header');
    if (!utility && header) {
      utility = document.createElement('div');
      utility.className = 'utility utility-generated';
      utility.innerHTML = '<div class="container"><span class="utility-context"></span><a></a></div>';
      header.before(utility);
    }
    const container = utility?.querySelector('.container');
    if (!container) return;
    let context = container.querySelector(':scope > span');
    let phone = container.querySelector(':scope > a');
    if (!context) { context = document.createElement('span'); container.prepend(context); }
    if (!phone) { phone = document.createElement('a'); container.append(phone); }
    context.classList.add('utility-context');
    context.textContent = site.address || 'Denizli · Türkiye geneli hizmet';
    phone.href = site.phoneHref || 'tel:+905334390003';
    phone.textContent = site.phone || '+90 533 439 00 03';
    if (!container.querySelector('.site-slogan-ticker')) container.insertBefore(createTicker(), phone);
  };

  const applySiteIdentity = () => {
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.href = site.phoneHref || 'tel:+905334390003';
      if (!link.closest('.mobile-action-bar')) link.textContent = site.phone || '+90 533 439 00 03';
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.href = site.emailHref || 'mailto:goway@gowaydanismanlik.com';
      link.textContent = site.email || 'goway@gowaydanismanlik.com';
    });
  };

  const ensureMobileActions = () => {
    if (legalPages.has(currentPage) || document.querySelector('.mobile-action-bar')) return;
    const bar = document.createElement('nav');
    bar.className = 'mobile-action-bar';
    bar.setAttribute('aria-label', 'Hızlı iletişim');
    bar.innerHTML = `<a href="${site.phoneHref || 'tel:+905334390003'}" data-contact-action="call"><span aria-hidden="true">☎</span><strong>Ara</strong></a><a href="https://wa.me/905334390003" target="_blank" rel="noopener" data-contact-action="whatsapp"><span aria-hidden="true">◉</span><strong>WhatsApp</strong></a><a href="on-gorusme.html" data-contact-action="consultation"><span aria-hidden="true">↗</span><strong>Ön Görüşme</strong></a>`;
    document.body.append(bar);
    const form = document.querySelector('[data-consultation-form]');
    if (form && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => bar.classList.toggle('is-form-visible', entries.some((entry) => entry.isIntersecting)), { threshold: 0.15 }).observe(form);
    }
  };

  const ensureFooterTrust = () => {
    const footer = document.querySelector('.site-footer, .home-footer');
    if (!footer || footer.querySelector('.footer-trust-badges')) return;
    const badges = document.createElement('nav');
    badges.className = 'footer-trust-badges container';
    badges.setAttribute('aria-label', 'Veri ve bağlantı güveni');
    badges.innerHTML = '<a href="gizlilik-politikasi.html"><span aria-hidden="true">✓</span><strong>Şifreli bağlantı</strong></a><a href="kvkk-aydinlatma-metni.html"><span aria-hidden="true">✓</span><strong>KVKK bilgilendirmesi</strong></a><a href="gizlilik-politikasi.html#veri-minimizasyonu"><span aria-hidden="true">✓</span><strong>Veri minimizasyonu</strong></a>';
    const legal = footer.querySelector('.footer-legal-row, .home-footer-legal');
    if (legal) footer.insertBefore(badges, legal);
    else footer.append(badges);
  };

  const setFieldError = (form, name, message = '') => {
    const field = form.elements[name];
    const error = form.querySelector(`[data-error-for="${name}"]`);
    const fields = field instanceof RadioNodeList ? [...field] : field ? [field] : [];
    fields.forEach((control) => {
      control.setAttribute('aria-invalid', String(Boolean(message)));
      if (message) control.setAttribute('aria-describedby', error?.id || 'formStatus');
      else if (control.getAttribute('aria-describedby') === error?.id) control.removeAttribute('aria-describedby');
    });
    if (error) error.textContent = message;
  };

  const initializeConsultationForm = (form) => {
    const status = form.querySelector('[data-form-status]');
    const params = new URLSearchParams(window.location.search);
    const sourcePage = form.elements.source_page;
    const sourceOffer = form.elements.source_offer;
    if (sourcePage) sourcePage.value = currentPage;
    if (sourceOffer) sourceOffer.value = params.get('kaynak') || '';

    const service = form.elements.service;
    const sector = form.elements.sector;
    const requestedService = params.get('hizmet');
    const requestedSector = params.get('sektor');
    const setSelectValue = (select, value) => {
      if (!select || !value || value.length > 120) return;
      let option = [...select.options].find((item) => item.value === value || item.dataset.slug === value);
      if (!option) { option = new Option(value, value); select.add(option); }
      select.value = option.value;
    };
    setSelectValue(service, requestedService);
    setSelectValue(sector, requestedSector);
    const contextNote = document.getElementById('contextNote');
    if (contextNote && (requestedService || requestedSector)) {
      const parts = [requestedService, requestedSector].filter(Boolean);
      contextNote.textContent = `Form ${parts.join(' · ')} kapsamıyla hazırlandı.`;
      contextNote.dataset.visible = 'true';
    }

    const validate = () => {
      let valid = true;
      form.querySelectorAll('[data-error-for]').forEach((error) => { error.textContent = ''; });
      form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.setAttribute('aria-invalid', 'false'));
      const method = form.elements.contact_method?.value || 'farketmez';
      const phone = form.elements.phone?.value.trim() || '';
      const email = form.elements.email?.value.trim() || '';
      if ((method === 'telefon' && !phone) || (method === 'farketmez' && !phone && !email)) {
        setFieldError(form, 'phone', method === 'telefon' ? 'Telefonla dönüş için numaranızı girin.' : 'Telefon veya e-posta alanlarından en az birini girin.');
        valid = false;
      }
      if ((method === 'eposta' && !email) || (method === 'farketmez' && !phone && !email)) {
        setFieldError(form, 'email', method === 'eposta' ? 'E-postayla dönüş için adresinizi girin.' : 'Telefon veya e-posta alanlarından en az birini girin.');
        valid = false;
      }
      for (const field of form.querySelectorAll('[required]')) {
        if (field.type === 'checkbox' ? !field.checked : !field.value.trim()) {
          setFieldError(form, field.name, 'Bu alanı tamamlayın.');
          valid = false;
        }
      }
      if (form.elements.email?.value && !form.elements.email.validity.valid) { setFieldError(form, 'email', 'Geçerli bir e-posta adresi girin.'); valid = false; }
      return valid;
    };

    const focusFirstError = () => form.querySelector('[aria-invalid="true"]')?.focus();
    form.addEventListener('input', (event) => { if (event.target.name) setFieldError(form, event.target.name); });
    form.addEventListener('change', (event) => { if (event.target.name) setFieldError(form, event.target.name); });
    form.addEventListener('focusin', () => { if (!form.dataset.started) { form.dataset.started = 'true'; track('form_start', { page: currentPage }); } }, { once: true });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.textContent = '';
      status.dataset.state = '';
      if (!validate()) {
        status.textContent = 'Formda düzeltilmesi gereken alanlar var.';
        status.dataset.state = 'error';
        track('form_error', { page: currentPage, reason: 'validation' });
        focusFirstError();
        return;
      }
      const payload = new FormData(form);
      const subject = `Goway ön görüşme talebi · ${payload.get('service') || 'Genel'}`;
      const body = [
        `Ad soyad: ${payload.get('name') || ''}`,
        `Şirket: ${payload.get('company') || '-'}`,
        `İletişim tercihi: ${payload.get('contact_method') || '-'}`,
        `Telefon: ${payload.get('phone') || '-'}`,
        `E-posta: ${payload.get('email') || '-'}`,
        `Hizmet: ${payload.get('service') || '-'}`,
        `Sektör: ${payload.get('sector') || '-'}`,
        `Kaynak sayfa: ${payload.get('source_page') || currentPage}`,
        `Kaynak teklif: ${payload.get('source_offer') || '-'}`,
        '',
        'Mesaj:',
        payload.get('message') || ''
      ].join('\n');
      const email = (site.emailHref || 'mailto:goway@gowaydanismanlik.com').replace(/^mailto:/, '');
      status.textContent = 'E-posta uygulamanızda düzenleyebileceğiniz bir talep taslağı hazırlanıyor.';
      status.dataset.state = 'success';
      sessionStorage.setItem('goway-converted', '1');
      track('form_handoff', { page: currentPage, service: requestedService || 'selected' });
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.focus();
    });
    track('form_view', { page: currentPage });
  };

  const initializeResourceFilters = () => {
    const cards = [...document.querySelectorAll('[data-resource-card]')];
    const filters = [...document.querySelectorAll('[data-resource-filter]')];
    if (!cards.length || !filters.length) return;
    const count = document.querySelector('[data-resource-count]');
    const empty = document.querySelector('[data-resource-empty]');
    const render = () => {
      let visible = 0;
      cards.forEach((card) => {
        const matches = filters.every((filter) => !filter.value || card.dataset[filter.dataset.resourceFilter] === filter.value);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      if (count) count.textContent = `${visible} kaynak gösteriliyor.`;
      if (empty) empty.hidden = visible > 0;
    };
    filters.forEach((filter) => filter.addEventListener('change', render));
    render();
  };

  const initializeExitOffer = () => {
    if (popupExcluded.has(currentPage) || sessionStorage.getItem('goway-converted') || sessionStorage.getItem('goway-resource-downloaded')) return;
    const lastShown = Number(localStorage.getItem('goway-exit-offer-shown') || 0);
    if (Date.now() - lastShown < 14 * 24 * 60 * 60 * 1000) return;
    const isResource = currentPage === 'kaynaklar.html';
    const isSector = currentPage.startsWith('sektor-');
    const heading = isResource ? 'Kontrol listesini çalışma planına çevirelim' : isSector ? `${document.querySelector('h1')?.textContent || 'Sektörünüz'} için ilk adımı netleştirin` : 'Ayrılmadan önce doğru başlangıç noktasını bulun';
    const copy = isResource ? 'İndirdiğiniz kaynağı işletmenizin kapsamına göre yorumlamak için 15 dakikalık ön görüşme planlayın.' : 'Hedef tarihinizi ve öncelikli riskinizi paylaşın; hangi hizmetle başlamanız gerektiğini birlikte belirleyelim.';
    const dialog = document.createElement('dialog');
    dialog.className = 'exit-offer';
    dialog.setAttribute('aria-labelledby', 'exit-offer-title');
    const params = new URLSearchParams();
    if (isSector) params.set('sektor', currentPage.replace(/^sektor-|\.html$/g, ''));
    if (isResource) params.set('kaynak', 'kaynak-merkezi');
    dialog.innerHTML = `<button class="exit-offer-close" type="button" aria-label="Teklifi kapat">×</button><p class="eyebrow">Ücretsiz ön görüşme</p><h2 id="exit-offer-title">${heading}</h2><p>${copy}</p><div class="hero-actions"><a class="button primary" href="on-gorusme.html?${params}">15 dakikalık görüşme isteyin</a><button class="button secondary exit-offer-dismiss" type="button">Şimdi değil</button></div>`;
    document.body.append(dialog);
    let eligibleByTime = false, shown = false, previousFocus = null;
    const show = () => {
      if (shown || !eligibleByTime || window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) < (matchMedia('(pointer:fine)').matches ? 0.3 : 0.6)) return;
      shown = true;
      previousFocus = document.activeElement;
      localStorage.setItem('goway-exit-offer-shown', String(Date.now()));
      dialog.classList.toggle('is-mobile-offer', !matchMedia('(pointer:fine)').matches);
      dialog.showModal();
      dialog.querySelector('.exit-offer-close').focus();
      track('popup_view', { page: currentPage, variant: isResource ? 'resource' : isSector ? 'sector' : 'general' });
    };
    const close = () => { if (!dialog.open) return; dialog.close(); track('popup_close', { page: currentPage }); previousFocus?.focus(); };
    dialog.querySelector('.exit-offer-close').addEventListener('click', close);
    dialog.querySelector('.exit-offer-dismiss').addEventListener('click', close);
    dialog.querySelector('a').addEventListener('click', () => track('popup_convert', { page: currentPage }));
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.open) { event.preventDefault(); close(); } });
    if (matchMedia('(pointer:fine)').matches) {
      window.setTimeout(() => { eligibleByTime = true; }, 20000);
      document.addEventListener('mouseout', (event) => { if (!event.relatedTarget && event.clientY <= 8) show(); });
    } else {
      window.setTimeout(() => { eligibleByTime = true; show(); }, 45000);
      window.addEventListener('scroll', show, { passive: true });
    }
  };

  ensureUtility();
  ensureSharedHeader();
  applySiteIdentity();
  ensureMobileActions();
  ensureFooterTrust();
  document.querySelectorAll('[data-consultation-form]').forEach(initializeConsultationForm);
  initializeResourceFilters();
  initializeExitOffer();

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    if (link.matches('[href^="tel:"]')) track('click_call', { page: currentPage });
    if (link.matches('[href*="wa.me"]')) track('click_whatsapp', { page: currentPage });
    if (link.matches('[data-resource-download]')) {
      sessionStorage.setItem('goway-resource-downloaded', '1');
      track('resource_download', { page: currentPage, resource: link.dataset.resourceDownload, format: link.textContent.trim() });
    }
    if (link.closest('.sector-page')) track('sector_cta', { page: currentPage });
  });
})();
