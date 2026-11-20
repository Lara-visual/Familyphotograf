/* ==========================================================================
   Андрей Демидов — семейный фотограф
   Интерактив: меню, табы, карусель, модалки, форма заявки
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     Блокировка скролла (учитывает несколько открытых слоёв)
     ---------------------------------------------------------------------- */
  let lockCount = 0;
  function lockScroll(lock) {
    lockCount = Math.max(0, lockCount + (lock ? 1 : -1));
    document.body.classList.toggle('is-locked', lockCount > 0);
  }

  /* ----------------------------------------------------------------------
     Хедер
     ---------------------------------------------------------------------- */
  const header = $('#header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ----------------------------------------------------------------------
     Мобильное меню
     ---------------------------------------------------------------------- */
  const menu = $('#mobile-menu');
  const overlay = $('#menu-overlay');
  const burger = $('.burger');
  const closeMenuBtn = $('[data-close-menu]');
  let menuTrigger = null;

  function openMenu() {
    menuTrigger = document.activeElement;
    overlay.hidden = false;
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    lockScroll(true);
    closeMenuBtn.focus();
    document.addEventListener('keydown', onMenuKeydown);
  }

  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    overlay.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    lockScroll(false);
    document.removeEventListener('keydown', onMenuKeydown);
    if (menuTrigger) menuTrigger.focus();
  }

  function onMenuKeydown(e) {
    if (e.key === 'Escape') closeMenu();
    if (e.key !== 'Tab') return;
    const focusables = $$('a[href], button:not([disabled])', menu);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  burger.addEventListener('click', openMenu);
  overlay.addEventListener('click', closeMenu);
  closeMenuBtn.addEventListener('click', closeMenu);
  $$('#mobile-menu a[href^="#"]').forEach((link) => link.addEventListener('click', closeMenu));

  /* ----------------------------------------------------------------------
     Появление блоков при скролле
     ---------------------------------------------------------------------- */
  const revealTargets = $$('.section__head, .pain, .step, .solutions__head, .tabs, .panels, .video, .about__media, .about__content, .include, .guarantee, .offer-card, .carousel, .price-flow, .price-note, .section__cta, .final__inner, .hero__content, .hero__media, .portfolio__actions');
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach((el) => io.observe(el));
  }

  /* ----------------------------------------------------------------------
     Табы портфолио
     ---------------------------------------------------------------------- */
  const tabs = $$('.tab');
  const panels = $$('.panel');

  function activateTab(index) {
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panels[i].hidden = !isActive;
      panels[i].classList.toggle('is-active', isActive);
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      activateTab(next);
      tabs[next].focus();
    });
  });

  /* ----------------------------------------------------------------------
     Индикатор прокрутки табов
     ---------------------------------------------------------------------- */
  const tabsWrap = $('.tabs-wrap');
  const tabsEl = $('.tabs');

  function updateTabsFade() {
    if (!tabsWrap || !tabsEl) return;
    const max = tabsEl.scrollWidth - tabsEl.clientWidth;
    tabsWrap.classList.toggle('is-faded', max > 4 && tabsEl.scrollLeft < max - 4);
  }

  if (tabsEl) {
    tabsEl.addEventListener('scroll', updateTabsFade, { passive: true });
    window.addEventListener('resize', updateTabsFade);
    updateTabsFade();
  }

  /* ----------------------------------------------------------------------
     Карусель отзывов
     ---------------------------------------------------------------------- */
  const carousel = $('#carousel');
  const dotsWrap = $('#carousel-dots');
  const reviews = $$('.review', carousel);

  if (carousel && dotsWrap) {
    const dots = reviews.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => {
        carousel.scrollTo({ left: reviews[i].offsetLeft - carousel.offsetLeft, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    const updateCarouselState = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      const isScrollable = maxScroll > 4;
      $$('.carousel__controls .arrow').forEach((a) => { a.style.visibility = isScrollable ? '' : 'hidden'; });

      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let active = 0;
      reviews.forEach((r, i) => {
        if (center >= r.offsetLeft - carousel.offsetLeft) active = i;
      });
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === active)));

      const prev = $('[data-slide="prev"]');
      const next = $('[data-slide="next"]');
      if (prev) prev.disabled = carousel.scrollLeft <= 4;
      if (next) next.disabled = carousel.scrollLeft >= maxScroll - 4;
    };

    carousel.addEventListener('scroll', () => window.requestAnimationFrame(updateCarouselState), { passive: true });
    window.addEventListener('resize', updateCarouselState);

    $$('[data-slide]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = reviews[0];
        const step = card ? card.getBoundingClientRect().width + 24 : carousel.clientWidth;
        const dir = btn.dataset.slide === 'next' ? 1 : -1;
        carousel.scrollBy({ left: dir * step, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });

    updateCarouselState();
  }

  /* ----------------------------------------------------------------------
     Модальные окна
     ---------------------------------------------------------------------- */
  const modals = $$('.modal');
  let modalTrigger = null;
  let activeModal = null;

  function focusablesIn(container) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
      .filter((el) => el.offsetParent !== null);
  }

  function openModal(modal) {
    if (!modal) return;
    modalTrigger = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    lockScroll(true);
    const target = $('input, select, textarea, button', modal) || modal;
    window.setTimeout(() => target.focus({ preventScroll: true }), 60);
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (activeModal === modal) activeModal = null;
    lockScroll(false);
    document.removeEventListener('keydown', onModalKeydown);
    if (modalTrigger) modalTrigger.focus({ preventScroll: true });
    if (modal.id === 'video-modal') stopPlayer();
  }

  function onModalKeydown(e) {
    if (!activeModal) return;
    if (e.key === 'Escape') { closeModal(activeModal); return; }
    if (e.key !== 'Tab') return;
    const list = focusablesIn(activeModal);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  $$('[data-open-modal]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    closeMenu();
    openModal($('#modal'));
  }));
  $$('[data-close-modal]').forEach((btn) => btn.addEventListener('click', () => closeModal($('#modal'))));

  /* ----------------------------------------------------------------------
     Форма заявки
     ---------------------------------------------------------------------- */
  const form = $('#booking-form');
  const formWrap = $('[data-form-wrap]');
  const successBlock = $('[data-success]');

  // Приём заявок: Google Apps Script → Google Sheets (см. booking/apps-script.gs).
  // Вставьте сюда URL веб-приложения — он заканчивается на /exec.
  // Пока строка пустая, работает демо-режим: заявка никуда не уходит.
  const BOOKING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw_bwZjgBz_8h7FGRdjBV1LWAeD8-S0XW_cS3MKIjI1iTlYE9vdST-Oc3mBP4RUn_QIiA/exec';

  function setError(name, message) {
    const field = form.elements[name];
    const error = $(`[data-error-for="${name}"]`);
    if (field && field.classList && field.type !== 'checkbox') {
      field.classList.toggle('is-invalid', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    if (error) {
      error.textContent = message || '';
      error.classList.toggle('is-visible', Boolean(message));
    }
  }

  function digitsOnly(value) {
    return value.replace(/\D/g, '');
  }

  function formatPhone(value) {
    let d = digitsOnly(value);
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = '+7';
    if (p.length) out += ` (${p.slice(0, 3)}`;
    if (p.length >= 3) out += ')';
    if (p.length > 3) out += ` ${p.slice(3, 6)}`;
    if (p.length > 6) out += `-${p.slice(6, 8)}`;
    if (p.length > 8) out += `-${p.slice(8, 10)}`;
    return out;
  }

  if (form) {
    const phoneInput = form.elements.phone;
    phoneInput.addEventListener('input', () => {
      phoneInput.value = formatPhone(phoneInput.value);
      setError('phone', '');
    });
    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value) phoneInput.value = '+7 (';
    });
    phoneInput.addEventListener('blur', () => {
      if (digitsOnly(phoneInput.value).length <= 1) phoneInput.value = '';
    });

    form.elements.name.addEventListener('input', () => setError('name', ''));
    form.elements.consent.addEventListener('change', () => setError('consent', ''));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const name = form.elements.name.value.trim();
      if (name.length < 2) {
        setError('name', 'Напишите, как к вам обращаться');
        valid = false;
      }

      const digits = digitsOnly(phoneInput.value);
      if (digits.length !== 11) {
        setError('phone', 'Введите номер телефона полностью');
        valid = false;
      }

      if (!form.elements.consent.checked) {
        setError('consent', 'Без согласия я не смогу перезвонить');
        valid = false;
      }

      if (!valid) {
        const firstInvalid = $('.field__input.is-invalid', form) || form.elements.consent;
        firstInvalid.focus();
        return;
      }

      const submitBtn = $('button[type="submit"]', form);
      const initialLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляю…';

      const payload = {
        name,
        phone: phoneInput.value,
        contact: form.elements.contact.value,
        comment: form.elements.comment.value.trim(),
        page: window.location.href,
        sentAt: new Date().toISOString()
      };

      try {
        if (BOOKING_ENDPOINT) {
          // Apps Script не отдаёт CORS-заголовки, поэтому отправляем «простой»
          // запрос: без preflight и без чтения ответа. Сбой доставки здесь
          // не виден — проверяйте появление строки в таблице.
          await fetch(BOOKING_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
        } else {
          // Демо-режим: заявка никуда не уходит, пока не задан BOOKING_ENDPOINT.
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          console.info('[demo] заявка:', payload);
        }

        formWrap.hidden = true;
        successBlock.hidden = false;
        form.reset();
        $('.modal__dialog', $('#modal')).scrollTop = 0;
        const successTitle = $('h2', successBlock);
        if (successTitle) successTitle.focus?.();
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = initialLabel;
        setError('phone', 'Не удалось отправить. Позвоните мне: +7 999 000-00-00');
      }
    });
  }

  // Сброс модалки в исходное состояние при закрытии
  $$('[data-close-modal]').forEach((btn) => btn.addEventListener('click', () => {
    window.setTimeout(() => {
      if (!formWrap || !successBlock) return;
      formWrap.hidden = false;
      successBlock.hidden = true;
      const submitBtn = $('button[type="submit"]', form);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить заявку';
      }
    }, 300);
  }));

  /* ----------------------------------------------------------------------
     Видео-превью
     ---------------------------------------------------------------------- */
  const videoModal = $('#video-modal');
  const player = $('#player');
  const frames = player ? $$('.player__frame', player) : [];
  let playerTimer = null;
  let frameIndex = 0;

  function startPlayer() {
    if (!player || frames.length < 2) return;
    frameIndex = 0;
    frames.forEach((f, i) => f.classList.toggle('is-active', i === 0));
    player.classList.remove('is-playing');
    void player.offsetWidth; // перезапуск CSS-анимации прогресса
    player.classList.add('is-playing');

    playerTimer = window.setInterval(() => {
      frames[frameIndex].classList.remove('is-active');
      frameIndex = (frameIndex + 1) % frames.length;
      frames[frameIndex].classList.add('is-active');
    }, 3000);
  }

  function stopPlayer() {
    if (playerTimer) window.clearInterval(playerTimer);
    playerTimer = null;
    if (player) player.classList.remove('is-playing');
  }

  $$('[data-open-video]').forEach((btn) => btn.addEventListener('click', () => {
    openModal(videoModal);
    window.setTimeout(startPlayer, 120);
  }));
  $$('[data-close-video]').forEach((btn) => btn.addEventListener('click', () => closeModal(videoModal)));

  /* ----------------------------------------------------------------------
     Липкая мобильная CTA
     ---------------------------------------------------------------------- */
  const stickyCta = $('#sticky-cta');
  const onScrollSticky = () => {
    if (!stickyCta) return;
    const show = window.scrollY > 600 && !document.body.classList.contains('is-locked');
    stickyCta.hidden = !show;
  };
  onScrollSticky();
  window.addEventListener('scroll', onScrollSticky, { passive: true });

  /* ----------------------------------------------------------------------
     Мелочи
     ---------------------------------------------------------------------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
