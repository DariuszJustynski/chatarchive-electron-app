window.StatsPanel = function StatsPanel({ stats, loading, onRebuild }) {
  const root = document.getElementById('stats-panel');

  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString();
  }

  function fmtRound(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n).toLocaleString();
  }

  let body = '';

  if (loading) {
    body = '<p class="small">Przeliczanie indeksu...</p>';
  } else if (!stats) {
    body = '<p class="small">Brak danych. Kliknij "Przebuduj indeks".</p>';
  } else {
    const t = stats.totals || {};
    const a = stats.averages || {};
    const p = stats.peaks || {};
    const topDay = p.topDayByChats;
    const longestByChars = p.longestChatByChars;

    body = `
      <table class="stats-table">
        <tr><td>Czaty w indeksie</td><td>${fmtNum(stats.chatCount)}</td></tr>
        <tr><td>Wszystkie znaki</td><td>${fmtNum(t.totalChars)}</td></tr>
        <tr><td>Znaki użytkownika</td><td>${fmtNum(t.userChars)}</td></tr>
        <tr><td>Znaki asystenta</td><td>${fmtNum(t.assistantChars)}</td></tr>
        <tr><td>Śr. długość promptu</td><td>${fmtRound(a.charsPerUserPrompt)} zn.</td></tr>
        <tr><td>Śr. dł. odpowiedzi</td><td>${fmtRound(a.charsPerAssistantReply)} zn.</td></tr>
        <tr><td>Śr. wiad. / czat</td><td>${fmtNum(a.messagesPerChat)}</td></tr>
        <tr><td>Najaktywniejszy dzień</td><td>${topDay ? `${topDay.date} (${topDay.count})` : '—'}</td></tr>
        <tr><td>Najdłuższy czat</td><td class="small" title="${longestByChars ? longestByChars.title : ''}">${longestByChars ? fmtNum(longestByChars.totalChars) + ' zn.' : '—'}</td></tr>
      </table>
      <p class="small" style="opacity:0.5">Wygenerowano: ${stats.generatedAt ? new Date(stats.generatedAt).toLocaleString() : '—'}</p>
    `;
  }

  root.innerHTML = `
    <h2>Statystyki czatów</h2>
    ${body}
    <button id="btn-rebuild" ${loading ? 'disabled' : ''}>
      ${loading ? 'Przeliczam...' : 'Przebuduj indeks'}
    </button>
  `;

  root.querySelector('#btn-rebuild').addEventListener('click', onRebuild);
};
