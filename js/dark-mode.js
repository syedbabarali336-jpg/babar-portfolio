/**
 * dark-mode.js - Dark mode toggle for the portfolio
 *
 * Features:
 * - Respects system preference (prefers-color-scheme)
 * - Manual toggle button in footer
 * - Saves preference to localStorage
 * - Smooth transitions between modes
 * - Properly triggers CSS variable changes for cards, forms, and dialogue boxes
 */

const DARK_MODE_KEY = 'portfolio-dark-mode';

function initDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  if (!toggle) return;

  // Check localStorage first, then system preference
  const savedMode = localStorage.getItem(DARK_MODE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedMode ? savedMode === 'dark' : prefersDark;

  // Apply initial state
  applyDarkMode(isDark);

  // Listen for toggle clicks
  toggle.addEventListener('click', () => {
    const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newDark = !isCurrentlyDark;
    applyDarkMode(newDark);
    localStorage.setItem(DARK_MODE_KEY, newDark ? 'dark' : 'light');
  });

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(DARK_MODE_KEY)) {
      applyDarkMode(e.matches);
    }
  });
}

function applyDarkMode(isDark) {
  const toggle = document.getElementById('dark-mode-toggle');
  if (isDark) {
    // Force dark mode by setting data-theme attribute
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
    if (toggle) toggle.textContent = '☀ Light mode';
  } else {
    // Force light mode by setting data-theme attribute
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    if (toggle) toggle.textContent = '🌙 Dark mode';
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}
