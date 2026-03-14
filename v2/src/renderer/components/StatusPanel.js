window.StatusPanel = function StatusPanel({ logs }) {
  const root = document.getElementById('status-panel');
  root.innerHTML = `
    <h2>Status</h2>
    <div id="status-log"></div>
  `;

  const logContainer = root.querySelector('#status-log');
  logs.forEach((line) => {
    const p = document.createElement('div');
    p.textContent = line;
    logContainer.appendChild(p);
  });
};
