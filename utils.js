// ============================================================
// YARDIMCI FONKSİYONLAR VE KÜÇÜK MOTORLAR
// Bu dosya ders.html'deki dağınık küçük script bloklarını birleştirir.
// ============================================================

// --- AKILLI ÖLÇEKLEME (SMART SCALE) MOTORU ---
        function applySmartScale() {
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;

            const centerElements = document.querySelectorAll('.header, .middle-section, .main-content');

            if (screenW > 900) {
                const scaleW = (screenW - 380) / 1400;
                const scaleH = screenH / 900;
                let scale = Math.min(scaleW, scaleH);
                if (scale > 1) scale = 1;

                centerElements.forEach(el => {
                    el.style.zoom = scale;
                });

                // Alt boşluk: header üstte 20px bırakıyor (margin: 20px auto)
                // Aynı görsel boşluğu alta da uygula — zoom oranıyla orantılı
                document.body.style.paddingBottom = Math.round(45 * scale) + 'px';
            } else {
                centerElements.forEach(el => {
                    el.style.zoom = 1;
                });
                document.body.style.paddingBottom = '45px';
            }
        }

        // Debounce: resize sırasında sürekli tetiklenmeyi engeller
        let _scaleTimer = null;
        window.addEventListener('resize', function() {
            clearTimeout(_scaleTimer);
            _scaleTimer = setTimeout(applySmartScale, 80);
        });
        window.addEventListener('DOMContentLoaded', applySmartScale);
        applySmartScale();

// --- ZAMANLAYICI BUTON AYAR FONKSİYONU ---
        // Özel butonların işlevi (Başa sarma mantığı ile)
        window.adjTm = function(inputId, amount) {
            const input = document.getElementById(inputId);
            if(!input) return;
            
            let val = parseInt(input.value) || 0;
            let max = parseInt(input.getAttribute('max')) || 59;
            let min = parseInt(input.getAttribute('min')) || 0;
            
            val += amount;
            
            // Eğer maksimum limiti geçerse başa (0'a) sar, sıfırdan aşağı inerse de max değere (ör. 59) dön
            if(val > max) val = min; 
            if(val < min) val = max;
            
            input.value = val;
        };

// --- GÖREV SİLME / TEMİZLEME SİSTEMİ ---
        // --- GÖREV SİLME / TEMİZLEME SİSTEMİ ---
        document.addEventListener('DOMContentLoaded', () => {
            // JS sistemine dokunmadan, görev etiketi görünür olduğunda Çarpı butonunu da görünür yapan gözlemci
            const syncClearBtn = (labelId, btnId) => {
                const label = document.getElementById(labelId);
                const btn = document.getElementById(btnId);
                if(!label || !btn) return;
                
                const observer = new MutationObserver(() => {
                    if(label.style.display !== 'none' && label.innerText.trim() !== '') {
                        btn.style.display = 'flex';
                    } else {
                        btn.style.display = 'none';
                    }
                });
                observer.observe(label, { attributes: true, attributeFilter: ['style'], childList: true });
            };

            syncClearBtn('swTaskLabel', 'swClearTaskBtn');
            syncClearBtn('tmTaskLabel', 'tmClearTaskBtn');
            syncClearBtn('fswTaskLabel', 'fswClearTaskBtn');
            syncClearBtn('fstmTaskLabel', 'fstmClearTaskBtn');
        });


