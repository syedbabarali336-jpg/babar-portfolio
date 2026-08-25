/* Binary Triage - the portfolio's one real feature.
   Client-side only: parses pasted tool output and drafts an analysis-report skeleton.
   Everything runs in the visitor's browser; nothing is transmitted. */
(function () {
  'use strict';

  var MAX_LIST = 12;

  var IOC_PATTERNS = [
    { id: 'sha256', label: 'SHA-256 hash', re: /\b[a-f0-9]{64}\b/gi },
    { id: 'sha1',   label: 'SHA-1 hash',   re: /\b[a-f0-9]{40}\b/gi },
    { id: 'md5',    label: 'MD5 hash',     re: /\b[a-f0-9]{32}\b/gi },
    { id: 'ip',     label: 'IP address',   re: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g },
    { id: 'url',    label: 'URL',          re: /\bhttps?:\/\/[^\s"'<>]+/gi },
    { id: 'domain', label: 'Domain name',  re: /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|net|org|info|biz|io|xyz|top|ru|cn|su|tk|ml|ga|cf|pw|cc|club|online|site)\b/gi },
    { id: 'regkey', label: 'Registry key', re: /\bHKEY_[A-Z_]+(?:\\[^\r\n;,]+)+/gi },
    { id: 'winpath',label: 'File path',    re: /\b[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g },
    { id: 'mutex',  label: 'Mutex',        re: /\b(?:Global|Local)\\[^\s"']+/g },
    { id: 'b64',    label: 'Encoded blob', re: /\b[A-Za-z0-9+\/]{24,}={0,2}/g }
  ];

  /* Longer hashes absorb shorter ones so an SHA-256 is not also reported as MD5. */
  var HASH_ORDER = { sha256: null, sha1: null, md5: null };

  var SUSPICIOUS = [
    ['CurrentVersion\\Run',            'Registry Run-key persistence mechanism referenced'],
    ['schtasks',                        'Scheduled task creation - persistence or timed execution'],
    ['CreateRemoteThread',              'Remote thread creation API - classic code-injection technique'],
    ['VirtualAllocEx',                  'Memory allocation in another process - injection prerequisite'],
    ['WriteProcessMemory',              'Memory writing into another process - injection/hollowing'],
    ['SetWindowsHookEx',                'Windows hook installation - keystroke monitoring capability'],
    ['-enc',                            'Encoded command flag - deliberate obfuscation'],
    ['powershell',                      'PowerShell referenced from a binary context'],
    ['DownloadString',                  'In-memory payload download pattern (no disk touch)'],
    ['WebClient',                       'HTTP client usage for outbound transfer'],
    ['vssadmin',                        'Shadow-copy deletion - anti-recovery / ransomware pattern'],
    ['bcdedit',                         'Boot configuration edit - recovery-blocking pattern'],
    ['rundll32',                        'DLL execution through rundll32 - LOLBin execution'],
    ['regsvr32',                        'COM registration via regsvr32 - LOLBin execution'],
    ['cmd.exe',                         'Shell invocation from the sample'],
    ['keylog',                          'Keystroke-capture related string'],
    ['xmrig',                           'XMRig crypto-miner indicator']
  ];

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }

  function extract(text) {
    var iocs = [], i, p, m, vals;
    for (i = 0; i < IOC_PATTERNS.length; i++) {
      p = IOC_PATTERNS[i];
      p.re.lastIndex = 0;
      vals = [];
      while ((m = p.re.exec(text)) !== null) {
        if (m[0].length >= 4) vals.push(m[0]);
        if (m.index === p.re.lastIndex) p.re.lastIndex++;
      }
      vals = uniq(vals);
      if (HASH_ORDER.hasOwnProperty(p.id)) {
        vals = vals.filter(function (h) {
          return !vals.some(function (other) { return other !== h && other.indexOf(h) !== -1; });
        });
      }
      if (p.id === 'domain') {
        var urls = iocs.filter(function (x) { return x.id === 'url'; })[0];
        if (urls) {
          vals = vals.filter(function (d) {
            return !urls.values.some(function (u) { return u.indexOf(d) !== -1; });
          });
        }
      }
      if (vals.length) iocs.push({ id: p.id, label: p.label, values: vals });
    }
    var low = text.toLowerCase(), behaviors = [];
    SUSPICIOUS.forEach(function (kv) {
      if (low.indexOf(kv[0].toLowerCase()) !== -1) behaviors.push(kv[1]);
    });
    return { iocs: iocs, behaviors: uniq(behaviors) };
  }

  function hypotheses(res) {
    var h = [], has = function (id) { return res.iocs.some(function (x) { return x.id === id; }); };
    res.behaviors.forEach(function (b) { h.push(b + '.'); });
    if (has('url') || has('ip')) h.push('Outbound network indicators present - possible command-and-control or payload retrieval. Verify with DNS/whois history.');
    if (has('mutex')) h.push('Mutex suggests single-instance enforcement - a common malware-family fingerprint worth pivoting on.');
    if (has('b64') && lowEnc(res)) h.push('Encoded blobs plus obfuscation flags suggest a staged, packed, or encrypted payload - unpacking likely required.');
    if (!h.length) h.push('No high-confidence behavior signals in this excerpt - treat as inconclusive and widen collection (imports, resources, full strings dump).');
    return h;
  }
  function lowEnc(res) {
    return res.behaviors.some(function (b) { return /obfuscation|PowerShell/.test(b); });
  }

  function nextSteps(res) {
    var s = ['Confirm file identity: recompute hashes and check them against VirusTotal / MalwareBazaar before deeper work.'];
    if (res.iocs.some(function (x) { return x.id === 'ip' || x.id === 'url' || x.id === 'domain'; }))
      s.push('Pivot the network indicators: passive DNS, whois, and threat-intel lookups to attribute infrastructure.');
    if (res.iocs.some(function (x) { return x.id === 'regkey' || x.id === 'winpath'; }))
      s.push('Map every filesystem and registry write into an execution timeline (Procmon during detonation).');
    if (res.behaviors.length)
      s.push('Detonate in an isolated VM with network capture (Wireshark + Procmon) to confirm the hypothesized behaviors above.');
    s.push('Draft the decision section: what the file does, business impact, and containment or remediation actions for the report recipient.');
    return s;
  }

  function render(res, rawLen) {
    var total = res.iocs.reduce(function (n, x) { return n + x.values.length; }, 0);
    var rows = '';
    res.iocs.forEach(function (g) {
      g.values.forEach(function (v, idx) {
        var shown = idx < MAX_LIST ? esc(v) : null;
        if (shown) rows += '<tr><td>' + g.label + '</td><td class="mono">' + shown + '</td></tr>';
      });
      if (g.values.length > MAX_LIST)
        rows += '<tr><td>' + g.label + '</td><td>... +' + (g.values.length - MAX_LIST) + ' more</td></tr>';
    });
    var hyp = hypotheses(res).map(function (x) { return '<li>' + x + '</li>'; }).join('');
    var steps = nextSteps(res).map(function (x, i) { return '<li>' + x + '</li>'; }).join('');
    var html =
      '<h2>Draft report skeleton</h2>' +
      '<p class="lede">' + total + ' indicator(s) across ' + res.iocs.length + ' type(s), parsed from ' + rawLen.toLocaleString() + ' characters of raw output.</p>' +
      '<h3>1 &middot; Executive summary (fill in)</h3>' +
      '<p class="signoff">Sample [name/hash], first observed [date]. Static triage indicates [primary behavior]. Confidence: [low/medium/high] pending dynamic confirmation.</p>' +
      (rows ? '<h3>2 &middot; Indicators of compromise</h3><table class="ioc"><tr><th>Type</th><th>Value</th></tr>' + rows + '</table>' : '<h3>2 &middot; Indicators of compromise</h3><p class="pending">None extracted - paste richer output (strings, imports, config dumps).</p>') +
      '<h3>3 &middot; Behavior hypotheses</h3><ul class="hyp">' + hyp + '</ul>' +
      '<h3>4 &middot; Recommended next steps</h3><ol class="hyp">' + steps + '</ol>' +
      '<p class="signoff">Draft generated locally by Binary Triage &middot; Reviewed by ____________ &middot; Date ____________</p>' +
      '<div class="btnrow"><button class="ghost" id="copyrep">Copy report as text</button><span class="copied" id="copiedmsg"></span></div>';
    document.getElementById('report').innerHTML = html;
    document.getElementById('copyrep').addEventListener('click', function () { copyText(res, rawLen); });
  }

  function plainText(res, rawLen) {
    var L = [];
    L.push('DRAFT ANALYSIS REPORT SKELETON - generated locally by Binary Triage');
    L.push('Source: ' + rawLen.toLocaleString() + ' characters of raw tool output');
    L.push('');
    L.push('1. EXECUTIVE SUMMARY (fill in)');
    L.push('Sample [name/hash], first observed [date]. Static triage indicates [primary behavior]. Confidence: [low/medium/high] pending dynamic confirmation.');
    L.push('');
    L.push('2. INDICATORS OF COMPROMISE');
    res.iocs.forEach(function (g) {
      L.push(g.label.toUpperCase());
      g.values.slice(0, MAX_LIST).forEach(function (v) { L.push('  ' + v); });
      if (g.values.length > MAX_LIST) L.push('  ... +' + (g.values.length - MAX_LIST) + ' more');
    });
    L.push('');
    L.push('3. BEHAVIOR HYPOTHESES');
    hypotheses(res).forEach(function (h) { L.push('  - ' + h); });
    L.push('');
    L.push('4. RECOMMENDED NEXT STEPS');
    nextSteps(res).forEach(function (s, i) { L.push('  ' + (i + 1) + '. ' + s); });
    L.push('');
    L.push('Reviewed by ____________  Date ____________');
    return L.join('\n');
  }

  function copyText(res, rawLen) {
    var t = plainText(res, rawLen);
    function ok() { document.getElementById('copiedmsg').textContent = 'Copied.'; setTimeout(function () { document.getElementById('copiedmsg').textContent = ''; }, 2500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { fallbackCopy(t); ok(); });
    else { fallbackCopy(t); ok(); }
  }
  function fallbackCopy(t) {
    var ta = document.createElement('textarea'); ta.value = t;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function fail(msg) {
    var e = document.getElementById('err');
    e.textContent = msg; e.classList.add('show');
    document.getElementById('paste').focus();
    document.getElementById('report').innerHTML = '';
  }

  var SAMPLE = [
    'c55e4780684a93b75e33e26a2e8ea6aa  sample_4471.bin',
    'SHA256: 9f2b0d3c71a45ee58f0c2d61ba7e34d92c85f601aa3be47d19c0b582ef43a7d6',
    'LEAVE', 'VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread',
    'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'Global\\{7A4C21F0-93E2-4B1D-9A77-C31F8042BB19}',
    'C:\\Users\\Public\\Downloads\\svc_update.tmp',
    'http://185[.]220[.]101[.]47/gate.php',
    'hxxp://cdn-update-check[.]top/payload.bin',
    'powershell -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoA',
    'URLDownloadToFileA', 'InternetOpenA', 'vssadmin delete shadows /all /quiet',
    'schtasks /create /tn MicrosoftEdgeUpdateCore /sc minute /mo 15',
    'kernel32.dll', 'user32.dll', 'ws2_32.dll'
  ].join('\n');

  document.addEventListener('DOMContentLoaded', function () {
    var box = document.getElementById('paste');
    document.getElementById('analyze').addEventListener('click', function () {
      var err = document.getElementById('err');
      err.classList.remove('show');
      var text = box.value;
      if (!text.trim()) {
        fail('Paste some tool output first - even three lines of strings output works. Nothing leaves your browser either way.');
        return;
      }
      if (text.length > 500000) { fail('That is over 500k characters - trim to the interesting sections first.'); return; }
      render(extract(text), text.length);
    });
    document.getElementById('sample').addEventListener('click', function () {
      box.value = SAMPLE;
      document.getElementById('err').classList.remove('show');
      render(extract(SAMPLE), SAMPLE.length);
    });
    document.getElementById('clear').addEventListener('click', function () {
      box.value = ''; document.getElementById('report').innerHTML = '';
      document.getElementById('err').classList.remove('show'); box.focus();
    });
  });
})();
