
    const STORAGE_KEY = 'wc26_album_tracker_state_v3';
    const OLD_STORAGE_KEY = 'wc26_album_tracker_state_v2';
    const DEFAULT_TOTAL = 980;
    const DEFAULT_PAD = 3;

    const TEAM_CODES = [
      ['MEX','Mexico'], ['RSA','South Africa'], ['KOR','South Korea'], ['CZE','Czechia'],
      ['CAN','Canada'], ['BIH','Bosnia and Herzegovina'], ['QAT','Qatar'], ['SUI','Switzerland'],
      ['BRA','Brazil'], ['MAR','Morocco'], ['HAI','Haiti'], ['SCO','Scotland'],
      ['USA','USA'], ['PAR','Paraguay'], ['AUS','Australia'], ['TUR','Türkiye'],
      ['GER','Germany'], ['CUW','Curaçao'], ['CIV','Ivory Coast'], ['ECU','Ecuador'],
      ['NED','Netherlands'], ['JPN','Japan'], ['SWE','Sweden'], ['TUN','Tunisia'],
      ['BEL','Belgium'], ['EGY','Egypt'], ['IRI','Iran'], ['NZL','New Zealand'],
      ['ESP','Spain'], ['CPV','Cape Verde'], ['KSA','Saudi Arabia'], ['URU','Uruguay'],
      ['FRA','France'], ['SEN','Senegal'], ['IRQ','Iraq'], ['NOR','Norway'],
      ['ARG','Argentina'], ['DZA','Algeria'], ['AUT','Austria'], ['JOR','Jordan'],
      ['POR','Portugal'], ['COD','Congo DR'], ['UZB','Uzbekistan'], ['COL','Colombia'],
      ['ENG','England'], ['CRO','Croatia'], ['GHA','Ghana'], ['PAN','Panama']
    ];
    const TEAM_MAP = Object.fromEntries(TEAM_CODES);

    const FWC_NAMES = {
      '000': 'Panini Logo',
      FWC1: 'Official Emblem', FWC2: 'Official Emblem', FWC3: 'Official Mascots', FWC4: 'Official Slogan',
      FWC5: 'Official Ball', FWC6: 'Canada - Host Countries & Cities', FWC7: 'Mexico - Host Countries & Cities', FWC8: 'USA - Host Countries & Cities',
      FWC9: 'Italy 1934 - FIFA Museum', FWC10: 'Uruguay 1950 - FIFA Museum', FWC11: 'West Germany 1954 - FIFA Museum',
      FWC12: 'Brazil 1962 - FIFA Museum', FWC13: 'West Germany 1974 - FIFA Museum', FWC14: 'Argentina 1986 - FIFA Museum',
      FWC15: 'Brazil 1994 - FIFA Museum', FWC16: 'Brazil 2002 - FIFA Museum', FWC17: 'Italy 2006 - FIFA Museum',
      FWC18: 'Germany 2014 - FIFA Museum', FWC19: 'Argentina 2022 - FIFA Museum'
    };

    const COCA_COLA_STICKERS = [
      ['CC1','Lamine Yamal - Spain'], ['CC2','Joshua Kimmich - Germany'], ['CC3','Harry Kane - England'],
      ['CC4','Santiago Giménez - Mexico'], ['CC5','Antonee Robinson - USA'], ['CC6','Jefferson Lerma - Colombia'],
      ['CC7','Edson Álvarez - Mexico'], ['CC8','Virgil van Dijk - Netherlands'], ['CC9','Alphonso Davies - Canada'],
      ['CC10','Weston McKennie - USA'], ['CC11','Lautaro Martínez - Argentina'], ['CC12','Gabriel Magalhães - Brazil']
    ];

    const state = {
      title: 'Álbum Mundial 2026',
      total: DEFAULT_TOTAL,
      pad: DEFAULT_PAD,
      stickers: [],
      apiUrl: '',
      editorPin: '',
      myName: '',
      activeTab: 'dashboard',
      activeFilter: 'all',
      search: '',
      sectionFilter: 'all',
      sort: 'code',
      lastSavedAt: '',
      lastLoadedAt: ''
    };

    function padCode(num, pad) {
      return String(num).padStart(Number(pad || DEFAULT_PAD), '0');
    }

    function normalizeCode(raw) {
      let code = String(raw || '').trim().toUpperCase();
      code = code.replace(/\s+/g, '');
      code = code.replace(/^CC[-_]?/i, 'CC');
      code = code.replace(/^FWC[-_]?/i, 'FWC');
      // Album cover/logo sticker: users may type 0, 00 or 000; store it as 000.
      if (code === '0' || code === '00' || code === '000') return '000';
      if (/^\d{1,3}$/.test(code)) {
        const n = Number(code);
        if (n === 0) return '000';
        return padCode(n, DEFAULT_PAD);
      }
      return code;
    }

    function normalizeSearchText(text) {
      return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();
    }

    function stickerSearchText(s) {
      const parts = [s.code, s.section, s.name, s.category];
      if (s.code === '000') parts.push('00', '0', 'panini logo', 'logo');
      if (s.code && s.code.startsWith('FWC')) parts.push('fifa world cup history', 'world cup history', 'historia mundial');
      if (s.code && s.code.startsWith('CC')) parts.push('coca cola', 'coca-cola', 'coke');
      const prefix = String(s.code || '').slice(0, 3);
      if (TEAM_MAP[prefix]) parts.push(prefix, TEAM_MAP[prefix]);
      return normalizeSearchText(parts.join(' '));
    }

    function detectStickerMeta(code, section = '', name = '', category = '') {
      const clean = normalizeCode(code);
      const prefix3 = clean.slice(0, 3);
      const isCocaCola = /^CC/.test(clean);
      const isFWC = clean === '000' || /^FWC\d+$/i.test(clean);
      const isTeam = !!TEAM_MAP[prefix3] && /^([A-Z]{3})\d{1,2}$/.test(clean);
      const detectedCategory = category || (isCocaCola ? 'bonus' : 'base');
      let detectedSection = section;
      if (!detectedSection || detectedSection === 'Album') {
        if (clean === '000') detectedSection = 'Intro / FWC';
        else if (/^FWC([1-8])$/.test(clean)) detectedSection = 'Intro / FWC';
        else if (/^FWC(9|1[0-9])$/.test(clean)) detectedSection = 'FIFA World Cup History';
        else if (isCocaCola) detectedSection = 'Coca-Cola';
        else if (isTeam) detectedSection = TEAM_MAP[prefix3];
        else detectedSection = 'Album';
      }
      let detectedName = name;
      if (!detectedName) {
        if (FWC_NAMES[clean]) detectedName = FWC_NAMES[clean];
        else if (isCocaCola) detectedName = (Object.fromEntries(COCA_COLA_STICKERS))[clean] || 'Coca-Cola special sticker';
        else if (isTeam) {
          const number = Number(clean.replace(prefix3, ''));
          if (number === 1) detectedName = `Team Logo - ${TEAM_MAP[prefix3]}`;
          else if (number === 13) detectedName = `Team Photo - ${TEAM_MAP[prefix3]}`;
          else detectedName = `${TEAM_MAP[prefix3]} sticker ${number}`;
        }
      }
      return { code: clean, section: detectedSection, name: detectedName, category: detectedCategory };
    }

    function makeDefaultStickers() {
      const list = [];
      list.push({ code: '000', section: 'Intro / FWC', name: FWC_NAMES['000'], category: 'base' });
      for (let i = 1; i <= 19; i++) {
        const code = `FWC${i}`;
        const meta = detectStickerMeta(code, '', FWC_NAMES[code] || '', 'base');
        list.push(meta);
      }
      TEAM_CODES.forEach(([prefix, team]) => {
        for (let i = 1; i <= 20; i++) {
          const code = `${prefix}${i}`;
          list.push(detectStickerMeta(code, team, '', 'base'));
        }
      });
      COCA_COLA_STICKERS.forEach(([code, name]) => {
        list.push({ code, section: 'Coca-Cola', name, category: 'bonus' });
      });
      return list.map(s => normalizeSticker({ ...s, pasted: false, duplicates: 0, updatedAt: '', updatedBy: '' }));
    }

    function normalizeSticker(item) {
      const meta = detectStickerMeta(item.code || '', item.section || '', item.name || '', item.category || '');
      return {
        code: meta.code,
        section: String(meta.section || 'Album').trim() || 'Album',
        name: String(meta.name || '').trim(),
        category: String(meta.category || 'base').trim() || 'base',
        pasted: item.pasted === true || item.pasted === 'TRUE' || item.pasted === 'true' || item.pasted === '1' || item.pasted === 1,
        duplicates: Math.max(0, Number(item.duplicates || 0)),
        updatedAt: String(item.updatedAt || ''),
        updatedBy: String(item.updatedBy || '')
      };
    }

    function loadLocal() {
      // Prefer the new v3 state. If it does not exist, migrate v2 if present.
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
      if (!raw) {
        state.stickers = makeDefaultStickers();
        state.total = state.stickers.filter(s => s.category !== 'bonus').length;
        saveLocal();
        return;
      }
      try {
        const saved = JSON.parse(raw);
        Object.assign(state, saved);
        state.stickers = Array.isArray(saved.stickers) && saved.stickers.length ? saved.stickers.map(normalizeSticker).filter(s => s.code) : makeDefaultStickers();
        ensureOfficialCodes();
      } catch (error) {
        console.error(error);
        state.stickers = makeDefaultStickers();
        state.total = state.stickers.filter(s => s.category !== 'bonus').length;
        saveLocal();
      }
    }

    function ensureOfficialCodes() {
      const current = new Map(state.stickers.map(s => [normalizeCode(s.code), normalizeSticker(s)]));
      makeDefaultStickers().forEach(item => {
        if (!current.has(item.code)) current.set(item.code, item);
      });
      state.stickers = [...current.values()].filter(s => s.code).sort(compareStickers);
      state.total = state.stickers.filter(s => s.category !== 'bonus').length;
    }

    function saveLocal() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title: state.title,
        total: state.total,
        pad: state.pad,
        stickers: state.stickers,
        apiUrl: state.apiUrl,
        editorPin: state.editorPin,
        myName: state.myName,
        lastSavedAt: state.lastSavedAt,
        lastLoadedAt: state.lastLoadedAt
      }));
    }

    function readUrlParams() {
      const params = new URLSearchParams(window.location.search);
      const api = params.get('api');
      if (api) {
        state.apiUrl = decodeURIComponent(api);
        saveLocal();
      }
    }

    function byId(id) { return document.getElementById(id); }

    function setStatus(message, type = 'normal') {
      const el = byId('connectionStatus');
      if (el) {
        el.textContent = message;
        el.style.color = type === 'error' ? '#991b1b' : type === 'ok' ? '#166534' : '';
      }
    }

    function stats() {
      const base = state.stickers.filter(s => s.category !== 'bonus');
      const bonus = state.stickers.filter(s => s.category === 'bonus');
      const total = base.length;
      const pasted = base.filter(s => s.pasted).length;
      const missing = Math.max(0, total - pasted);
      const bonusTotal = bonus.length;
      const bonusPasted = bonus.filter(s => s.pasted).length;
      const duplicates = state.stickers.reduce((sum, s) => sum + Number(s.duplicates || 0), 0);
      const uniqueDuplicates = state.stickers.filter(s => Number(s.duplicates || 0) > 0).length;
      const completion = total ? Math.round((pasted / total) * 1000) / 10 : 0;
      return { total, pasted, missing, duplicates, uniqueDuplicates, completion, bonusTotal, bonusPasted, allTotal: state.stickers.length };
    }

    function sections() {
      return [...new Set(state.stickers.map(s => s.section || 'Album'))].sort((a,b) => a.localeCompare(b));
    }

    function render() {
      const s = stats();
      byId('appTitle').textContent = state.title || 'Álbum Mundial 2026';
      byId('appSubtitle').textContent = `${s.pasted} de ${s.total} base · ${s.bonusPasted}/${s.bonusTotal} Coca-Cola · ${s.duplicates} repetidas`;
      byId('syncBadge').textContent = state.apiUrl ? (state.editorPin ? 'Compartido + edición' : 'Compartido lectura') : 'Local';
      byId('statPasted').textContent = `${s.pasted}/${s.total}`;
      byId('statMissing').textContent = s.missing;
      byId('statDuplicates').textContent = s.duplicates;
      byId('statCompletion').textContent = `${s.completion}%`;
      byId('progressBar').style.width = `${s.completion}%`;
      byId('lastUpdatedText').textContent = state.lastSavedAt ? `Último cambio: ${new Date(state.lastSavedAt).toLocaleString()}` : 'Sin cambios guardados todavía.';

      fillSectionSelects();
      renderSectionSummary();
      renderStickers();
      renderInputs();
      renderShareLink();
    }

    function fillSectionSelects() {
      const opts = ['<option value="all">Todas</option>'].concat(sections().map(sec => `<option value="${escapeHtml(sec)}">${escapeHtml(sec)}</option>`)).join('');
      const currentSticker = state.sectionFilter;
      byId('sectionFilter').innerHTML = opts;
      byId('sectionFilter').value = currentSticker;
      const currentReport = byId('reportSection').value || 'all';
      byId('reportSection').innerHTML = opts;
      byId('reportSection').value = currentReport;
    }

    function renderInputs() {
      byId('apiUrlInput').value = state.apiUrl || '';
      byId('editorPinInput').value = state.editorPin || '';
      byId('myNameInput').value = state.myName || '';
      byId('titleInput').value = state.title || '';
      byId('totalInput').value = state.stickers.filter(s => s.category !== 'bonus').length || state.total || DEFAULT_TOTAL;
      byId('padInput').value = state.pad || DEFAULT_PAD;
    }

    function renderSectionSummary() {
      const grouped = sections().map(sec => {
        const items = state.stickers.filter(s => (s.section || 'Album') === sec);
        const pasted = items.filter(s => s.pasted).length;
        const dupe = items.reduce((sum, item) => sum + Number(item.duplicates || 0), 0);
        const pct = items.length ? Math.round((pasted / items.length) * 100) : 0;
        return `<div class="stat" style="margin-bottom:8px">
          <div class="label">${escapeHtml(sec)}</div>
          <div class="value" style="font-size:1.1rem">${pasted}/${items.length} · ${pct}%</div>
          <div class="small muted">Repetidas: ${dupe}${sec === 'Coca-Cola' ? ' · Bonus' : ''}</div>
        </div>`;
      }).join('');
      byId('sectionSummary').innerHTML = grouped || '<div class="empty-state">No hay secciones todavía.</div>';
    }

    function compareStickers(a, b) {
      const rank = c => {
        c = normalizeCode(c);
        if (c === '000') return [0, 0, ''];
        if (/^FWC\d+$/.test(c)) return [1, Number(c.replace('FWC','')), ''];
        const p = c.slice(0, 3);
        const teamIndex = TEAM_CODES.findIndex(([code]) => code === p);
        if (teamIndex >= 0) return [2 + teamIndex, Number(c.replace(p,'')) || 0, p];
        if (/^CC\d+$/.test(c)) return [200, Number(c.replace('CC','')), ''];
        return [300, 0, c];
      };
      const ra = rank(a.code || a);
      const rb = rank(b.code || b);
      return ra[0] - rb[0] || ra[1] - rb[1] || String(ra[2]).localeCompare(String(rb[2]));
    }

    function getVisibleStickers() {
      const term = normalizeSearchText(state.search);
      let list = state.stickers.filter(s => {
        const matchesTerm = !term || stickerSearchText(s).includes(term) || normalizeCode(term).toLowerCase() === String(s.code).toLowerCase();
        const matchesSection = state.sectionFilter === 'all' || s.section === state.sectionFilter;
        const matchesFilter = state.activeFilter === 'all'
          || (state.activeFilter === 'missing' && !s.pasted)
          || (state.activeFilter === 'pasted' && s.pasted)
          || (state.activeFilter === 'duplicates' && Number(s.duplicates || 0) > 0);
        return matchesTerm && matchesSection && matchesFilter;
      });

      list.sort((a, b) => {
        if (state.sort === 'section') return (a.section + a.code).localeCompare(b.section + b.code, undefined, { numeric: true });
        if (state.sort === 'missing') return Number(a.pasted) - Number(b.pasted) || compareStickers(a, b);
        if (state.sort === 'duplicates') return Number(b.duplicates || 0) - Number(a.duplicates || 0) || compareStickers(a, b);
        return compareStickers(a, b);
      });
      return list;
    }

    function renderStickers() {
      const visible = getVisibleStickers();
      byId('visibleCountText').textContent = `Mostrando ${visible.length} de ${state.stickers.length} figuritas.`;
      const html = visible.map(stickerTemplate).join('');
      byId('stickerList').innerHTML = html || '<div class="empty-state">No encontré figuritas con ese filtro.</div>';
    }

    function stickerTemplate(s) {
      const dupe = Number(s.duplicates || 0);
      const status = s.pasted ? 'Pegada' : 'Falta';
      const tagClass = s.pasted ? 'status-pasted' : 'status-missing';
      const dupeTag = dupe > 0 ? `<span class="status-tag status-dupe">${dupe} rep.</span>` : '';
      return `<article class="sticker-card" data-code="${escapeHtml(s.code)}">
        <div class="sticker-head">
          <div>
            <div class="code">#${escapeHtml(s.code)}</div>
            <div class="small muted">${escapeHtml(s.section || 'Album')}${s.category === 'bonus' ? ' · Bonus' : ''}</div>
            ${s.name ? `<div class="small">${escapeHtml(s.name)}</div>` : ''}
          </div>
          <div class="button-row" style="justify-content:flex-end">
            <span class="status-tag ${tagClass}">${status}</span>${dupeTag}
          </div>
        </div>
        <div class="sticker-actions">
          <button class="${s.pasted ? 'secondary' : 'primary'}" data-action="toggle-pasted" data-code="${escapeHtml(s.code)}">${s.pasted ? 'Quitar' : 'Pegar'}</button>
          <button class="ghost" data-action="dupe-plus" data-code="${escapeHtml(s.code)}">+ Rep.</button>
          <button class="warning" data-action="dupe-minus" data-code="${escapeHtml(s.code)}" ${dupe <= 0 ? 'disabled' : ''}>Intercambié</button>
        </div>
        <div class="dup-box">
          <button class="ghost" data-action="dupe-minus" data-code="${escapeHtml(s.code)}" ${dupe <= 0 ? 'disabled' : ''}>−</button>
          <div class="dup-number">${dupe}</div>
          <button class="ghost" data-action="dupe-plus" data-code="${escapeHtml(s.code)}">+</button>
        </div>
        <details>
          <summary>Editar nombre/sección</summary>
          <div class="two-col" style="margin-top:10px">
            <div>
              <label>Sección/equipo</label>
              <input value="${escapeAttr(s.section || 'Album')}" data-action="section-input" data-code="${escapeHtml(s.code)}" />
            </div>
            <div>
              <label>Nombre/nota</label>
              <input value="${escapeAttr(s.name || '')}" data-action="name-input" data-code="${escapeHtml(s.code)}" />
            </div>
          </div>
        </details>
      </article>`;
    }

    function updateSticker(code, changes, saveRemote = true) {
      const idx = state.stickers.findIndex(s => s.code === code);
      if (idx === -1) return;
      const updatedAt = new Date().toISOString();
      state.stickers[idx] = normalizeSticker({
        ...state.stickers[idx],
        ...changes,
        updatedAt,
        updatedBy: state.myName || 'Unknown'
      });
      state.lastSavedAt = updatedAt;
      saveLocal();
      if (saveRemote) saveStickerRemote(state.stickers[idx]);
      render();
    }

    function saveStickerRemote(sticker) {
      if (!state.apiUrl || !state.editorPin) return;
      postRemote('updateSticker', { sticker });
    }

    function postRemote(action, payload) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = state.apiUrl;
      form.target = 'hiddenSaveFrame';
      form.style.display = 'none';
      const fields = {
        action,
        pin: state.editorPin || '',
        payload: JSON.stringify(payload || {})
      };
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      setTimeout(() => form.remove(), 500);
    }

    function loadRemote() {
      if (!state.apiUrl) {
        setStatus('Primero pega la URL del Google Apps Script.', 'error');
        return Promise.reject(new Error('Missing API URL'));
      }
      setStatus('Cargando desde Google Sheet...');
      return jsonp(`${state.apiUrl}?action=load`).then(data => {
        if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'No se pudo cargar.');
        if (data.settings) {
          state.title = data.settings.title || state.title;
          state.total = Number(data.settings.total || state.total || DEFAULT_TOTAL);
          state.pad = Number(data.settings.pad || state.pad || DEFAULT_PAD);
        }
        if (Array.isArray(data.stickers) && data.stickers.length) {
          state.stickers = data.stickers.map(normalizeSticker).filter(s => s.code);
          ensureOfficialCodes();
        }
        state.lastLoadedAt = new Date().toISOString();
        saveLocal();
        render();
        setStatus(`Cargado correctamente. ${state.stickers.length} figuritas.`, 'ok');
      }).catch(err => {
        console.error(err);
        setStatus(`Error cargando: ${err.message}`, 'error');
      });
    }

    function jsonp(url) {
      return new Promise((resolve, reject) => {
        const callbackName = `wcAlbumCallback_${Date.now()}_${Math.round(Math.random() * 100000)}`;
        const sep = url.includes('?') ? '&' : '?';
        const script = document.createElement('script');
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Tiempo agotado. Revisa la URL del Apps Script.'));
        }, 15000);
        function cleanup() {
          clearTimeout(timeout);
          script.remove();
          try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
        }
        window[callbackName] = data => { cleanup(); resolve(data); };
        script.src = `${url}${sep}callback=${callbackName}&cache=${Date.now()}`;
        script.onerror = () => { cleanup(); reject(new Error('No se pudo conectar.')); };
        document.body.appendChild(script);
      });
    }

    function saveAllRemote() {
      if (!state.apiUrl || !state.editorPin) {
        setStatus('Necesitas URL del Apps Script y PIN de edición.', 'error');
        return;
      }
      postRemote('bulkSave', {
        settings: { title: state.title, total: state.total, pad: state.pad },
        stickers: state.stickers
      });
      setStatus('Enviado a Google Sheet. Usa “Cargar desde Google Sheet” para verificar.', 'ok');
    }

    function saveSettingsRemote() {
      if (!state.apiUrl || !state.editorPin) return;
      postRemote('saveSettings', { settings: { title: state.title, total: state.total, pad: state.pad }});
    }

    function renderShareLink() {
      const input = byId('viewLinkInput');
      if (!input) return;
      if (!state.apiUrl) {
        input.value = 'Primero guarda la URL del Apps Script.';
        return;
      }
      const base = window.location.href.split('?')[0];
      input.value = `${base}?api=${encodeURIComponent(state.apiUrl)}`;
    }

    function prepareReport() {
      const type = byId('reportType').value;
      const sec = byId('reportSection').value;
      const s = stats();
      let list = state.stickers.filter(item => {
        const byType = type === 'all'
          || (type === 'missing' && !item.pasted)
          || (type === 'pasted' && item.pasted)
          || (type === 'duplicates' && Number(item.duplicates || 0) > 0);
        const bySec = sec === 'all' || item.section === sec;
        return byType && bySec;
      }).sort((a,b) => (a.section + a.code).localeCompare(b.section + b.code, undefined, { numeric: true }));

      const titleMap = {
        missing: 'Figuritas que me faltan',
        duplicates: 'Figuritas repetidas',
        pasted: 'Figuritas pegadas',
        all: 'Estado completo del álbum'
      };
      const rows = list.map(item => `<tr>
        <td>${escapeHtml(item.code)}</td>
        <td>${escapeHtml(item.section || '')}${item.category === 'bonus' ? ' · Bonus' : ''}</td>
        <td>${escapeHtml(item.name || '')}</td>
        <td>${item.pasted ? 'Pegada' : 'Falta'}</td>
        <td>${Number(item.duplicates || 0)}</td>
      </tr>`).join('');
      byId('printArea').innerHTML = `<div>
        <h1>${escapeHtml(state.title)}</h1>
        <h2>${titleMap[type]}${sec !== 'all' ? ' · ' + escapeHtml(sec) : ''}</h2>
        <p>Generado: ${new Date().toLocaleString()}</p>
        <p><b>Resumen:</b> ${s.pasted}/${s.total} pegadas · ${s.missing} faltantes · ${s.duplicates} repetidas · ${s.completion}% completado.</p>
        <table class="report-table">
          <thead><tr><th>Código</th><th>Sección</th><th>Nombre/nota</th><th>Estado</th><th>Repetidas</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">No hay registros para este reporte.</td></tr>'}</tbody>
        </table>
      </div>`;
      alert('Reporte preparado. Ahora presiona “Guardar / imprimir PDF”.');
    }

    function printReport() {
      if (!byId('printArea').innerHTML.trim()) prepareReport();
      window.print();
    }

    function exportCsv() {
      const header = ['code','section','name','category','pasted','duplicates','updatedAt','updatedBy'];
      const rows = state.stickers.map(s => header.map(h => csvEscape(s[h])).join(','));
      downloadText(`${state.title.replace(/[^a-z0-9]+/gi,'_')}_stickers.csv`, [header.join(','), ...rows].join('\n'), 'text/csv');
    }

    function downloadSampleCsv() {
      const sample = `code,section,name,category\n000,Intro / FWC,Panini Logo,base\nFWC1,Intro / FWC,Official Emblem,base\nFWC19,FIFA World Cup History,Argentina 2022 - FIFA Museum,base\nARG17,Argentina,Argentina sticker 17,base\nUSA5,USA,USA sticker 5,base\nCC1,Coca-Cola,Lamine Yamal - Spain,bonus`;
      downloadText('sample_stickers_import.csv', sample, 'text/csv');
    }

    function quickAddOrUpdate() {
      const rawCode = byId('quickCodeInput').value;
      const code = normalizeCode(rawCode);
      if (!code) { alert('Escribe un código, por ejemplo 000, FWC19, CC1 o COL17.'); return; }
      const note = byId('quickNameInput').value.trim();
      const idx = state.stickers.findIndex(s => s.code === code);
      if (idx >= 0) {
        const changes = {};
        if (note) changes.name = note;
        updateSticker(code, changes, true);
      } else {
        const meta = detectStickerMeta(code, '', note, '');
        state.stickers.push(normalizeSticker({ ...meta, pasted: false, duplicates: 0, updatedAt: new Date().toISOString(), updatedBy: state.myName || 'Unknown' }));
        state.stickers.sort(compareStickers);
        state.total = state.stickers.filter(s => s.category !== 'bonus').length;
        saveLocal();
        saveStickerRemote(state.stickers.find(s => s.code === code));
        render();
      }
      state.search = code;
      byId('searchInput').value = code;
      renderStickers();
    }

    function quickSearch() {
      const code = normalizeCode(byId('quickCodeInput').value);
      if (!code) return;
      state.search = code;
      byId('searchInput').value = code;
      goTab('stickers');
      renderStickers();
    }

    function exportJson() {
      downloadText('wc26_album_backup.json', JSON.stringify({
        title: state.title,
        total: state.total,
        pad: state.pad,
        stickers: state.stickers,
        exportedAt: new Date().toISOString()
      }, null, 2), 'application/json');
    }

    function downloadText(filename, content, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function csvEscape(value) {
      const text = String(value ?? '');
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    function parseCsv(text) {
      const rows = [];
      let current = [];
      let field = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];
        if (char === '"' && inQuotes && next === '"') { field += '"'; i++; }
        else if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { current.push(field); field = ''; }
        else if ((char === '\n' || char === '\r') && !inQuotes) {
          if (char === '\r' && next === '\n') i++;
          current.push(field); field = '';
          if (current.some(cell => cell.trim() !== '')) rows.push(current);
          current = [];
        } else field += char;
      }
      current.push(field);
      if (current.some(cell => cell.trim() !== '')) rows.push(current);
      return rows;
    }

    function importCsvFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
        const rows = parseCsv(String(reader.result || ''));
        if (rows.length < 2) {
          byId('importStatus').textContent = 'El CSV está vacío o no tiene filas.';
          return;
        }
        const header = rows[0].map(h => h.trim().toLowerCase());
        const codeIdx = header.indexOf('code');
        const sectionIdx = header.indexOf('section');
        const nameIdx = header.indexOf('name');
        const categoryIdx = header.indexOf('category');
        if (codeIdx === -1) {
          byId('importStatus').textContent = 'El CSV debe tener una columna code.';
          return;
        }
        const map = new Map(state.stickers.map(s => [s.code, s]));
        rows.slice(1).forEach(row => {
          const code = normalizeCode(row[codeIdx] || '');
          if (!code) return;
          const existing = map.get(code) || { code, pasted: false, duplicates: 0, updatedAt: '', updatedBy: '' };
          existing.section = sectionIdx >= 0 ? String(row[sectionIdx] || existing.section || 'Album').trim() || 'Album' : existing.section || 'Album';
          existing.name = nameIdx >= 0 ? String(row[nameIdx] || existing.name || '').trim() : existing.name || '';
          existing.category = categoryIdx >= 0 ? String(row[categoryIdx] || existing.category || '').trim() : existing.category || '';
          map.set(code, normalizeSticker(existing));
        });
        state.stickers = [...map.values()].sort((a,b) => compareStickers(a, b));
        state.total = state.stickers.length;
        state.lastSavedAt = new Date().toISOString();
        saveLocal();
        render();
        byId('importStatus').textContent = `Importado correctamente. Total: ${state.stickers.length} figuritas.`;
        saveAllRemote();
      };
      reader.readAsText(file);
    }

    function importJsonFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(String(reader.result || '{}'));
          state.title = imported.title || state.title;
          state.total = Number(imported.total || imported.stickers?.length || state.total);
          state.pad = Number(imported.pad || state.pad);
          if (Array.isArray(imported.stickers)) state.stickers = imported.stickers.map(normalizeSticker);
          state.lastSavedAt = new Date().toISOString();
          saveLocal();
          render();
          alert('Backup importado correctamente.');
        } catch (e) {
          alert('No pude importar ese JSON.');
        }
      };
      reader.readAsText(file);
    }

    function regenerateMissing() {
      const map = new Map(state.stickers.map(s => [normalizeCode(s.code), normalizeSticker(s)]));
      makeDefaultStickers().forEach(item => {
        if (!map.has(item.code)) map.set(item.code, item);
      });
      state.stickers = [...map.values()].filter(s => s.code).sort(compareStickers);
      state.total = state.stickers.filter(s => s.category !== 'bonus').length;
      state.pad = Number(byId('padInput').value || state.pad || DEFAULT_PAD);
      state.lastSavedAt = new Date().toISOString();
      saveLocal();
      saveSettingsRemote();
      render();
      alert('Lista oficial/base actualizada: 000 + FWC1-FWC19 + equipos + CC1-CC12. No se borró lo que ya tenías marcado.');
    }

    function escapeHtml(text) {
      return String(text ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
    }

    function escapeAttr(text) { return escapeHtml(text); }

    function bindEvents() {
      document.querySelectorAll('.tab-button').forEach(btn => btn.addEventListener('click', () => goTab(btn.dataset.tab)));
      document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => goTab(btn.dataset.go)));

      byId('searchInput').addEventListener('input', e => { state.search = e.target.value; renderStickers(); });
      byId('sectionFilter').addEventListener('change', e => { state.sectionFilter = e.target.value; renderStickers(); });
      byId('sortSelect').addEventListener('change', e => { state.sort = e.target.value; renderStickers(); });
      byId('quickAddBtn').addEventListener('click', quickAddOrUpdate);
      byId('quickSearchBtn').addEventListener('click', quickSearch);
      document.querySelectorAll('.pill').forEach(btn => btn.addEventListener('click', () => {
        state.activeFilter = btn.dataset.filter;
        document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p === btn));
        renderStickers();
      }));

      byId('stickerList').addEventListener('click', e => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const code = target.dataset.code;
        const sticker = state.stickers.find(s => s.code === code);
        if (!sticker) return;
        if (target.dataset.action === 'toggle-pasted') updateSticker(code, { pasted: !sticker.pasted });
        if (target.dataset.action === 'dupe-plus') updateSticker(code, { duplicates: Number(sticker.duplicates || 0) + 1 });
        if (target.dataset.action === 'dupe-minus') updateSticker(code, { duplicates: Math.max(0, Number(sticker.duplicates || 0) - 1) });
      });

      byId('stickerList').addEventListener('change', e => {
        const target = e.target;
        const action = target.dataset.action;
        const code = target.dataset.code;
        if (!action || !code) return;
        if (action === 'section-input') updateSticker(code, { section: target.value || 'Album' });
        if (action === 'name-input') updateSticker(code, { name: target.value || '' });
      });

      byId('saveConnectionBtn').addEventListener('click', () => {
        state.apiUrl = byId('apiUrlInput').value.trim();
        state.editorPin = byId('editorPinInput').value.trim();
        state.myName = byId('myNameInput').value.trim();
        saveLocal();
        render();
        setStatus('Conexión guardada en este dispositivo.', 'ok');
      });
      byId('loadSharedBtn').addEventListener('click', loadRemote);
      byId('saveAllSharedBtn').addEventListener('click', saveAllRemote);
      byId('syncNowBtn').addEventListener('click', () => state.apiUrl ? loadRemote() : alert('Primero configura Sync con Google Sheets.'));
      byId('copyViewLinkBtn').addEventListener('click', () => {
        byId('viewLinkInput').select();
        document.execCommand('copy');
        alert('Link copiado.');
      });

      byId('saveSettingsBtn').addEventListener('click', () => {
        state.title = byId('titleInput').value.trim() || 'Álbum Mundial 2026';
        state.total = Number(byId('totalInput').value || DEFAULT_TOTAL);
        state.pad = Number(byId('padInput').value || DEFAULT_PAD);
        state.lastSavedAt = new Date().toISOString();
        saveLocal();
        saveSettingsRemote();
        render();
        alert('Configuración guardada.');
      });
      byId('regenerateBtn').addEventListener('click', regenerateMissing);
      byId('resetLocalBtn').addEventListener('click', () => {
        if (!confirm('¿Seguro? Esto borra los datos de este dispositivo, no la Google Sheet.')) return;
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      });

      byId('prepareReportBtn').addEventListener('click', prepareReport);
      byId('printReportBtn').addEventListener('click', printReport);
      byId('exportCsvBtn').addEventListener('click', exportCsv);
      byId('downloadSampleBtn').addEventListener('click', downloadSampleCsv);
      byId('csvFile').addEventListener('change', e => e.target.files[0] && importCsvFile(e.target.files[0]));
      byId('exportJsonBtn').addEventListener('click', exportJson);
      byId('jsonFile').addEventListener('change', e => e.target.files[0] && importJsonFile(e.target.files[0]));
    }

    function goTab(tab) {
      state.activeTab = tab;
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${tab}`));
      document.querySelectorAll('.tab-button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function init() {
      loadLocal();
      readUrlParams();
      bindEvents();
      render();
      if (state.apiUrl) loadRemote();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(console.warn);
      }
    }

    init();
  