// --- DİNAMİK GÖREV HAPI (PILL) SİSTEMİ MOTORU ---
        // --- YENİ DİNAMİK GÖREV HAPI (PILL) SİSTEMİ MOTORU ---
        document.addEventListener('DOMContentLoaded', () => {
            // Arka planda JS tarafından güncellenen eski label'ı dinleyip, yeni HAP sistemine "sadece ders adını" aktarır
            const syncPill = (labelId, activeAreaId, lessonSpanId) => {
                const label = document.getElementById(labelId);
                const activeArea = document.getElementById(activeAreaId);
                const lessonSpan = document.getElementById(lessonSpanId);
                
                if(!label || !activeArea) return;
                
                const observer = new MutationObserver(() => {
                    const text = label.innerText.trim();
                    if(text !== '') {
                        activeArea.style.display = 'flex'; // Görev seçiliyse hapı uzat ve içerikleri göster
                        if(lessonSpan) {
                            // "Matematik - Türev çözümü" formatından sadece "Matematik" kısmını (çizgiden öncesini) alır
                            const lessonName = text.split('-')[0].trim();
                            lessonSpan.innerText = lessonName;
                        }
                    } else {
                        activeArea.style.display = 'none'; // Görev yoksa hapı kapat, sadece yuvarlak kalsın
                    }
                });
                
                observer.observe(label, { attributes: true, childList: true, characterData: true, subtree: true });
            };

            syncPill('swTaskLabel', 'swTaskActiveArea', 'swPillLessonName');
            syncPill('tmTaskLabel', 'tmTaskActiveArea', 'tmPillLessonName');
            syncPill('fswTaskLabel', 'fswTaskActiveArea', 'fswPillLessonName');
            syncPill('fstmTaskLabel', 'fstmTaskActiveArea', 'fstmPillLessonName');
        });

        // --- GÖREV SİLME / TEMİZLEME SİSTEMİ (EN GÜNCEL TEK VERSİYON) ---
        window.clearActiveTask = function(mode) {
            if(mode === 'sw') {
                if(document.getElementById('swTaskLabel')) document.getElementById('swTaskLabel').innerText = '';
                if(document.getElementById('fswTaskLabel')) document.getElementById('fswTaskLabel').innerText = '';
                if(document.getElementById('swCompleteBtn')) document.getElementById('swCompleteBtn').style.display = 'none';
                if(document.getElementById('fswCompleteBtn')) document.getElementById('fswCompleteBtn').style.display = 'none';
            } else if(mode === 'tm') {
                if(document.getElementById('tmTaskLabel')) document.getElementById('tmTaskLabel').innerText = '';
                if(document.getElementById('fstmTaskLabel')) document.getElementById('fstmTaskLabel').innerText = '';
                if(document.getElementById('tmCompleteBtn')) document.getElementById('tmCompleteBtn').style.display = 'none';
                if(document.getElementById('fstmCompleteBtn')) document.getElementById('fstmCompleteBtn').style.display = 'none';

                // --- ZAMANLAYICI KUTULARININ KİLİDİNİ GERİ AÇ VE RENKLERİ KORU ---
                const tmInputs = ['timerH', 'timerM', 'timerS', 'clkFsTimerH', 'clkFsTimerM', 'clkFsTimerS'];
                tmInputs.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) {
                        el.disabled = false;
                        el.readOnly = false;
                        
                        // Eğer tam ekran kutusuysa siyah arka planı ve renkleri zorla geri getir
                        if(id.startsWith('clkFsTimer')) {
                            el.style.background = 'rgba(0,0,0,0.2)';
                            el.style.borderColor = 'rgba(255,255,255,0.05)';
                            el.style.color = '#fff';
                        } else {
                            // Küçük ekran kutusuysa kendi temasına dönsün
                            el.style.background = 'var(--color-bg-input)';
                            el.style.color = 'var(--color-text-main)';
                        }
                    }
                });
                
                // Eğer +/- butonları kilitlenmişse onları da serbest bırak
                document.querySelectorAll('.tm-spin-btn, .tm-spin-btn-fs').forEach(btn => {
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                });
            }

            // --- KESİN ÇÖZÜM: Görevi hafızadan TAMAMEN silen kod ---
            try {
                if(typeof currentClkTask !== 'undefined') currentClkTask = null;
                if(typeof activeTask !== 'undefined') activeTask = null;
                if(typeof window.selectedTask !== 'undefined') window.selectedTask = null;
                window._clkLinkedTask = null;
                _clkLinkedTask = null;
            } catch (e) { 
                // Güvenlik kalkanı
            }
        };

// --- KRONOMETRE VE ZAMANLAYICI SABİT KUTU (TİTREME ÖNLEYİCİ) MOTORU ---
        // --- KRONOMETRE VE ZAMANLAYICI SABİT KUTU (TİTREME ÖNLEYİCİ) MOTORU ---
        document.addEventListener('DOMContentLoaded', () => {
            const makeStableTime = (elementId) => {
                const el = document.getElementById(elementId);
                if (!el) return;
                
                const formatTime = () => {
                    // Sistemin kendini tekrar edip kilitlenmesini engeller
                    if (el.innerHTML.includes('<span')) return;
                    
                    const text = el.innerText.trim();
                    if(!text) return;
                    
                    let html = '';
                    
                    if (text.includes('.')) {
                        // Kronometre (Saliseli)
                        const parts = text.split('.');
                        const mainTime = parts[0]; // Örn: "00:00"
                        const ms = parts[1];       // Örn: "00"
                        
                        // Dakika ve saniyeyi ayırıp sabit genişlikli (2.2ch) görünmez bloklara hapsediyoruz
                        const timeSegments = mainTime.split(':');
                        const formattedSegments = timeSegments.map(seg => 
                            `<span style="display:inline-block; min-width: 2.2ch; text-align: center; font-variant-numeric: tabular-nums; letter-spacing: 0;">${seg}</span>`
                        );
                        
                        // Parçaları araya şeffaf bir ":" koyarak birleştir
                        html = formattedSegments.join(`<span style="opacity: 0.5; margin: 0 2px;">:</span>`);
                        
                        // Salise kısmını da kendine has sabit bir bloğa al ve küçült
                        html += `<span style="opacity: 0.5; margin: 0 2px;">.</span>` + 
                                `<span style="display:inline-block; min-width: 2.2ch; text-align: left; font-size: 0.55em; font-variant-numeric: tabular-nums; color: var(--color-primary); letter-spacing: 0;">${ms}</span>`;
                                
                    } else {
                        // Zamanlayıcı (Salisesiz, sadece saat/dakika/saniye)
                        const timeSegments = text.split(':');
                        const formattedSegments = timeSegments.map(seg => 
                            `<span style="display:inline-block; min-width: 2.2ch; text-align: center; font-variant-numeric: tabular-nums; letter-spacing: 0;">${seg}</span>`
                        );
                        
                        html = formattedSegments.join(`<span style="opacity: 0.5; margin: 0 2px;">:</span>`);
                    }
                    
                    el.innerHTML = html;
                };

                const observer = new MutationObserver(formatTime);
                // Kutunun içindeki en ufak rakam değişimini yakalar ve anında kutulara koyar
                observer.observe(el, { childList: true, characterData: true, subtree: true });
                
                formatTime();
            };

            // Tüm ekranlardaki saat modüllerine bu taş gibi sabitleyiciyi uygula
            makeStableTime('swDisplay');
            makeStableTime('clkFsSwDisplay');
            makeStableTime('timerDisplay');
            makeStableTime('clkFsTimerDisplay');
        });
