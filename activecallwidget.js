/**
 * Active Calls Widget — pure JS version
 * ---------------------------------------
 * Include this script and it will inject the full widget (markup + styles)
 * into a target container on your page.
 *
 * USAGE:
 *   <div id="active-calls-mount"></div>
 *   <script src="active-calls-widget.js"></script>
 *
 * By default it mounts into #active-calls-mount. If that element doesn't
 * exist, it appends to <body>. You can also call:
 *   ActiveCallsWidget.mount('#some-other-selector');
 */

(function () {
  const CSS = `
    .active-panel-home {
      font-family: Arial, Helvetica, "Nimbus Sans L", "Liberation Sans", FreeSans, sans-serif;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 16px 20px;
      max-width: 900px;
    }
    .active-panel-home h6 {
      color: #9b9b9b;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0 0 12px 0;
    }
    .table-container.scrollable-small {
      position: relative;
      overflow-y: auto;
      min-height: 160px;
      max-height: 270px;
    }
    table.active-calls-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    table.active-calls-table th {
      text-align: left;
      padding: 8px 4px 12px 4px;
      color: #222;
      font-weight: bold;
      border-bottom: 1px solid #e6e6e6;
    }
    table.active-calls-table th.text-right { text-align: right; }
    table.active-calls-table td {
      padding: 8px 4px;
      color: #333;
      border-bottom: 1px solid #f0f0f0;
    }
    table.active-calls-table td.text-right { text-align: right; }
    .nonecreated {
      text-align: center;
      color: #999;
      padding: 60px 0;
    }
    .nonecreated h5 {
      font-size: 14px;
      font-weight: normal;
      margin: 0;
    }
    #calls_table_body:not(:empty) ~ .nonecreated { display: none; }
  `;

  const HTML = `
    <div class="active-panel-home rounded show">
      <h6>Active Calls</h6>
      <div id="omp-active-body">
        <div class="table-container scrollable-small">
          <table id="calls_table" class="table active-calls-table table-condensed table-hover" style="padding: 0px;">
            <thead class="tableFloatingHeaderOriginal">
              <tr>
                <th>From</th>
                <th>&nbsp;</th>
                <th>Dialed</th>
                <th>To</th>
                <th class="text-right">Duration</th>
              </tr>
            </thead>
            <tbody id="calls_table_body"></tbody>
          </table>
          <div class="nonecreated" id="calls_empty_state">
            <h5>There are no active calls.</h5>
          </div>
        </div>
      </div>
    </div>
  `;

  function injectStyles() {
    if (document.getElementById('active-calls-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'active-calls-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function mount(selector) {
    injectStyles();
    const target = document.querySelector(selector || '#active-calls-mount') || document.body;
    target.insertAdjacentHTML('beforeend', HTML);
  }

  function render(calls) {
    const tbody = document.getElementById('calls_table_body');
    const emptyState = document.getElementById('calls_empty_state');
    if (!tbody || !emptyState) return; // widget not mounted yet

    tbody.innerHTML = '';

    if (!calls || calls.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    calls.forEach(call => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${call.from ?? ''}</td>
        <td>${call.icon ?? '&nbsp;'}</td>
        <td>${call.dialed ?? ''}</td>
        <td>${call.to ?? ''}</td>
        <td class="text-right">${call.duration ?? ''}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function fetchAndRender(endpoint) {
    try {
      if (!endpoint) {
        render([]); // no endpoint configured yet — show empty state
        return;
      }
      const res = await fetch(endpoint);
      const data = await res.json();
      render(data);
    } catch (err) {
      console.error('ActiveCallsWidget: failed to fetch active calls', err);
    }
  }

  function startPolling(endpoint, intervalMs = 5000) {
    fetchAndRender(endpoint);
    return setInterval(() => fetchAndRender(endpoint), intervalMs);
  }

  // Auto-mount on load
  document.addEventListener('DOMContentLoaded', () => {
    mount();
  });

  // Public API
  window.ActiveCallsWidget = { mount, render, startPolling };
})();

/**
 * EXAMPLE USAGE (after the script loads):
 *
 * // Manually mount into a specific element:
 * ActiveCallsWidget.mount('#my-container');
 *
 * // Render sample data:
 * ActiveCallsWidget.render([
 *   { from: '555-1234', dialed: '555-5678', to: 'John Smith', duration: '00:42' }
 * ]);
 *
 * // Poll a real API every 5 seconds:
 * ActiveCallsWidget.startPolling('/api/active-calls', 5000);
 */
