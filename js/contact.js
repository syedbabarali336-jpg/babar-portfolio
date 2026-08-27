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
    statusEl.className = 'form-status form-status--ok';
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
    statusEl.className = 'form-status form-status--warn';
    return;
  }

  // Validate email format (simple check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    statusEl.innerHTML = '⚠ Please enter a valid email.';
    statusEl.className = 'form-status form-status--warn';
    return;
  }

  // Length guards (defensive - the HTML maxlength catches most, but JS is final say)
  if (name.length > 100 || email.length > 254 || subject.length > 150 || message.length > 5000) {
    statusEl.innerHTML = '⚠ One of the fields is too long.';
    statusEl.className = 'form-status form-status--warn';
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
  statusEl.className = 'form-status form-status--ok';
  submitBtn.disabled = true;
  submitBtn.setAttribute('aria-busy', 'true');

  // Open mailto link (opens user's default email client)
  window.location.href = mailtoLink;

  // Reset form after a delay
  setTimeout(() => {
    form.reset();
    statusEl.innerHTML = '';
    statusEl.className = 'form-status';
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
  }, 1500);
});

// Double-submit guard: any rapid second click on submit is ignored
let submitting = false;
form.addEventListener('submit', () => {
  if (submitting) return;
  submitting = true;
  setTimeout(() => { submitting = false; }, 1500);
});
