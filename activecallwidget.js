/**
 * Active Calls Widget — pure JS version (v2)
 * ---------------------------------------------
 * Changes from v1:
 *   - No longer falls back to <body>. If the target container isn't found,
 *     it logs a warning instead of injecting in the wrong place.
 *   - Custom CSS injection is now OFF by default, since injecting this into
 *     an existing portal page (which already has its own styles for
 *     .active-panel-home, .table-container, etc.) causes style conflicts.
 *     Turn it on only if you're using this on a page with no existing styles.
 *   - Default mount target changed to '.home-content.span' to match the
 *     portal's real dashboard container (confirm this class in DevTools —
 *     it can vary by portal version).
 *
 * USAGE ON THE LIVE PORTAL (console / injection):
 *   1. Load the script (paste it in DevTools console, or inject via a
 *      browser extension / userscript).
 *   2. Run: ActiveCallsWidget.mount('.home-content.span');
 *   3. Run: ActiveCallsWidget.startPolling('/api/active-calls', 5000);
 *      (swap the endpoint for whatever the real data source is)
 *
 * USAGE ON YOUR OWN SITE:
 *   <div id="active-calls-mount"></div>
 *   <script src="active-calls-widget.js"></script>
 *   <script>
 *     ActiveCallsWidget.useDefaultStyles(); // opt-in, only if no existing CSS
 *     ActiveCallsWidget.mount(); // defaults to #active-calls-mount
 *   </script>
 */

(function () {
  const DEFAULT_MOUNT_SELECTOR = '.home-content.span';

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
    <div class="active-panel-home rounded show" id="acw-injected-panel">
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

  function useDefaultStyles() {
    if (document.getElementById('active-calls-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'active-calls-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function mount(selector) {
    const target = document.querySelector(selector || DEFAULT_MOUNT_SELECTOR);

    if (!target) {
      console.warn(
        `ActiveCallsWidget: could not find container "${selector || DEFAULT_MOUNT_SELECTOR}". ` +
        `Nothing was mounted. Inspect the page and pass the correct selector, ` +
        `e.g. ActiveCallsWidget.mount('.your-real-container')`
      );
      return false;
    }

    // Avoid mounting twice if called more than once
    if (document.getElementById('acw-injected-panel')) {
      console.warn('ActiveCallsWidget: already mounted, skipping.');
      return false;
    }

    target.insertAdjacentHTML('beforeend', HTML);
    return true;
  }

  function unmount() {
    const el = document.getElementById('acw-injected-panel');
    if (el) el.remove();
  }

  function render(calls) {
    const tbody = document.getElementById('calls_table_body');
    const emptyState = document.getElementById('calls_empty_state');
    if (!tbody || !emptyState) {
      console.warn('ActiveCallsWidget: widget not mounted yet, call mount() first.');
      return;
    }

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

  // NOTE: no auto-mount on DOMContentLoaded anymore. Call
  // ActiveCallsWidget.mount(...) manually so you control exactly where
  // and when it gets inserted — important when injecting into a page
  // you don't own.

  window.ActiveCallsWidget = {
    mount,
    unmount,
    render,
    startPolling,
    useDefaultStyles,
  };
})();

/**
 * QUICK START ON THE LIVE PORTAL:
 *
 * // 1. Paste this whole file into the DevTools console (or inject it).
 * // 2. Find the real dashboard container in the Elements panel, then:
 * ActiveCallsWidget.mount('.home-content.span');
 *
 * // 3. Test with sample data:
 * ActiveCallsWidget.render([
 *   { from: '555-1234', dialed: '555-5678', to: 'John Smith', duration: '00:42' }
 * ]);
 *
 * // 4. Or start polling a real endpoint:
 * ActiveCallsWidget.startPolling('/api/active-calls', 5000);
 *
 * // To remove it:
 * ActiveCallsWidget.unmount();
 */
