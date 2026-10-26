'use strict';
/*
 * Presentation-only magic for Animagia.
 * Never reads or sends the submitted names; never modifies scores or results.
 */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const ring = document.getElementById('arcaneAstrarium');
    const panel = document.getElementById('resultPanel');
    const form = document.getElementById('form');
    const error = document.getElementById('error');
    const name = document.getElementById('name');
    const latin = document.getElementById('latin');
    const greek = document.getElementById('greek');
    const restore = document.getElementById('resetGreek');
    const resetLatin = document.getElementById('resetLatin');
    const score = document.getElementById('score');
    if (!ring || !panel || !form || !error || !name || !latin || !greek || !restore || !resetLatin || !score) return;

    let awaitingResult = false;

    function quiet() {
      awaitingResult = false;
      ring.classList.remove('is-divining', 'is-awakened');
      panel.classList.remove('is-revealing');
    }
    function awaken() {
      if (panel.hidden || !awaitingResult) return;
      awaitingResult = false;
      ring.classList.remove('is-divining');
      ring.classList.add('is-awakened');
      // Restart entrance motion even when the previous result was already visible.
      panel.classList.remove('is-revealing');
      void panel.offsetWidth;
      panel.classList.add('is-revealing');
    }
    name.addEventListener('input', quiet);
    latin.addEventListener('input', quiet);
    greek.addEventListener('input', quiet);
    restore.addEventListener('click', quiet);
    resetLatin.addEventListener('click', quiet);

    form.addEventListener('submit', () => {
      awaitingResult = true;
      ring.classList.remove('is-awakened');
      panel.classList.remove('is-revealing');
      ring.classList.add('is-divining');
    });

    // Existing application code owns calculations and result visibility.
    // Observe only that public UI state, never wrap or change run()/render().
    const resultObserver = new MutationObserver(() => {
      if (panel.hidden) quiet();
      else awaken();
    });
    resultObserver.observe(panel, {attributes:true,attributeFilter:['hidden']});

    // A second search may update #score while the results container stays open.
    const scoreObserver = new MutationObserver(awaken);
    scoreObserver.observe(score, {childList:true,characterData:true,subtree:true});

    // Invalid input and unavailable data stop the decorative spinning.
    const errorObserver = new MutationObserver(() => {
      if (error.textContent.trim()) {
        awaitingResult = false;
        ring.classList.remove('is-divining');
      }
    });
    errorObserver.observe(error, {childList: true, subtree: true, characterData: true});
  });
})();
