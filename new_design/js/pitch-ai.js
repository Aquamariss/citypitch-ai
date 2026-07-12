(function () {
  const KEY = 'pitch-ai-theme';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getTheme() {
    try {
      return localStorage.getItem(KEY) || 'dark';
    } catch (_) {
      return 'dark';
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (_) {}
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
      el.textContent = theme === 'dark' ? 'Светлая' : 'Тёмная';
    });
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    });
  }

  function toggleTheme() {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  function showToast(message) {
    var toast = document.querySelector('[data-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('data-toast', '');
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  function setFieldError(field, message) {
    if (!field) return;
    var input = field.querySelector('input, textarea');
    var err = field.querySelector('.field-error');
    field.classList.add('has-error');
    if (input) {
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');
      if (err && err.id) input.setAttribute('aria-describedby', err.id);
    }
    if (err) {
      err.textContent = message;
      err.classList.add('is-visible');
    }
  }

  function clearFieldError(field) {
    if (!field) return;
    var input = field.querySelector('input, textarea');
    var err = field.querySelector('.field-error');
    field.classList.remove('has-error');
    if (input) {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
    }
    if (err) {
      err.textContent = '';
      err.classList.remove('is-visible');
    }
  }

  function updateRecordUi(studio, btn) {
    if (!studio || !btn) return;
    var state = studio.getAttribute('data-state') || 'idle';
    var hint = document.querySelector('[data-dock-hint]');
    btn.classList.toggle('recording', state === 'recording');
    btn.classList.toggle('countdown-active', state === 'countdown');
    if (state === 'idle') {
      btn.setAttribute('aria-label', 'Начать запись');
      if (hint) hint.textContent = 'Запись';
    } else if (state === 'countdown') {
      btn.setAttribute('aria-label', 'Отменить обратный отсчёт');
      if (hint) hint.textContent = 'Отмена';
    } else if (state === 'recording') {
      btn.setAttribute('aria-label', 'Остановить запись');
      if (hint) hint.textContent = 'Стоп';
    }
  }

  function setRulesOpen(open) {
    var drawer = document.querySelector('[data-rules-drawer]');
    var toggle = document.querySelector('[data-action="toggle-rules"]');
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var closeBtn = drawer.querySelector('[data-action="close-rules"]');
      if (closeBtn) closeBtn.focus();
    }
  }

  setTheme(getTheme());

  /* Collapse draft on mobile by default */
  var draftPanel = document.querySelector('[data-draft-panel]');
  var draftToggle = document.querySelector('[data-action="toggle-draft"]');
  if (draftPanel && window.matchMedia('(max-width: 767px)').matches) {
    draftPanel.classList.remove('is-open');
    if (draftToggle) draftToggle.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', function (e) {
    var themeBtn = e.target.closest('[data-action="toggle-theme"]');
    if (themeBtn) toggleTheme();

    var otpNext = e.target.closest('[data-action="otp-send"]');
    if (otpNext) {
      e.preventDefault();
      var emailStep = document.querySelector('[data-otp-step="email"]');
      var codeStep = document.querySelector('[data-otp-step="code"]');
      var emailField = document.querySelector('[data-field="email"]');
      var emailInput = document.querySelector('#login-email');
      clearFieldError(emailField);
      var email = emailInput ? emailInput.value.trim() : '';
      if (!email) {
        setFieldError(emailField, 'Введите email');
        if (emailInput) emailInput.focus();
        return;
      }
      if (!EMAIL_RE.test(email)) {
        setFieldError(emailField, 'Похоже на опечатку — проверьте формат email');
        if (emailInput) emailInput.focus();
        return;
      }
      if (emailStep) emailStep.hidden = true;
      if (codeStep) {
        codeStep.hidden = false;
        var sentTo = document.querySelector('[data-otp-email]');
        if (sentTo) sentTo.textContent = email;
        var codeInput = codeStep.querySelector('input');
        if (codeInput) codeInput.focus();
      }
    }

    var otpBack = e.target.closest('[data-action="otp-back"]');
    if (otpBack) {
      e.preventDefault();
      var emailStep2 = document.querySelector('[data-otp-step="email"]');
      var codeStep2 = document.querySelector('[data-otp-step="code"]');
      var codeField = document.querySelector('[data-field="code"]');
      clearFieldError(codeField);
      if (codeStep2) codeStep2.hidden = true;
      if (emailStep2) emailStep2.hidden = false;
      var emailAgain = document.querySelector('#login-email');
      if (emailAgain) emailAgain.focus();
    }

    var otpConfirm = e.target.closest('[data-action="otp-confirm"]');
    if (otpConfirm) {
      e.preventDefault();
      var codeField2 = document.querySelector('[data-field="code"]');
      var codeInput2 = document.querySelector('#login-code');
      clearFieldError(codeField2);
      var code = codeInput2 ? codeInput2.value.replace(/\D/g, '') : '';
      if (code.length !== 6) {
        setFieldError(codeField2, 'Введите 6-значный код из письма');
        if (codeInput2) codeInput2.focus();
        return;
      }
      window.location.href = 'pitch-writer.html';
    }

    var draftToggleBtn = e.target.closest('[data-action="toggle-draft"]');
    if (draftToggleBtn) {
      var panel = document.querySelector('[data-draft-panel]');
      if (panel) panel.classList.toggle('is-open');
      draftToggleBtn.setAttribute(
        'aria-expanded',
        panel && panel.classList.contains('is-open') ? 'true' : 'false'
      );
    }

    var modeBtn = e.target.closest('[data-action="set-mode"]');
    if (modeBtn) {
      var mode = modeBtn.getAttribute('data-mode');
      document.querySelectorAll('[data-action="set-mode"]').forEach(function (b) {
        var on = b === modeBtn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var studio = document.querySelector('[data-studio]');
      if (studio) studio.setAttribute('data-mode', mode);
    }

    var rulesToggle = e.target.closest('[data-action="toggle-rules"], [data-action="close-rules"]');
    if (rulesToggle) {
      var drawer = document.querySelector('[data-rules-drawer]');
      var willOpen = drawer && !drawer.classList.contains('is-open');
      if (rulesToggle.getAttribute('data-action') === 'close-rules') willOpen = false;
      else if (rulesToggle.classList.contains('rules-backdrop')) willOpen = false;
      else willOpen = !(drawer && drawer.classList.contains('is-open'));
      setRulesOpen(willOpen);
    }

    var recordBtn = e.target.closest('[data-action="toggle-record"]');
    if (recordBtn) {
      var studioEl = document.querySelector('[data-studio]');
      var state = studioEl ? studioEl.getAttribute('data-state') : 'idle';
      if (state === 'idle') startCountdown(studioEl, recordBtn);
      else if (state === 'countdown') cancelCountdown(studioEl, recordBtn);
      else if (state === 'recording') stopRecording(studioEl, recordBtn);
    }

    var cueTab = e.target.closest('[data-cue]');
    if (cueTab) {
      document.querySelectorAll('[data-cue]').forEach(function (t) {
        var on = t === cueTab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      var id = cueTab.getAttribute('data-cue');
      document.querySelectorAll('[data-cue-panel]').forEach(function (p) {
        var match = p.getAttribute('data-cue-panel') === id;
        p.hidden = !match;
        p.setAttribute('aria-hidden', match ? 'false' : 'true');
      });
    }

    var blockTab = e.target.closest('[data-block]');
    if (blockTab) {
      document.querySelectorAll('[data-block]').forEach(function (t) {
        var on = t === blockTab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      var bid = blockTab.getAttribute('data-block');
      document.querySelectorAll('[data-block-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-block-panel') !== bid;
      });
    }

    var chatSend = e.target.closest('[data-action="chat-send"]');
    if (chatSend) {
      e.preventDefault();
      sendChat();
    }

    var playBtn = e.target.closest('[data-action="toggle-play"]');
    if (playBtn) {
      var playing = playBtn.classList.toggle('is-playing');
      playBtn.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
      playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      var iconPlay = playBtn.querySelector('[data-icon="play"]');
      var iconPause = playBtn.querySelector('[data-icon="pause"]');
      if (iconPlay) iconPlay.hidden = playing;
      if (iconPause) iconPause.hidden = !playing;
      var track = playBtn.closest('.player-bar, .review-preview') ||
        document.querySelector('[data-player-track]');
      var fill = document.querySelector('[data-player-fill]');
      if (playing && fill) {
        fill.style.width = fill.style.width || '8%';
        clearInterval(playBtn._tick);
        playBtn._tick = setInterval(function () {
          var w = parseFloat(fill.style.width) || 0;
          if (w >= 100) {
            clearInterval(playBtn._tick);
            playBtn.classList.remove('is-playing');
            playBtn.setAttribute('aria-label', 'Воспроизвести');
            if (iconPlay) iconPlay.hidden = false;
            if (iconPause) iconPause.hidden = true;
            return;
          }
          fill.style.width = Math.min(100, w + 1.2) + '%';
        }, 200);
      } else {
        clearInterval(playBtn._tick);
      }
    }

    var procRetry = e.target.closest('[data-action="proc-retry"]');
    if (procRetry) {
      e.preventDefault();
      startProcessing(true);
    }

    var downloadBtn = e.target.closest('[data-action="download-result"]');
    if (downloadBtn) {
      showToast('Отчёт будет доступен после подключения бэкенда');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setRulesOpen(false);

    if (e.key === 'Enter' && e.target && e.target.id === 'writer-input') {
      e.preventDefault();
      sendChat();
    }
  });

  document.addEventListener('input', function (e) {
    if (!e.target) return;
    if (e.target.classList && e.target.classList.contains('input-error')) {
      var field = e.target.closest('.field');
      clearFieldError(field);
    }
    if (e.target.id === 'writer-input') {
      var sendBtn = document.querySelector('[data-action="chat-send"]');
      if (sendBtn) sendBtn.disabled = !e.target.value.trim();
    }
    if (e.target.id === 'login-code') {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    }
  });

  var writerInput = document.querySelector('#writer-input');
  var chatSendBtn = document.querySelector('[data-action="chat-send"]');
  if (chatSendBtn) chatSendBtn.disabled = !(writerInput && writerInput.value.trim());

  function appendChat(list, role, text) {
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg--' + role;
    row.setAttribute('data-od-id', 'chat-msg-' + Date.now());
    if (role === 'ai') {
      row.innerHTML = '<div class="chat-avatar" aria-hidden="true">AI</div><div class="chat-bubble"></div>';
      row.querySelector('.chat-bubble').textContent = text;
    } else if (role === 'typing') {
      row.className = 'chat-msg chat-msg--ai chat-msg--typing';
      row.innerHTML =
        '<div class="chat-avatar" aria-hidden="true">AI</div>' +
        '<div class="chat-bubble" aria-label="AI печатает">' +
        '<span class="typing-dots"><span></span><span></span><span></span></span></div>';
    } else {
      row.innerHTML = '<div class="chat-bubble"></div>';
      row.querySelector('.chat-bubble').textContent = text;
    }
    list.appendChild(row);
    list.scrollTop = list.scrollHeight;
    return row;
  }

  function sendChat() {
    var input = document.querySelector('#writer-input');
    var list = document.querySelector('[data-chat-list]');
    var sendBtn = document.querySelector('[data-action="chat-send"]');
    if (!input || !list || !input.value.trim()) return;
    appendChat(list, 'user', input.value.trim());
    var text = input.value.trim();
    input.value = '';
    if (sendBtn) sendBtn.disabled = true;
    var typing = appendChat(list, 'typing');
    setTimeout(function () {
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      appendChat(
        list,
        'ai',
        'Уточните цифры рынка: какой TAM/SAM вы используете? Добавлю блок «Рынок» в черновик.'
      );
      var market = document.querySelector('[data-block-panel="market"] textarea');
      if (market && !market.value.includes('TAM')) {
        market.value = (market.value ? market.value + '\n\n' : '') +
          'TAM / SAM — уточнить по вашему ответу: «' + text.slice(0, 80) + '»';
      }
    }, 700);
  }

  var countdownTimer = null;
  var recordTimer = null;
  var recordSeconds = 0;

  function startCountdown(studio, btn) {
    if (!studio) return;
    studio.setAttribute('data-state', 'countdown');
    updateRecordUi(studio, btn);
    var overlay = document.querySelector('[data-countdown]');
    var num = document.querySelector('[data-countdown-num]');
    if (overlay) overlay.hidden = false;
    var n = 3;
    if (num) num.textContent = String(n);
    countdownTimer = setInterval(function () {
      n -= 1;
      if (n <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        if (overlay) overlay.hidden = true;
        startRecording(studio, btn);
      } else if (num) {
        num.textContent = String(n);
      }
    }, 1000);
  }

  function cancelCountdown(studio, btn) {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
    var overlay = document.querySelector('[data-countdown]');
    if (overlay) overlay.hidden = true;
    if (studio) studio.setAttribute('data-state', 'idle');
    updateRecordUi(studio, btn);
    showToast('Отсчёт отменён');
  }

  function startRecording(studio, btn) {
    studio.setAttribute('data-state', 'recording');
    updateRecordUi(studio, btn);
    var badge = document.querySelector('[data-rec-badge]');
    if (badge) badge.hidden = false;
    recordSeconds = 0;
    updateTimer();
    recordTimer = setInterval(function () {
      recordSeconds += 1;
      updateTimer();
    }, 1000);
  }

  function stopRecording(studio, btn) {
    if (recordTimer) clearInterval(recordTimer);
    studio.setAttribute('data-state', 'idle');
    updateRecordUi(studio, btn);
    var badge = document.querySelector('[data-rec-badge]');
    if (badge) badge.hidden = true;
    window.location.href = 'review.html';
  }

  function updateTimer() {
    var el = document.querySelector('[data-timer]');
    if (!el) return;
    var m = Math.floor(recordSeconds / 60);
    var s = recordSeconds % 60;
    var label = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    el.textContent = label;
    el.setAttribute('aria-label', 'Длительность записи ' + label);
  }

  var recordBtnInit = document.querySelector('[data-action="toggle-record"]');
  var studioInit = document.querySelector('[data-studio]');
  if (recordBtnInit && studioInit) updateRecordUi(studioInit, recordBtnInit);

  /* Processing */
  var processingTick = null;

  function startProcessing(reset) {
    var processing = document.querySelector('[data-processing]');
    if (!processing) return;
    var errorEl = document.querySelector('[data-proc-error]');
    var actions = document.querySelector('[data-proc-actions]');
    var steps = processing.querySelectorAll('[data-proc-step]');
    var bar = document.querySelector('[data-proc-bar]');
    var live = document.querySelector('[data-proc-live]');
    processing.classList.remove('is-error');
    if (errorEl) errorEl.hidden = true;
    if (actions) actions.hidden = true;
    if (reset) {
      steps.forEach(function (step, idx) {
        step.classList.toggle('done', false);
        step.classList.toggle('active', idx === 0);
      });
      if (bar) bar.style.width = '8%';
    }
    var i = 0;
    if (processingTick) clearInterval(processingTick);
    processingTick = setInterval(function () {
      i += 1;
      steps.forEach(function (step, idx) {
        step.classList.toggle('done', idx < i);
        step.classList.toggle('active', idx === i);
      });
      if (bar) bar.style.width = Math.min(100, (i / steps.length) * 100) + '%';
      var track = document.querySelector('.proc-track[role="progressbar"]');
      if (track) track.setAttribute('aria-valuenow', String(Math.min(100, Math.round((i / steps.length) * 100))));
      if (live && steps[Math.min(i, steps.length - 1)]) {
        live.textContent = steps[Math.min(i, steps.length - 1)].textContent.trim();
      }
      if (i >= steps.length) {
        clearInterval(processingTick);
        setTimeout(function () { window.location.href = 'result.html'; }, 700);
      }
    }, 900);
  }

  if (document.querySelector('[data-processing]')) {
    startProcessing(false);
    /* Demo error path: ?error=1 */
    if (/[?&]error=1/.test(location.search)) {
      clearInterval(processingTick);
      var processing = document.querySelector('[data-processing]');
      var errorEl = document.querySelector('[data-proc-error]');
      var actions = document.querySelector('[data-proc-actions]');
      if (processing) {
        processing.classList.add('is-error');
        processing.setAttribute('aria-busy', 'false');
      }
      if (errorEl) errorEl.hidden = false;
      if (actions) actions.hidden = false;
      var live = document.querySelector('[data-proc-live]');
      if (live) live.textContent = 'Ошибка анализа. Можно повторить.';
    }
  }

  /* History empty demo: ?empty=1 */
  if (/[?&]empty=1/.test(location.search)) {
    var list = document.querySelector('[data-od-id="attempt-list"]');
    var empty = document.querySelector('[data-od-id="history-empty"]');
    var chart = document.querySelector('[data-od-id="progress-chart"]');
    if (list) list.hidden = true;
    if (chart) chart.hidden = true;
    if (empty) empty.hidden = false;
  }

  window.PitchAI = {
    getTheme: getTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    showToast: showToast
  };
})();
