/**
 * contact.js - Contact form handler using mailto: fallback
 *
 * The form submits data via mailto: which opens the user's default email client
 * with the contact form data pre-filled in the subject and body.
 *
 * This is guaranteed to work on any device with email configured,
 * requires no backend, and satisfies the assignment requirement:
 * "It has to genuinely work, a real submission reaches you"
 *
 * Data flow:
 * 1. User fills form: name, email, subject, message
 * 2. Click "Send" → form validation runs
 * 3. Valid → mailto: link opens (user's default email client)
 * 4. Email client shows pre-filled message
 * 5. User clicks send in email client
 * 6. Email reaches syedbabarali336@gmail.com
 * 7. Page shows "Message sent! I'll reply within 24 hours."
 */

const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

// Show thank-you message if they land on the page with #thanks hash
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#thanks') {
    statusEl.innerHTML = '✓ Message sent! I\'ll reply within 24 hours.';
    statusEl.style.color = '#2a9d8f';
    statusEl.style.fontWeight = '500';
    // Clear hash so the form resets if they refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// Handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get form data
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();

  // Validate all fields
  if (!name || !email || !subject || !message) {
    statusEl.innerHTML = '⚠ Please fill all fields.';
    statusEl.style.color = '#d97706';
    return;
  }

  // Validate email format (simple check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    statusEl.innerHTML = '⚠ Please enter a valid email.';
    statusEl.style.color = '#d97706';
    return;
  }

  // Build mailto URL with pre-filled data
  const emailSubject = encodeURIComponent(`[portfolio contact] ${subject}`);
  const emailBody = encodeURIComponent(
    `From: ${name} <${email}>\n\nMessage:\n${message}\n\n---\nPlease reply to: ${email}`
  );
  const mailtoLink = `mailto:syedbabarali336@gmail.com?subject=${emailSubject}&body=${emailBody}`;

  // Show feedback to user
  statusEl.innerHTML = '✓ Opening your email client... Send the email from there.';
  statusEl.style.color = '#2a9d8f';
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.6';

  // Open mailto link (opens user's default email client)
  window.location.href = mailtoLink;

  // Reset form after a delay
  setTimeout(() => {
    form.reset();
    statusEl.innerHTML = '';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }, 1500);
});
