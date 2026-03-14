window.QueuePanel = function QueuePanel({ items, onToggle, onSelectAll, onUnselectAll, onRemoveSelected, onClear }) {
  const root = document.getElementById('queue-panel');
  const selectedIds = items.filter((item) => item.checked).map((item) => item.id);

  root.innerHTML = `
    <h2>Kolejka</h2>
    <button id="queue-select-all">Zaznacz wszystko</button>
    <button id="queue-unselect-all">Odznacz wszystko</button>
    <button id="queue-remove-selected">Usuń zaznaczone</button>
    <button id="queue-clear">Wyczyść</button>
    <div id="queue-items"></div>
  `;

  const list = root.querySelector('#queue-items');
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'queue-item';
    row.innerHTML = `
      <input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}" />
      <div>
        <div>${item.title}</div>
        <div class="small">${item.url}</div>
      </div>
    `;
    row.querySelector('input').addEventListener('change', (e) => onToggle(item.id, e.target.checked));
    list.appendChild(row);
  });

  root.querySelector('#queue-select-all').addEventListener('click', onSelectAll);
  root.querySelector('#queue-unselect-all').addEventListener('click', onUnselectAll);
  root.querySelector('#queue-remove-selected').addEventListener('click', () => onRemoveSelected(selectedIds));
  root.querySelector('#queue-clear').addEventListener('click', onClear);
};
