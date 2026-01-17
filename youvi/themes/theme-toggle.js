(function() {
    'use strict';
    
    const THEME_KEY = 'youvi-theme';
    const THEME_LIGHT = 'light';
    const THEME_DARK = 'dark';
    const THEME_SKEUO = 'skeuo';
    
    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        return savedTheme || THEME_LIGHT;
    }
    
    function applyTheme(theme) {
        document.documentElement.classList.remove('dark-theme', 'skeuo-theme');
        document.body.classList.remove('dark-theme', 'skeuo-theme');
        
        if (theme === THEME_DARK) {
            document.documentElement.classList.add('dark-theme');
            document.body.classList.add('dark-theme');
        } else if (theme === THEME_SKEUO) {
            document.documentElement.classList.add('skeuo-theme');
            document.body.classList.add('skeuo-theme');
        }
        localStorage.setItem(THEME_KEY, theme);
    }
    
    function initTheme() {
        const currentTheme = loadTheme();
        applyTheme(currentTheme);
        updateDropdownText(currentTheme);
    }
    
    function updateDropdownText(theme) {
        const dropdownItems = document.querySelectorAll('.theme-dropdown-item');
        dropdownItems.forEach(item => {
            if (item.dataset.theme === theme) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    function setTheme(theme) {
        applyTheme(theme);
        updateDropdownText(theme);
    }
    
    function setupThemeDropdown() {
        const settingsBtn = document.querySelector('.settings-btn');
        const dropdown = document.querySelector('.theme-dropdown');
        
        if (!settingsBtn || !dropdown) {
            return;
        }
        
        function positionDropdown() {
            const rect = settingsBtn.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 5) + 'px';
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        }
        
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                positionDropdown();
            }
        });
        
        window.addEventListener('scroll', function() {
            if (dropdown.classList.contains('show')) {
                positionDropdown();
            }
        });
        
        window.addEventListener('resize', function() {
            if (dropdown.classList.contains('show')) {
                positionDropdown();
            }
        });
        
        document.addEventListener('click', function(e) {
            if (!settingsBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        const dropdownItems = document.querySelectorAll('.theme-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedTheme = this.dataset.theme;
                setTheme(selectedTheme);
                dropdown.classList.remove('show');
            });
        });
    }
    
    window.addEventListener('storage', function(e) {
        if (e.key === THEME_KEY && e.newValue) {
            applyTheme(e.newValue);
            updateDropdownText(e.newValue);
        }
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initTheme();
            setupThemeDropdown();
        });
    } else {
        initTheme();
        setupThemeDropdown();
    }
    
    window.youviTheme = {
        setTheme: setTheme,
        getTheme: loadTheme
    };
})();