window.TopBar = function TopBar({ onGo, onBack, onForward, onReload, onAddCurrent }) {
  const root = document.getElementById('topbar');
  root.innerHTML = `
    <h2>Nawigacja</h2>
    <button id="btn-back">Back</button>
    <button id="btn-forward">Forward</button>
    <button id="btn-reload">Reload</button>
    <input id="url-input" type="text" placeholder="https://chatgpt.com" />
    <button id="btn-go">Go</button>
    <hr />
    <button id="btn-add-current">Dodaj bieżący czat do kolejki</button>
  `;

  root.querySelector('#btn-go').addEventListener('click', () => onGo(root.querySelector('#url-input').value));
  root.querySelector('#btn-back').addEventListener('click', onBack);
  root.querySelector('#btn-forward').addEventListener('click', onForward);
  root.querySelector('#btn-reload').addEventListener('click', onReload);
  root.querySelector('#btn-add-current').addEventListener('click', onAddCurrent);
};
