# Babar's Portfolio — Reverse Engineering into Actionable Analysis

**Live:** https://babarhasnain.is-a.dev/
**Source:** https://github.com/syedbabarali336-jpg/babar-portfolio
**Built by:** Syed Babar Hasnain Ali Naqvi
**Stack:** Plain HTML / CSS / vanilla JavaScript. No framework, no bundler, no backend.

---

## What this is

A five-page portfolio that proves one claim to one specific reader: *I can reverse-engineer malware and binaries into clear, actionable analysis.*

The site does three things and nothing else:

1. **States the claim** on the home page in one screen.
2. **Backs the claim with two real case studies** (a third is honestly labeled "in progress") on the Work page.
3. **Demonstrates the claim live** with Binary Triage, a client-side tool on `/triage.html` that parses pasted tool output into an analysis-report skeleton.

Everything else — the dark mode, the contact form, the social-share cards — exists to make those three things easier to take seriously.

## Who it's for

A malware analysis team lead at a security vendor, evaluating whether a third-year BSc Cybersecurity student can do real work. They have five minutes, one tab, and a strong bias against résumé lines that don't connect to artifacts.

## Who it's not for

Anyone looking for a React/Next.js portfolio template, a design portfolio, or a content site. Those needs are not what this is.

---

## Setup — a stranger could follow this

The whole site is static. No build step, no dependencies to install, no API keys.

### Run it locally (5 commands)

```bash
git clone https://github.com/syedbabarali336-jpg/babar-portfolio.git
cd babar-portfolio
# Option A: open the file
open index.html
# Option B: serve it (recommended for the contact form mailto: and clipboard)
python -m http.server 8000
# Then open http://localhost:8000
```

### Deploy it (3 commands + a checkbox)

```bash
git init
git add .
git commit -m "Portfolio launch"
# Push to a GitHub repo, then:
```

GitHub repo → **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main / root** → **Save**.

The site is live at `https://<username>.github.io/<repo>/` within ~2 minutes. For a custom domain, add a `CNAME` file (one line: the bare domain) and configure DNS per your registrar.

### Optional: register a free subdomain

