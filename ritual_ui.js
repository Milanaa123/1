'use strict';
/*
 * Stage-two presentation. The scientific catalogue, name conversion,
 * arithmetic, and matching remain owned by app.js / enhancements.js.
 * No names leave this page; nothing is stored.
 */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const byId = id => document.getElementById(id);
    const form = byId('form');
    const russian = byId('name'), latin = byId('latin'), greek = byId('greek');
    const stageOne = byId('ritualStep1'), stageTwo = byId('ritualStep2');
    const stageThree = byId('ritualStep3');
    const arrowOne = byId('ritualArrow1'), arrowTwo = byId('ritualArrow2');
    const nextLatin = byId('ritualToLatin'), nextGreek = byId('ritualToGreek');
    const expand = byId('ritualExpand'), action = byId('ritualFinalActions');
    const track = byId('ritualTrack');
    const live = byId('ritualLiveNumber'), state = byId('ritualScoreState');
    const sums = byId('ritualWordSums'), chips = byId('ritualLetterChips');
    const copy = byId('ritualCopyGreek'), copyStatus = byId('ritualCopyStatus');
    const resetLatin = byId('resetLatin'), resetGreek = byId('resetGreek');
    const flowStatus = byId('ritualFlowStatus');
    if ([form,russian,latin,greek,stageOne,stageTwo,stageThree,arrowOne,
      arrowTwo,nextLatin,nextGreek,expand,action,track,live,state,sums,
      chips,copy,copyStatus,resetLatin,resetGreek].some(x => !x)) return;
    if (typeof validGreek !== 'function' || typeof score !== 'function' ||
        typeof norm !== 'function' || typeof W === 'undefined') return;

    let stage = 1;
    let allOpen = false;
    const entries = Array.from(track.querySelectorAll('[data-ritual-step]'));
    const nameIsReady = () => {
      const raw = russian.value.trim();
      return /^[А-Яа-яЁё\s'’\-]+$/.test(raw) && /[А-Яа-яЁё]{2,}/.test(raw);
    };
    const latinIsReady = () =>
      typeof validLatinName === 'function' && validLatinName(latin.value);

    function announce(message) {
      if (flowStatus) flowStatus.textContent = message;
    }
    function markArrival(node) {
      node.classList.remove('ritual-arrived');
      void node.offsetWidth;
      node.classList.add('ritual-arrived');
    }
    function updateLayout() {
      const twoVisible = allOpen || stage >= 2;
      const threeVisible = allOpen || stage >= 3;
      const twoWasHidden = stageTwo.hidden;
      const threeWasHidden = stageThree.hidden;
      stageTwo.hidden = !twoVisible;
      arrowOne.hidden = !twoVisible;
      stageThree.hidden = !threeVisible;
      arrowTwo.hidden = !threeVisible;
      action.hidden = !threeVisible;
      nextLatin.hidden = twoVisible;
      nextGreek.hidden = threeVisible;
      expand.textContent = allOpen ? 'Пошаговый режим' : 'Показать все поля';
      expand.setAttribute('aria-pressed', String(allOpen));
      for (const item of entries) {
        const number = Number(item.dataset.ritualStep);
        const active = number === (allOpen ? 3 : stage);
        const visible = allOpen || number <= stage;
        item.dataset.status = active ? 'active' : visible ? 'done' : 'locked';
        if (active) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      }
      if (twoWasHidden && twoVisible) markArrival(stageTwo);
      if (threeWasHidden && threeVisible) markArrival(stageThree);
    }
    function moveTo(next, focusIt) {
      if (next === 2 && !nameIsReady()) {
        announce('Сначала введи полное имя на русском.');
        russian.focus();
        return false;
      }
      if (next === 3 && !latinIsReady()) {
        announce('Проверь написание латиницей.');
        if (stage < 2) stage = 2;
        updateLayout();
        latin.focus();
        return false;
      }
      if (stage < next) {
        stage = next;
        updateLayout();
        announce(next === 2
          ? 'Латинская запись открыта. Уточни оригинальное написание имени.'
          : 'Открыта древнегреческая запись. Проверь буквы и их числовую сумму.');
      }
      if (focusIt) (next === 2 ? latin : greek).focus();
      return true;
    }
    function weightRows(value) {
      chips.replaceChildren();
      const fragment = document.createDocumentFragment();
      for (const char of [...value.normalize('NFC')]) {
        if (/\s/.test(char)) {
          const gap = document.createElement('span');
          gap.className = 'ritual-letter-gap';
          gap.setAttribute('aria-hidden', 'true');
          fragment.append(gap);
          continue;
        }
        const normalized = norm(char);
        const weight = W[normalized];
        if (weight === undefined) continue; // punctuation never contributes
        const letter = document.createElement('span');
        letter.className = 'ritual-letter-chip';
        letter.title = char + ' — ' + weight;
        const glyph = document.createElement('span');
        glyph.className = 'ritual-glyph';
        glyph.textContent = char;
        const value = document.createElement('small');
        value.textContent = String(weight);
        letter.append(glyph,value);
        fragment.append(letter);
      }
      chips.append(fragment);
    }
    function updatePreview() {
      const phrase = greek.value.trim();
      if (!phrase || !validGreek(phrase)) {
        live.textContent = '—';
        state.textContent = phrase ? 'Исправь греческие символы' : 'Введи греческую запись';
        sums.textContent = '';
        chips.replaceChildren();
        return;
      }
      const total = score(phrase);
      live.textContent = total.toLocaleString('ru-RU');
      state.textContent = 'Предварительная сумма';
      sums.textContent = phrase.split(/\s+/).map(word =>
        word + ' (' + score(word).toLocaleString('ru-RU') + ')'
      ).join(' + ');
      weightRows(phrase);
    }
    nextLatin.addEventListener('click', () => moveTo(2, true));
    nextGreek.addEventListener('click', () => moveTo(3, true));
    expand.addEventListener('click', () => {
      allOpen = !allOpen;
      // Returning from full view must never unexpectedly hide a name
      // that the visitor has already typed into the later steps.
      if (!allOpen) {
        if (nameIsReady()) stage = Math.max(stage, 2);
        if (nameIsReady() && latinIsReady()) stage = 3;
      }
      updateLayout();
      announce(allOpen ? 'Открыты все три поля.' : 'Включён пошаговый режим.');
    });
    russian.addEventListener('input', () => {
      if (!russian.value.trim() && !allOpen) {
        stage = 1;
        updateLayout();
      } else if (!allOpen && stage < 2 && nameIsReady()) {
        moveTo(2, false);
      }
      updatePreview(); // app.js has already updated the downstream fields
      copyStatus.textContent = '';
    });
    latin.addEventListener('input', () => {
      updatePreview();
      copyStatus.textContent = '';
    });
    greek.addEventListener('input', () => {
      updatePreview();
      copyStatus.textContent = '';
    });
    resetLatin.addEventListener('click', () => {
      updatePreview();
      copyStatus.textContent = '';
    });
    resetGreek.addEventListener('click', () => {
      updatePreview();
      copyStatus.textContent = '';
    });

    // Capture phase: Enter must never submit hidden stages automatically.
    form.addEventListener('submit', event => {
      if (!allOpen && stage < 3) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (stage < 2) moveTo(2, true);
        else moveTo(3, true);
      }
    }, true);
    copy.addEventListener('click', async () => {
      const phrase = greek.value.trim();
      if (!phrase || !validGreek(phrase)) {
        copyStatus.textContent = 'Проверь греческую запись.';
        greek.focus();
        return;
      }
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw Error('No clipboard');
        await navigator.clipboard.writeText(phrase);
        copyStatus.textContent = 'Скопировано';
      } catch (_) {
        greek.focus();
        greek.select();
        copyStatus.textContent = 'Выделено — скопируй вручную';
      }
    });
    updateLayout();
    updatePreview();
  });
})();
