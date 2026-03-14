window.ExportPanel = function ExportPanel({ settings, onSetFormats, onPickOutputDir, onRunExport }) {
  const root = document.getElementById('export-panel');
  root.innerHTML = `
    <h2>Eksport</h2>
    <label><input id="fmt-html" type="checkbox" ${settings.formats.html ? 'checked' : ''}/> MHTML (pełna strona)</label><br />
    <label><input id="fmt-pdf" type="checkbox" ${settings.formats.pdf ? 'checked' : ''}/> PDF</label><br />
    <label><input id="fmt-txt" type="checkbox" ${settings.formats.txt ? 'checked' : ''}/> TXT</label><br />
    <p class="small">Output: ${settings.outputDir}</p>
    <button id="pick-output">Wybierz katalog</button>
    <button id="run-export">Zapisz zaznaczone</button>
  `;

  function collectFormats() {
    return {
      html: root.querySelector('#fmt-html').checked,
      pdf: root.querySelector('#fmt-pdf').checked,
      txt: root.querySelector('#fmt-txt').checked,
    };
  }

  ['#fmt-html', '#fmt-pdf', '#fmt-txt'].forEach((selector) => {
    root.querySelector(selector).addEventListener('change', () => onSetFormats(collectFormats()));
  });

  root.querySelector('#pick-output').addEventListener('click', onPickOutputDir);
  root.querySelector('#run-export').addEventListener('click', onRunExport);
};