The site uses `babarhasnain.is-a.dev` from the [is-a-dev](https://is-a.dev/) register — a free subdomain service for GitHub Pages users. The process is documented in `LAUNCH_GUIDE.md` in the parent directory.

---

## Usage examples

### 1. Read the site like the target audience would

1. Land on `https://babarhasnain.is-a.dev/`
2. Read the hero: one claim, one action.
3. Click "Work" → see Case A (lead, with verifiable numbers) and Case B.
4. Click "Triage" → try the live tool.
5. If convinced, click "Book a short call" anywhere on the site.

Total time: under five minutes. The brief's stranger test.

### 2. Use Binary Triage (the one real feature)

1. Go to `triage.html`.
2. Paste raw tool output — `strings` from an unknown binary, hash output, anything the file gives up.
3. Click **Analyze**.
4. Get a four-section report skeleton: Executive summary placeholders, Indicators of Compromise table, Behavior hypotheses, Recommended next steps.
5. Click **Copy report as text** to copy a plain-text version to your clipboard.

The demo button (`Load sample strings output`) loads a representative sample so you can see the full skeleton without needing your own sample.

### 3. Send a message

The contact form on `contact.html` opens your default email client with the form data pre-filled (uses `mailto:` — no backend required). Tested with Gmail, Outlook desktop, and Apple Mail. The footer of every page also has direct email and GitHub links as fallbacks.

---

## Architecture (simple sketch)

```
Browser
└── babarhasnain.is-a.dev (GitHub Pages)
    ├── index.html         ─ claim + Work preview + CTA
    ├── work.html          ─ Case A (lead), Case B, Case C (in progress)
    ├── triage.html        ─ Binary Triage live demo
    ├── about.html         ─ Background, tools, philosophy
    ├── contact.html       ─ mailto: form
    ├── assets/
    │   ├── favicon.svg
    │   ├── og_card.png    (1200×630, only loaded by social crawlers)
    │   └── og_card.svg
    ├── css/style.css      ─ identity-kit v2 (4-color, 2-font system) + dark mode
    └── js/
        ├── triage.js      ─ the feature (regex extraction + render)
        ├── contact.js     ─ form validation + mailto: handler
        └── dark-mode.js   ─ data-theme toggle, localStorage, sync IIFE
```

The whole site is 5 HTML files + 1 CSS file + 3 JS files. Total weight: ~62 KB visitor-relevant (under 13 KB compressed per page). Largest single asset is the 36 KB OG card, which is only fetched by social-media crawlers.

**Why this stack and not a framework:** the audience is malware analysts. The site is the *proof*; a loading-spinner React app would undercut the message. The site behaves like my reports do — open fast, show evidence, work offline-ish, no dependencies to rot. Static files on GitHub Pages also mean zero infrastructure to patch while I am a student. The one feature that needed logic (Binary Triage) runs client-side by design: a security portfolio that uploads your suspicious strings to some server would fail its own thesis.

---

## v2 eval results (the launch test, re-run today)

The triage tool is covered by a simulated-DOM test suite at `test/triage.test.js`. It runs four flows against the production `js/triage.js` without a browser:

```
$ node test/triage.test.js
PASS: empty-submission guard (the hardened bug)
PASS: sample analysis end-to-end (hashes deduped across types, hypotheses, steps, copy wired)
PASS: oversized-input guard
PASS: clear reset
ALL FUNCTIONAL TESTS PASSED
```

| Flow | What it proves | Status |
|---|---|---|
| Empty submission | The hardened bug from the original launch — clicking Analyze on empty input now shows a friendly inline error instead of producing a blank report. | ✅ Pass |
| Sample end-to-end | All 10 IOC regex families extract from the bundled sample; SHA-256 is not double-counted as MD5; mutex, network, and ransomware hypotheses all fire; copy-report button is wired. | ✅ Pass |
| Oversized input (>500,000 chars) | The textarea rejects inputs over 500 KB with a clear message rather than locking the tab. | ✅ Pass |
| Clear | Clicking Clear resets the textarea, hides the error, and clears the report. | ✅ Pass |

The "hardened bug" in test #1 is the one this site is honest about: the very first launch shipped with a `ReferenceError` that fired the moment a visitor clicked "Load sample." A simulated-DOM test would have caught it before the site went live. One-line fix; the test stays in the repo as regression cover.

---

## Limitations (named, not hidden)

These are real. I am naming them because that's what the brief asks for, and because not naming them is the kind of thing that loses trust.

1. **No captcha on the contact form.** A spam bot can fill it and trigger the mailto. Form is `mailto:`-based, so captcha would not stop a determined spammer from opening the user's email client either. Monitored, not solved.
2. **No backend, by design.** Means no server-side validation, no rate limiting, no submission logs. The trade-off was acceptable for the audience (a recruiter isn't going to fill this 1000 times).
3. **Binary Triage is pattern-matching, not analysis.** It extracts IOCs from a text dump and groups them. It does not disassemble, does not run the binary, does not judge intent. The "behavior hypotheses" are keyword-driven. For real analysis, this is the *first step* of the workflow, not the workflow itself.
4. **Case C is honestly labeled "in progress."** A real binary walkthrough (Ghidra disassembly, findings, recommendations) takes the lead slot when it ships. Until then, the slot says so.
5. **Triage regex covers Windows-platform patterns.** Linux/ELF IOCs and macOS patterns are out of scope. Adding them would mean more regex families and a more opinionated maintenance burden.
6. **No mobile-app or PWA.** The site is responsive web only. No "Add to Home Screen" optimization, no service worker, no offline mode.
7. **The site is in English only.** No i18n. The audience is global but my written voice is one language for now.
8. **No analytics beyond Cloudflare Web Analytics** (privacy-first, no cookies, no PII). I cannot see what specific visitors do; I can only see aggregate page views and referrers.
9. **Lighthouse score not captured this week.** PageSpeed Insights returned a 429 rate-limit when I last tried. The "fast" claim rests on file weights (5-8 KB per page compressed) and direct file-size audit, not on Google's number.
10. **The FlyRank graduate badge is a placeholder.** The badge is issued by FlyRank after this assignment passes; the slot in every footer is installed and waiting.

Each of these is also in `Capstone/SUBMISSION_CARD.md` and `Capstone/LAUNCH_GUIDE.md` in the parent directory.

---

## AI disclosure (transparency line)

I built this portfolio **with Claude (Anthropic's AI assistant)** as a working partner. The line between what I did and what the AI did:

**What was mine:** the claim, the audience, the design system (identity kit v2: 4 colors, 2 fonts, accent-once), the words on every page (including cutting AI's first generic drafts), every visual decision, the structure of the case studies, the architecture decision to stay static, the testing strategy, the honesty about limitations.

**What the AI did under my direction:** the parser engine for Binary Triage (10 regex families, hash de-duplication, hypothesis rules, the report-skeleton template), the contact-form mailto: handler, the dark-mode toggle, the responsive CSS at every breakpoint, the SEO meta block, the test harness, and a significant portion of the writing (which I then edited).

**What I checked myself:** every regex against real malware sample patterns, every CSS breakpoint at 480/560/640/768 px, every color contrast against WCAG AA, every form edge case, every link. The "empty submission" bug that the v2 eval tests for was caught by me reading the code, not by the AI flagging it.

**My rule, held throughout:** AI does the mass extraction; I keep the judgment. I don't ship anything I can't explain line by line.

---

## License

MIT for the code. The words are mine.

## Contact

- Email: syedbabarali336@gmail.com
- GitHub: [@syedbabarali336-jpg](https://github.com/syedbabarali336-jpg)
- Cal.com (book a call): https://cal.com/portfolio-analysis-review
