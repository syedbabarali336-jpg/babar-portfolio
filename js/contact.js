/**
 * contact.js - Form validation and submission handler for the contact form.
 *
 * The form submits to Formspree (https://formspree.io), which:
 * 1. Receives the POST request from the browser
 * 2. Forwards it to my email (syedbabarali336@gmail.com)
 * 3. Redirects the user to a thank-you page
 *
 * No backend code needed; Formspree is the backend-as-a-service.
 */

const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

// Show thank-you message if they land on the page with #thanks hash
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#thanks') {
    statusEl.innerHTML = '✓ Message sent! I'll reply within 24 hours.';
    statusEl.style.color = '#2a9d8f';
    statusEl.style.fontWeight = '500';
    // clear the hash so the form resets if they refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// Handle form submission
form.addEventListener('submit', async (e) => {
  // Let Formspree handle the actual submission (browser default POST).
  // This handler just adds UX feedback.

  statusEl.innerHTML = 'Sending...';
  statusEl.style.color = '#2f3b4c';
  statusEl.style.fontWeight = '400';
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.6';
  submitBtn.style.cursor = 'not-allowed';
});

// Restore button state if submission fails or is intercepted
form.addEventListener('reset', () => {
  statusEl.innerHTML = '';
  submitBtn.disabled = false;
  submitBtn.style.opacity = '1';
  submitBtn.style.cursor = 'pointer';
});
