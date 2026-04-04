// ============================================================
// SAAT WİDGET'I: GÖREV BAĞLAMA VE UNIFIED STATE MOTORU
// ============================================================

    // ======= SAAT WİDGET'I: GÖREV BAĞLAMA =======

    // Seçili görev state'i
    let _clkLinkedTask = null; // { task, dateKey, mode: 'sw'|'tm', originalDuration }
    let _clkCompleteSource = null; // 'sw' | 'tm' — hangi moddan tamamla çağrıldı

    // ── Görev seçici aç ──────────────────────────────────────────────
    window.clkPickTask = function(mode) {
        // window._clkUserTasksLive / _clkDashDateLive: module script'ten her yarım saniyede açılan live referans
        const today = window._clkDashDateLive || new Date();
        const dateKey = today.getFullYear() + '-' +
            String(today.getMonth()+1).padStart(2,'0') + '-' +
            String(today.getDate()).padStart(2,'0');

        const liveUserTasks = window._clkUserTasksLive || {};
        const rawTasks = liveUserTasks[dateKey] || [];

        // Aktif profile göre filtrele
        let mainProfileId = 'main_profile';
        if (window.plannerProfiles) {
            const mainP = window.plannerProfiles.find(p => p.isMain);
            if (mainP) mainProfileId = mainP.id;
        }
        const allTasks = rawTasks.filter(t => (t.profileId || 'main_profile') === mainProfileId);
        const tasks = allTasks.filter(t => !t.isCompleted);

        const list  = document.getElementById('clkTaskPickerList');
        const title = document.getElementById('clkPickerTitle');
        const sub   = document.getElementById('clkPickerSub');
        if (!list) return;

        title.textContent = mode === 'sw' ? 'Kronometre için Görev Seç' : 'Zamanlayıcı için Görev Seç';
        sub.textContent   = `Bugün · ${tasks.length} tamamlanmamış görev`;

        list.innerHTML = '';

        if (tasks.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:30px; color:var(--color-text-muted); font-weight:700;">Bugün tamamlanmamış görev yok.</div>';
        } else {
            tasks.forEach(task => {
                const isLinked = _clkLinkedTask && _clkLinkedTask.task.id === task.id;
                const badgeColor = task.examType === 'tyt' ? '#17a2b8' : '#856404';
                const badgeBg    = task.examType === 'tyt' ? '#e0f7fa' : '#fff3cd';
                const div = document.createElement('div');
                div.style.cssText = `display:flex; align-items:center; gap:10px; padding:11px 13px; border-radius:var(--radius-lg); border:2px solid ${isLinked ? 'var(--color-primary)' : 'var(--color-border)'}; background:${isLinked ? 'var(--color-primary-lighter)' : 'var(--color-bg-input)'}; cursor:pointer; transition:var(--transition-fast);`;
                div.innerHTML = `
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:13px; font-weight:800; color:var(--color-text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${task.subject}</div>
                        <div style="font-size:11px; font-weight:600; color:var(--color-text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px;">${task.desc || ''}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0;">
                        <span style="font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px; background:${badgeBg}; color:${badgeColor};">${(task.examType||'').toUpperCase()}</span>
                        <span style="font-size:11px; font-weight:700; color:var(--color-text-muted);">${task.duration} dk</span>
                    </div>
                    ${isLinked ? '<i class="fa-solid fa-check" style="color:var(--color-primary); font-size:14px; flex-shrink:0;"></i>' : ''}
                `;
                div.onmouseover = () => { if (!isLinked) { div.style.borderColor='var(--color-primary-border)'; div.style.background='var(--color-primary-lighter)'; } };
                div.onmouseout  = () => { if (!isLinked) { div.style.borderColor='var(--color-border)'; div.style.background='var(--color-bg-input)'; } };
                div.onclick = () => {
                    _clkLinkTask(task, dateKey, mode);
                    document.getElementById('clkTaskPickerModal').style.display = 'none';
                };
                list.appendChild(div);
            });
        }

        // Bağlantıyı kaldır seçeneği
        if (_clkLinkedTask) {
            const clearDiv = document.createElement('div');
            clearDiv.style.cssText = 'text-align:center; padding:8px; font-size:12px; font-weight:700; color:var(--color-danger); cursor:pointer; border-radius:var(--radius-md); transition:var(--transition-fast);';
            clearDiv.textContent = '✕ Görev bağlantısını kaldır';
            clearDiv.onclick = () => { _clkUnlinkTask(); document.getElementById('clkTaskPickerModal').style.display='none'; };
            list.appendChild(clearDiv);
        }

        document.getElementById('clkTaskPickerModal').style.display = 'flex';
    };

    // ── Görevi bağla ─────────────────────────────────────────────────
    function _clkLinkTask(task, dateKey, mode) {
        const totalMs = parseInt(task.duration) * 60000;
        _clkLinkedTask = { task, dateKey, mode, originalDuration: task.duration, startMs: totalMs };

        // Zamanlayıcıysa: görevin süresiyle input'ları doldur
        if (mode === 'tm') {
            const totalSec = parseInt(task.duration) * 60;
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            ['timerH','clkFsTimerH'].forEach(id => { const el=document.getElementById(id); if(el) el.value=h; });
            ['timerM','clkFsTimerM'].forEach(id => { const el=document.getElementById(id); if(el) el.value=m; });
            ['timerS','clkFsTimerS'].forEach(id => { const el=document.getElementById(id); if(el) el.value=s; });
            // Sıfırla
            _tmDoReset();
        }

        _clkUpdateLinkedUI();
        _clkLockTimerInputs(mode === 'tm'); // zamanlayıcıda input'ları kilitle
    }

    // ── Bağlantıyı kaldır ────────────────────────────────────────────
    function _clkUnlinkTask() {
        _clkLinkedTask = null;
        _clkUpdateLinkedUI();
        _clkLockTimerInputs(false); // kilidi aç
        // Kronometreyi de sıfırla
        _swDoReset();
    }

    // ── Zamanlayıcı input'larını kilitle/aç ──────────────────────────
    function _clkLockTimerInputs(lock) {
        const ids = ['timerH','timerM','timerS','clkFsTimerH','clkFsTimerM','clkFsTimerS'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.disabled = lock;
            el.style.opacity    = lock ? '0.5' : '1';
            el.style.cursor     = lock ? 'not-allowed' : '';
            el.style.background = lock ? 'var(--color-bg-input)' : 'var(--color-bg-input)';
            el.onfocus = lock ? (e) => e.preventDefault() : null;
        });
    }

    // ── Bağlı görev UI güncelle ──────────────────────────────────────
    function _clkUpdateLinkedUI() {
        const task = _clkLinkedTask ? _clkLinkedTask.task : null;
        const labelText = task ? task.subject + (task.desc ? ' · ' + task.desc.slice(0,30) : '') : '';
        const targetText = task ? '/ ' + task.duration + ' dk' : '';

        // Etiket alanları
        ['swTaskLabel','tmTaskLabel','fswTaskLabel','fstmTaskLabel'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = labelText;
            el.style.display = task ? 'block' : 'none';
        });

        // Kronometre hedef süresi
        ['swTaskTarget','fswTaskTarget'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = targetText;
            el.style.display = task ? 'block' : 'none';
        });
    }

    // ── Tamamla butonu göster/gizle ──────────────────────────────────
    function _clkUpdateCompleteBtn(show) {
        // Görev bağlı değilse butonu hiç gösterme
        const shouldShow = show && !!_clkLinkedTask;
        ['swCompleteBtn','tmCompleteBtn','fswCompleteBtn','fstmCompleteBtn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // ── Tamamla dialogunu aç ─────────────────────────────────────────
    window.clkCompleteTask = function(mode) {
        if (!_clkLinkedTask) return;
        _clkCompleteSource = mode;

        const task = _clkLinkedTask.task;
        const nameEl = document.getElementById('clkCompleteTaskName');
        const infoEl = document.getElementById('clkCompleteTimeInfo');
        if (nameEl) nameEl.textContent = task.subject + (task.desc ? ' · ' + task.desc.slice(0,40) : '');

        // Önce durdur — sonra kalan süreyi doğru okuyabilelim
        if (_swRunning && mode === 'sw') { _swDoToggle(); }
        if (_tmRunning && mode === 'tm') {
            // Manuel durdur (toggle kullanmadan, state'i doğrudan güncelle)
            _tmRemaining = _tmEnd - Date.now();
            _tmRunning = false;
            cancelAnimationFrame(_tmRaf);
            _tmRefreshUI();
        }

        let newDuration, infoText;
        if (mode === 'sw') {
            // Kronometredeki geçen süre (dakika, yukarı yuvarla)
            const elapsedMs = _swElapsed; // artık durduruldu, _swElapsed güncel
            newDuration = Math.ceil(elapsedMs / 60000);
            if (newDuration < 1) newDuration = 1;
            infoText = `Geçen süre: ${_swFmtMs(elapsedMs)} → Yeni süre: ${newDuration} dk (orijinal: ${task.duration} dk)`;
        } else {
            // Zamanlayıcı: başlangıçta kaydedilen süre - kalan = kullanılan
            // startMs: görev bağlanırken kaydedilen orijinal süre (input değişse de etkilenmez)
            const startMs = _clkLinkedTask.startMs || (parseInt(_clkLinkedTask.originalDuration) * 60000);
            // Kalan: durdurulduğu andaki _tmRemaining (az önce hesaplandı)
            const remainingMs = Math.max(0, _tmRemaining);
            const usedMs = Math.max(0, startMs - remainingMs);
            newDuration = Math.ceil(usedMs / 60000);
            if (newDuration < 1) newDuration = 1;
            const remainSec = Math.round(remainingMs / 1000);
            const usedMin = Math.floor(usedMs / 60000);
            const usedSec = Math.round((usedMs % 60000) / 1000);
            infoText = `Kullanılan: ${usedMin > 0 ? usedMin + ' dk ' : ''}${usedSec} sn → ${newDuration} dk (orijinal: ${task.duration} dk)`;
        }
        if (infoEl) infoEl.textContent = infoText;

        // Yeni süreyi geçici olarak sakla
        _clkLinkedTask._newDuration = newDuration;

        document.getElementById('clkCompleteDialog').style.display = 'flex';
    };

    // ── Tamamla eylemi ───────────────────────────────────────────────
    window.clkDoComplete = async function(action) {
        document.getElementById('clkCompleteDialog').style.display = 'none';
        if (!_clkLinkedTask) return;

        const { task, dateKey, _newDuration } = _clkLinkedTask;

        // userTasks içinde bul (window live referansından)
        const liveUT = window._clkUserTasksLive || {};
        if (!liveUT[dateKey]) return;
        const taskIndex = liveUT[dateKey].findIndex(t => t.id === task.id);
        if (taskIndex === -1) return;

        const updatedTask = { ...liveUT[dateKey][taskIndex], isCompleted: true };
        if (action === 'update' && _newDuration > 0) {
            updatedTask.duration = _newDuration;
        }

        try {
            if (typeof setDoc !== 'undefined' && typeof db !== 'undefined' && typeof currentUserUid !== 'undefined' && currentUserUid) {
                await setDoc(doc(db, 'users', currentUserUid, 'userTasks', task.id.toString()), updatedTask);
            }
            liveUT[dateKey][taskIndex] = updatedTask;
            window.updateWeeklyPlannerView?.();
            window.renderTodayTasks?.();
            window.renderPlaylists?.();
        } catch(e) { console.error('Task complete error:', e); }

        // State temizle
        _clkUnlinkTask();
        _swDoReset();
        _tmDoReset();
        _clkUpdateCompleteBtn(false);
    };

    
        // ======= SAAT WİDGET'I — UNIFIED STATE =======
    // Tek bir state, hem küçük widget hem tam ekran modal bunu kullanır.
    // Mod değişimi her iki yüzde de senkron yansır.

    const CLK_DAYS   = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
    const CLK_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

    // ── Paylaşılan aktif mod ─────────────────────────────────────────
    let _clkMode       = 'clock';
    let _clkModeBarOpen = false;

    // ── Saat tick (her iki yüze de yazar) ───────────────────────────
    function _clkTickClock() {
        if (_clkMode !== 'clock') return;
        const now = new Date();
        const h   = String(now.getHours()).padStart(2,'0');
        const m   = String(now.getMinutes()).padStart(2,'0');
        const s   = String(now.getSeconds()).padStart(2,'0');
        const dateStr = now.getDate() + ' ' + CLK_MONTHS[now.getMonth()] + ' ' + now.getFullYear();
        const dayStr  = CLK_DAYS[now.getDay()];
        // Küçük widget
        const t=document.getElementById('clkTime');     if(t) t.textContent = h+':'+m;
        const sc=document.getElementById('clkSeconds'); if(sc) sc.textContent = s;
        const d=document.getElementById('clkDate');     if(d) d.textContent = dateStr;
        const w=document.getElementById('clkDay');      if(w) w.textContent = dayStr;
        // Tam ekran
        const T=document.getElementById('clkFsTime');     if(T) T.textContent = h+':'+m;
        const SC=document.getElementById('clkFsSeconds'); if(SC) SC.textContent = s;
        const D=document.getElementById('clkFsDate');     if(D) D.textContent = dateStr;
        const W=document.getElementById('clkFsDay');      if(W) W.textContent = dayStr;
    }
    setInterval(_clkTickClock, 1000);
    _clkTickClock();

    // ── Mod uygula — hem küçük hem tam ekrana ────────────────────────
    function _clkApplyMode(mode) {
        _clkMode = mode;
        const labels = { clock:'Saat', stopwatch:'Kronometre', timer:'Zamanlayıcı' };

        // Küçük: dropdown tab + label + yüzler
        const label = document.getElementById('clkActiveLabel');
        if (label) label.textContent = labels[mode] || '';
        document.querySelectorAll('#clkModeBar .clk-tab').forEach(b =>
            b.classList.toggle('active', b.getAttribute('data-mode') === mode));
        const faces = { clock:'clkFaceClock', stopwatch:'clkFaceStopwatch', timer:'clkFaceTimer' };
        Object.entries(faces).forEach(([k,id]) => {
            const el = document.getElementById(id);
            if (el) el.style.display = k === mode ? 'flex' : 'none';
        });

        // Tam ekran: tab + yüzler
        document.querySelectorAll('.clk-tab-fs').forEach(b =>
            b.classList.toggle('active', b.getAttribute('data-mode') === mode));
        const fsPanels = { clock:'clkFsModeClock', stopwatch:'clkFsModeStopwatch', timer:'clkFsModeTimer' };
        Object.entries(fsPanels).forEach(([k,id]) => {
            const el = document.getElementById(id);
            if (el) el.style.display = k === mode ? 'flex' : 'none';
        });

        if (mode === 'clock') _clkTickClock();
        // Kronometre / zamanlayıcı moduna geçince UI'yi güncelle
        if (mode === 'stopwatch') { _swRefreshUI(); }
        if (mode === 'timer')     { _tmRefreshUI(); }
    }

    // Küçük widget dropdown
    window.clkSetMode = function(mode) {
        _clkModeBarOpen = false;
        const bar   = document.getElementById('clkModeBar');
        const caret = document.getElementById('clkModeCaret');
        if (bar)   bar.style.display    = 'none';
        if (caret) caret.style.transform = 'rotate(0deg)';
        _clkApplyMode(mode);
    };

    // Tam ekran tab
    window.clkFsSetMode = function(mode) {
        _clkApplyMode(mode);
    };

    window.clkToggleModeBar = function() {
        _clkModeBarOpen = !_clkModeBarOpen;
        const bar   = document.getElementById('clkModeBar');
        const caret = document.getElementById('clkModeCaret');
        if (bar)   bar.style.display    = _clkModeBarOpen ? 'flex' : 'none';
        if (caret) caret.style.transform = _clkModeBarOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        if (_clkModeBarOpen) {
            setTimeout(() => {
                function outsideClick(e) {
                    const btn2 = document.getElementById('clkModeBtn');
                    const bar2 = document.getElementById('clkModeBar');
                    if (btn2&&!btn2.contains(e.target)&&bar2&&!bar2.contains(e.target)) {
                        _clkModeBarOpen = false;
                        bar2.style.display = 'none';
                        const c = document.getElementById('clkModeCaret');
                        if (c) c.style.transform = 'rotate(0deg)';
                        document.removeEventListener('click', outsideClick);
                    }
                }
                document.addEventListener('click', outsideClick);
            }, 10);
        }
    };

    // ── Tam ekran aç/kapat ───────────────────────────────────────────
    window.clkOpenFullscreen = function() {
        document.getElementById('clkFullscreenModal').style.display = 'flex';
        _clkApplyMode(_clkMode); // mevcut modu tam ekrana yansıt
        // Kronometre/zamanlayıcı devam ediyorsa animasyonu tetikle
        if (_clkMode === 'stopwatch' && _swRunning) { _swTick(); }
        if (_clkMode === 'timer'     && _tmRunning) { _tmTick(); }
    };

    document.getElementById('clkFsCloseBtn').addEventListener('click', function() {
        document.getElementById('clkFullscreenModal').style.display = 'none';
    });
    document.getElementById('clkFullscreenModal').addEventListener('click', function(e) {
        if (e.target === this) this.style.display = 'none';
    });

    // ── PAYLAŞILAN KRONOMETRE STATE ──────────────────────────────────
    let _swRunning = false, _swStart = 0, _swElapsed = 0, _swRaf = null;

    function _swFmtMs(ms) {
        const total = Math.floor(ms);
        const cs   = Math.floor((total % 1000) / 10);
        const secs = Math.floor(total / 1000) % 60;
        const mins = Math.floor(total / 60000) % 60;
        const hrs  = Math.floor(total / 3600000);
        let str = (mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs+'.'+(cs<10?'0':'')+cs;
        if (hrs > 0) str = (hrs<10?'0':'')+hrs+':'+str;
        return str;
    }

    function _swDraw(ms) {
        const str = _swFmtMs(ms);
        // Küçük widget
        const el  = document.getElementById('swDisplay');    if (el)  el.textContent  = str;
        // Tam ekran
        const el2 = document.getElementById('clkFsSwDisplay'); if (el2) el2.textContent = str;
    }

    function _swTick() {
        if (!_swRunning) return;
        _swDraw(Date.now() - _swStart + _swElapsed);
        _swRaf = requestAnimationFrame(_swTick);
    }

    function _swRefreshUI() {
        const ms  = _swRunning ? (Date.now() - _swStart + _swElapsed) : _swElapsed;
        _swDraw(ms);
        const running  = _swRunning;
        const btnSmall = document.getElementById('swStartBtn');
        const btnBig   = document.getElementById('clkFsSwStartBtn');
        [btnSmall, btnBig].forEach(btn => {
            if (!btn) return;
            if (running) {
                btn.innerHTML = '<i class="fa-solid fa-pause"></i> Durdur';
                btn.style.background = 'var(--color-warning)'; btn.style.color = '#333';
            } else if (_swElapsed > 0) {
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Devam';
                btn.style.background = 'var(--color-success)'; btn.style.color = '#fff';
            } else {
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Başlat';
                btn.style.background = 'var(--color-success)'; btn.style.color = '#fff';
            }
        });
        if (running) _swTick();
        // Tamamla butonu: görev bağlıysa ve durdurulduysa göster
        if (typeof _clkUpdateCompleteBtn === 'function') {
            _clkUpdateCompleteBtn(!running && _swElapsed > 0);
        }
    }

    function _swDoToggle() {
        if (_swRunning) {
            _swRunning  = false;
            _swElapsed += Date.now() - _swStart;
            cancelAnimationFrame(_swRaf);
        } else {
            _swRunning = true; _swStart = Date.now(); _swTick();
        }
        _swRefreshUI();
    }

    function _swDoReset() {
        _swRunning = false; _swElapsed = 0;
        cancelAnimationFrame(_swRaf);
        _swRefreshUI();
    }

    // Küçük widget
    window.swToggle = _swDoToggle;
    window.swReset  = _swDoReset;
    // Tam ekran
    window.swFsToggle = _swDoToggle;
    window.swFsReset  = _swDoReset;

    // ── PAYLAŞILAN ZAMANLAYıCı STATE ────────────────────────────────
    let _tmRunning = false, _tmRemaining = 0, _tmEnd = 0, _tmRaf = null;

    function _tmFmtSec(total) {
        const h = Math.floor(total/3600), m = Math.floor((total%3600)/60), s = total%60;
        return (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    }

    function _tmDraw(ms) {
        const str = _tmFmtSec(Math.max(0, Math.ceil(ms/1000)));
        const el  = document.getElementById('timerDisplay');      if (el)  el.textContent = str;
        const el2 = document.getElementById('clkFsTimerDisplay'); if (el2) el2.textContent = str;
    }

    function _tmTick() {
        if (!_tmRunning) return;
        const rem = _tmEnd - Date.now();
        if (rem <= 0) {
            _tmRunning = false; _tmRemaining = 0; _tmDraw(0);
            _tmShowDone(); return;
        }
        _tmDraw(rem);
        _tmRaf = requestAnimationFrame(_tmTick);
    }

    function _tmShowDone() {
        ['timerDoneMsg','clkFsTimerDone'].forEach(id => {
            const el = document.getElementById(id); if(el) el.style.display='block';
        });
        ['timerStartBtn','clkFsTimerStartBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) { btn.innerHTML='<i class="fa-solid fa-play"></i> Başlat'; btn.style.background='var(--color-primary)'; btn.style.color='#fff'; }
        });
        // Süre bitince de tamamla butonu göster (görev bağlıysa)
        if (typeof _clkUpdateCompleteBtn === 'function') _clkUpdateCompleteBtn(true);
    }

    function _tmRefreshUI() {
        // input'lar vs display'i doğru göster
        const running = _tmRunning;
        const hasTime = _tmRunning || _tmRemaining > 0;

        ['timerInputRow','clkFsTimerInputRow'].forEach(id => {
            const el = document.getElementById(id); if(el) el.style.display = hasTime ? 'none' : 'flex';
        });
        ['timerDisplay','clkFsTimerDisplay'].forEach(id => {
            const el = document.getElementById(id); if(el) el.style.display = hasTime ? 'block' : 'none';
        });
        ['timerDoneMsg','clkFsTimerDone'].forEach(id => {
            const el = document.getElementById(id); if(el) el.style.display = 'none';
        });

        const ms = running ? (_tmEnd - Date.now()) : _tmRemaining;
        if (hasTime) _tmDraw(ms);

        ['timerStartBtn','clkFsTimerStartBtn'].forEach(id => {
            const btn = document.getElementById(id); if (!btn) return;
            if (running) {
                btn.innerHTML='<i class="fa-solid fa-pause"></i> Durdur'; btn.style.background='var(--color-warning)'; btn.style.color='#333';
            } else if (_tmRemaining > 0) {
                btn.innerHTML='<i class="fa-solid fa-play"></i> Devam'; btn.style.background='var(--color-primary)'; btn.style.color='#fff';
            } else {
                btn.innerHTML='<i class="fa-solid fa-play"></i> Başlat'; btn.style.background='var(--color-primary)'; btn.style.color='#fff';
            }
        });

        if (running) _tmTick();
        // Tamamla butonu: görev bağlıysa, durdurulduysa VE ilerleme varsa göster
        if (typeof _clkUpdateCompleteBtn === 'function') {
            const hasProgress = !running && _tmRemaining > 0;
            _clkUpdateCompleteBtn(hasProgress);
        }
    }

    function _tmGetInputMs(prefix) {
        // prefix: '' (küçük widget: timerH/M/S) veya 'clkFs' (tam ekran: clkFsTimerH/M/S)
        const idH = prefix === 'clkFs' ? 'clkFsTimerH' : 'timerH';
        const idM = prefix === 'clkFs' ? 'clkFsTimerM' : 'timerM';
        const idS = prefix === 'clkFs' ? 'clkFsTimerS' : 'timerS';
        const h = parseInt(document.getElementById(idH)?.value)||0;
        const m = parseInt(document.getElementById(idM)?.value)||0;
        const s = parseInt(document.getElementById(idS)?.value)||0;
        return (h*3600+m*60+s)*1000;
    }

    function _tmDoToggle(prefix) {
        ['timerDoneMsg','clkFsTimerDone'].forEach(id => {
            const el=document.getElementById(id); if(el) el.style.display='none';
        });
        if (_tmRunning) {
            _tmRunning = false; _tmRemaining = _tmEnd - Date.now();
            cancelAnimationFrame(_tmRaf);
        } else {
            const totalMs = _tmRemaining > 0 ? _tmRemaining : _tmGetInputMs(prefix);
            if (totalMs <= 0) return;
            _tmRemaining = 0; _tmEnd = Date.now() + totalMs; _tmRunning = true;
        }
        _tmRefreshUI();
    }

    function _tmDoReset() {
        _tmRunning = false; _tmRemaining = 0; _tmEnd = 0; cancelAnimationFrame(_tmRaf);
        ['timerInputRow','clkFsTimerInputRow'].forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='flex'; });
        ['timerDisplay','clkFsTimerDisplay'].forEach(id=>{   const e=document.getElementById(id); if(e) e.style.display='none'; });
        ['timerDoneMsg','clkFsTimerDone'].forEach(id=>{      const e=document.getElementById(id); if(e) e.style.display='none'; });
        ['timerStartBtn','clkFsTimerStartBtn'].forEach(id=>{
            const b=document.getElementById(id);
            if(b){b.innerHTML='<i class="fa-solid fa-play"></i> Başlat';b.style.background='var(--color-primary)';b.style.color='#fff';}
        });
        _tmDraw(0);
        if (typeof _clkUpdateCompleteBtn === 'function') _clkUpdateCompleteBtn(false);
        // Görev bağlıysa input'lar kilitli kalır (sıfırlamak bağı kaldırmaz)
        if (_clkLinkedTask && _clkLinkedTask.mode === 'tm') {
            if (typeof _clkLockTimerInputs === 'function') _clkLockTimerInputs(true);
        }
    }

    // Küçük widget
    window.timerToggle = () => _tmDoToggle('');
    window.timerReset  = _tmDoReset;
    // Tam ekran — prefix 'clkFs' ile input değerlerini okur
    window.tmFsToggle  = () => _tmDoToggle('clkFs');
    window.tmFsReset   = _tmDoReset;



    
        // ======= WIDGET DÜZEN SİSTEMİ =======
    //
    // Çalışma prensibi:
    //   Her widget tek bir DOM node'dur (widget-calendar, widget-subject, widget-clock).
    //   mountWidget(), appendChild() ile node'u doğru container'a TAŞIR.
    //   DOM standardı: appendChild ile taşınan node otomatik olarak eski parent'tan çıkar.
    //   innerHTML kullanılmaz — bu node'u yok ederdi.

    window.widgetCatalog = [
        { id: 'calendar', label: 'Takvim',         icon: 'fa-solid fa-calendar-days' },
        { id: 'subject',  label: 'Konu Çalışması', icon: 'fa-solid fa-book-open-reader' },
        { id: 'clock',    label: 'Saat',            icon: 'fa-regular fa-clock' },
    ];

    window.widgetLayout = JSON.parse(
        localStorage.getItem('widgetLayout') || '{"left":"calendar","right":"subject"}'
    );

    let _wlpLeft  = window.widgetLayout.left;
    let _wlpRight = window.widgetLayout.right;

    // Widget'ı container'a taşı + göster
    function mountWidget(widgetId, containerId) {
        const w = document.getElementById(widgetId);
        const c = document.getElementById(containerId);
        if (!w || !c) return;

        // Hedef container'da başka widget varsa önce body'ye park et (gizle)
        Array.from(c.children).forEach(child => {
            if (child.id !== widgetId) {
                child.style.display = 'none';
                document.body.appendChild(child);
            }
        });

        // Widget'ı container'a taşı ve göster
        c.appendChild(w);
        w.style.display   = widgetId === 'widget-clock' ? 'flex' : '';
        w.style.height    = '100%';
        w.style.minHeight = '0';
        w.style.flex      = '1';
    }

    function applyWidgetVisibility() {
        const L = window.widgetLayout.left;
        const R = window.widgetLayout.right;

        // Sol container'ı temizle: içindeki widget doğru değilse body'ye park et
        Array.from(document.getElementById('leftWidgetContainer')?.children || []).forEach(child => {
            if (child.id !== 'widget-' + L) {
                child.style.display = 'none';
                document.body.appendChild(child);
            }
        });
        // Sağ container'ı temizle
        Array.from(document.getElementById('rightWidgetContainer')?.children || []).forEach(child => {
            if (child.id !== 'widget-' + R) {
                child.style.display = 'none';
                document.body.appendChild(child);
            }
        });

        mountWidget('widget-' + L, 'leftWidgetContainer');
        mountWidget('widget-' + R, 'rightWidgetContainer');

        if (L === 'subject' || R === 'subject') {
            if (typeof renderLessons === 'function') setTimeout(renderLessons, 80);
        }
        if (L === 'calendar' || R === 'calendar') {
            if (typeof renderCalendar === 'function') setTimeout(renderCalendar, 80);
        }
        positionLayoutBtn();
    }

    function positionLayoutBtn() {
        const btn   = document.getElementById('widgetLayoutBtn');
        const left  = document.getElementById('leftWidgetContainer');
        const right = document.getElementById('rightWidgetContainer');
        if (!btn || !left || !right) return;
        const lRect = left.getBoundingClientRect();
        const rRect = right.getBoundingClientRect();
        if (lRect.width === 0 || rRect.width === 0) return;
        btn.style.left      = ((lRect.right + rRect.left) / 2) + 'px';
        btn.style.top       = (lRect.top  + lRect.height  / 2) + 'px';
        btn.style.transform = 'translate(-50%, -50%)';
        btn.style.display   = 'flex';
    }

    window.openWidgetLayoutPanel = function() {
        _wlpLeft  = window.widgetLayout.left;
        _wlpRight = window.widgetLayout.right;
        renderWlpOptions();
        document.getElementById('wlpBackdrop').classList.add('show');
        document.getElementById('widgetLayoutPanel').classList.add('show');
    };

    window.closeWidgetLayoutPanel = function() {
        document.getElementById('wlpBackdrop').classList.remove('show');
        document.getElementById('widgetLayoutPanel').classList.remove('show');
    };

    function renderWlpOptions() {
        ['wlpLeftOptions', 'wlpRightOptions'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
        window.widgetCatalog.forEach(w => {
            ['Left', 'Right'].forEach(side => {
                const isCurrent  = (side === 'Left' ? _wlpLeft  : _wlpRight) === w.id;
                const isOpposite = (side === 'Left' ? _wlpRight : _wlpLeft)  === w.id;
                const container  = document.getElementById('wlp' + side + 'Options');
                if (!container) return;
                const div = document.createElement('div');
                div.className = 'wlp-option' + (isCurrent ? ' wlp-active' : '') + (isOpposite ? ' wlp-disabled' : '');
                div.innerHTML =
                    `<i class="${w.icon}" style="font-size:15px;width:18px;text-align:center;flex-shrink:0;"></i>` +
                    `<span style="flex:1;">${w.label}</span>` +
                    `<i class="fa-solid fa-check wlp-check"></i>`;
                if (!isOpposite) {
                    div.onclick = () => {
                        if (side === 'Left') _wlpLeft  = w.id;
                        else                 _wlpRight = w.id;
                        renderWlpOptions();
                    };
                }
                container.appendChild(div);
            });
        });
    }

    window.applyWidgetLayout = function() {
        if (_wlpLeft === _wlpRight) return;
        window.widgetLayout = { left: _wlpLeft, right: _wlpRight };
        localStorage.setItem('widgetLayout', JSON.stringify(window.widgetLayout));
        applyWidgetVisibility();
        window.closeWidgetLayoutPanel();
    };

    window.addEventListener('resize', positionLayoutBtn);

    function initWidgetLayout() {
        applyWidgetVisibility();
        setTimeout(positionLayoutBtn, 200);
        setTimeout(positionLayoutBtn, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidgetLayout);
    } else {
        initWidgetLayout();
    }
    // Firebase yüklendikten sonra da bir kez uygula
    setTimeout(initWidgetLayout, 1500);
