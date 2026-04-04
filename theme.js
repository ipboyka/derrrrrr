// ============================================================
// TEMA SİSTEMİ — Sayfa yüklenmeden önce çalışması gerekir
// ============================================================

        const THEMES = ['default', 'dark'];

        function setTheme(themeName) {
            if (themeName === 'default') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', themeName);
            }
            localStorage.setItem('app-theme', themeName);
        }

        function getTheme() {
            return localStorage.getItem('app-theme') || 'default';
        }

        // Sayfa yüklenince kayıtlı temayı uygula (flash önlemek için erken çalışır)
        (function() {
            const saved = getTheme();
            if (saved && saved !== 'default') {
                document.documentElement.setAttribute('data-theme', saved);
            }
        })();

        // Global scope'a aç (diğer scriptler kullanabilsin)
        window.setTheme = setTheme;
        window.getTheme = getTheme;
        window.THEMES = THEMES;

        // AYARLAR MODALI MOTORU
        function openSettingsModal() {
            const modal = document.getElementById('settingsModal');
            if (!modal) return;

            // Yan menüyü kapat
            const sideMenu   = document.getElementById('sideMenu');
            const menuOverlay = document.getElementById('menuOverlay');
            if (sideMenu)    sideMenu.classList.remove('open', 'active');
            if (menuOverlay) { menuOverlay.classList.remove('open', 'active'); menuOverlay.style.display = 'none'; }

            // Mevcut temayı seçili göster
            const current = getTheme();
            document.querySelectorAll('.settings-theme-option').forEach(opt => {
                const val = opt.dataset.themeValue;
                const radio = opt.querySelector('input[type="radio"]');
                if (val === current) {
                    opt.classList.add('active');
                    if (radio) radio.checked = true;
                } else {
                    opt.classList.remove('active');
                    if (radio) radio.checked = false;
                }
            });

            modal.style.display = 'flex';
        }

        function closeSettingsModal() {
            const modal = document.getElementById('settingsModal');
            if (modal) modal.style.display = 'none';
        }

        window.openSettingsModal = openSettingsModal;
        window.closeSettingsModal = closeSettingsModal;

        // DOM hazır olunca event listener'ları bağla
        document.addEventListener('DOMContentLoaded', function() {

            // Tema kartlarına tıklama
            document.querySelectorAll('.settings-theme-option').forEach(opt => {
                opt.addEventListener('click', function() {
                    document.querySelectorAll('.settings-theme-option').forEach(o => o.classList.remove('active'));
                    this.classList.add('active');
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) radio.checked = true;
                });
            });

            // Kapat butonu
            const closeBtn = document.getElementById('closeSettingsBtn');
            if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);

            // Modal dışına tıkla → kapat
            const modal = document.getElementById('settingsModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) closeSettingsModal();
                });
            }

            // Kaydet butonu
            const saveBtn = document.getElementById('saveSettingsModalBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    const selected = document.querySelector('.settings-theme-option.active');
                    if (!selected) return;
                    const newTheme = selected.dataset.themeValue;
                    setTheme(newTheme);

                    // Buton geri bildirimi
                    saveBtn.innerHTML = '<i class="fa-solid fa-check" style="margin-right:6px;"></i> Kaydedildi!';
                    saveBtn.style.background = 'var(--color-success)';
                    setTimeout(() => {
                        saveBtn.innerHTML = '<i class="fa-solid fa-save" style="margin-right:6px;"></i> Kaydet';
                        saveBtn.style.background = 'var(--color-primary)';
                        closeSettingsModal();
                    }, 1000);
                });
            }

            // Sidebar Ayarlar butonu
            const sideMenuSettingsBtn = document.getElementById('sideMenuSettingsBtn');
            if (sideMenuSettingsBtn) {
                sideMenuSettingsBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    openSettingsModal();
                });
            }
        });
