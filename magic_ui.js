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
    if (!ring || !panel || !form || !error || !name || !latin || !greek || !restore) return;

    function quiet() {
      ring.classList.remove('is-divining', 'is-awakened');
      panel.classList.remove('is-revealing');
    }
    name.addEventListener('input', quiet);
    latin.addEventListener('input', quiet);
    greek.addEventListener('input', quiet);
    restore.addEventListener('click', quiet);

    form.addEventListener('submit', () => {
      ring.classList.remove('is-awakened');
      panel.classList.remove('is-revealing');
      ring.classList.add('is-divining');
    });

    // Existing application code owns calculations and result visibility.
    // Observe only that public UI state, never wrap or change run()/render().
    const resultObserver = new MutationObserver(() => {
      if (panel.hidden) {
        quiet();
      } else {
        ring.classList.remove('is-divining');
        ring.classList.add('is-awakened');
        panel.classList.remove('is-revealing');
        // Reflow so repeat searches restart the brief entrance transition.
        void panel.offsetWidth;
        panel.classList.add('is-revealing');
      }
    });
    resultObserver.observe(panel, {attributes: true, attributeFilter: ['hidden']});

    // Invalid input and unavailable data stop the decorative spinning.
    const errorObserver = new MutationObserver(() => {
      if (error.textContent.trim()) ring.classList.remove('is-divining');
    });
    errorObserver.observe(error, {childList: true, subtree: true, characterData: true});
  });
})();
