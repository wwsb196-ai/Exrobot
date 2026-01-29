const { spawn } = require('child_process');
const p = require('path');
const f = require('fs');
const crypto = require('crypto');
const os = require('os');

class CodeRun {
  constructor() {
    this.pool = [];
    this.maxCon = 5;
    this.timeout = 60000;
    this.sandbox = p.join(os.tmpdir(), 'sandbox');
    this.cfg = {
      py: { ext: ['.py', '.pyw'], shebang: '#!/usr/bin/env python3', run: (f, t) => this.runPy(f, t), fmt: c => this.fmtPy(c) },
      js: { ext: ['.js', '.mjs', '.cjs'], shebang: '#!/usr/bin/env node', run: (f, t) => this.runJs(f, t), fmt: c => this.fmtJs(c) },
      ts: { ext: ['.ts', '.tsx'], run: (f, t) => this.runTs(f, t), fmt: c => this.fmtTs(c) },
      sh: { ext: ['.sh', '.bash'], shebang: '#!/bin/bash', run: (f, t) => this.runSh(f, t) },
      html: { ext: ['.html', '.htm'], fmt: c => this.fmtHtml(c) },
      css: { ext: ['.css', '.scss', '.sass', '.less'], fmt: c => this.fmtCss(c) },
      json: { ext: ['.json'], fmt: c => this.fmtJson(c) },
      md: { ext: ['.md', '.markdown'], fmt: c => this.fmtMd(c) }
    };
    if (!f.existsSync(this.sandbox)) f.mkdirSync(this.sandbox, { recursive: true });
  }

  detect(code, name = '') {
    if (name) {
      const e = p.extname(name).toLowerCase();
      for (const [lang, c] of Object.entries(this.cfg)) {
        if (c.ext.includes(e)) return lang;
      }
    }
    const l = code.split('\n')[0].trim();
    if (l.startsWith('#!')) {
      if (l.includes('python')) return 'py';
      if (l.includes('node')) return 'js';
      if (l.includes('bash')) return 'sh';
    }
    if (code.includes('def ') || code.includes('class ')) return 'py';
    if (code.includes('function') || code.includes('const ') || code.includes('let ')) return 'js';
    if (code.includes('interface ') || code.includes('type ')) return 'ts';
    return 'js';
  }

  async run(code, lang, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();

    try {
      if (!this.cfg[lang]) return { ok: false, err: `Bad lang: ${lang}`, id };
      if (this.pool.length >= this.maxCon) return { ok: false, err: 'Pool full', id, retry: 5000 };

      const file = await this.mkFile(lang, code);
      const cfg = this.cfg[lang];
      let r;
      if (cfg.run) r = await cfg.run(file, opt.timeout || this.timeout);
      else r = { ok: false, err: `No run for ${lang}`, id };

      this.rmFile(file);
      return { ...r, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async mkFile(lang, code) {
    const c = this.cfg[lang];
    const name = `scr_${crypto.randomUUID().slice(0, 8)}${c.ext[0]}`;
    const fp = p.join(this.sandbox, name);
    let cnt = code;
    if (c.shebang && !code.trim().startsWith('#!')) cnt = c.shebang + '\n\n' + code;
    f.writeFileSync(fp, cnt, 'utf-8');
    f.chmodSync(fp, 0o755);
    return fp;
  }

  rmFile(fp) {
    try { if (f.existsSync(fp)) f.unlinkSync(fp); } catch {}
  }

  async runPy(fp, to) { return this.spawn('python3', [fp], to); }
  async runJs(fp, to) { return this.spawn('node', [fp], to); }

  async runTs(fp, to) {
    const jsf = fp.replace(/\.ts$/, '.js');
    const r = await this.spawn('npx', ['tsc', fp, '--outDir', this.sandbox, '--module', 'commonjs', '--target', 'ES2020'], to);
    if (!r.ok) return r;
    if (f.existsSync(jsf)) return this.runJs(jsf, to);
    return { ok: false, err: 'No compiled js' };
  }

  async runSh(fp, to) { return this.spawn('bash', [fp], to); }

  async spawn(cmd, args, to) {
    return new Promise(resolve => {
      let out = '', err = '', k = false;
      const cp = spawn(cmd, args, { cwd: this.sandbox, timeout: to, maxBuffer: 10 * 1024 * 1024 });
      cp.stdout.on('data', d => out += d.toString());
      cp.stderr.on('data', d => err += d.toString());
      cp.on('close', code => resolve({ ok: code === 0 && !k, data: { cmd: `${cmd} ${args.join(' ')}`, out, err, code, killed: k } }));
      cp.on('error', e => resolve({ ok: false, err: e.message }));
      setTimeout(() => { if (cp && !cp.killed) { k = true; cp.kill('SIGTERM'); } }, to);
    });
  }

  async fmt(code, lang) {
    const c = this.cfg[lang];
    if (!c || !c.fmt) return { ok: false, err: `No fmt for ${lang}` };
    try { return { ok: true, data: { orig: code.length, fmt: c.fmt(code).length, code: c.fmt(code) } }; }
    catch (e) { return { ok: false, err: e.message }; }
  }

  async lint(code, lang) {
    const issues = lang === 'js' || lang === 'ts' ? this.lintJs(code) : lang === 'py' ? this.lintPy(code) : [];
    return { ok: true, data: { lang, issues, count: issues.length, err: issues.filter(i => i.lvl === 'err').length, warn: issues.filter(i => i.lvl === 'warn').length } };
  }

  lintJs(c) {
    const iss = [], ls = c.split('\n');
    ls.forEach((l, i) => {
      const n = i + 1;
      if (l.includes('console.log')) iss.push({ line: n, lvl: 'warn', msg: 'Remove console.log', rule: 'no-console' });
      if (l.includes('var ')) iss.push({ line: n, lvl: 'warn', msg: 'Use let/const', rule: 'no-var' });
      if (l.includes('==') && !l.includes('===')) iss.push({ line: n, lvl: 'err', msg: 'Use ===', rule: 'eqeqeq' });
    });
    return iss;
  }

  lintPy(c) {
    const iss = [], ls = c.split('\n');
    ls.forEach((l, i) => {
      const n = i + 1;
      if (l.match(/^print\s+[^(]/)) iss.push({ line: n, lvl: 'err', msg: 'Python 2 print', rule: 'print-syntax' });
      if (l.length > 120) iss.push({ line: n, lvl: 'warn', msg: 'Line > 120', rule: 'max-len' });
    });
    return iss;
  }

  async install(pkgs, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    const pm = opt.pm || 'npm';
    const cmds = {
      npm: { c: 'npm', a: ['install', ...pkgs] },
      yarn: { c: 'yarn', a: ['add', ...pkgs] },
      pnpm: { c: 'pnpm', a: ['add', ...pkgs] },
      pip: { c: 'pip', a: ['install', ...pkgs] },
      pip3: { c: 'pip3', a: ['install', ...pkgs] }
    };
    const cmd = cmds[pm];
    if (!cmd) return { ok: false, err: `Bad pm: ${pm}`, id };
    const r = await this.spawn(cmd.c, cmd.a, opt.timeout || 300000);
    return { ...r, time: Date.now() - start, id };
  }

  fmtPy(c) {
    const ls = c.split('\n');
    let lvl = 0, sz = 4, res = [];
    for (const l of ls) {
      let ln = l.trim();
      if (ln.match(/^(return|break|continue|pass|raise)/)) lvl = Math.max(0, lvl - 1);
      res.push(' '.repeat(lvl * sz) + ln);
      if (ln.endsWith(':')) lvl++;
    }
    return res.join('\n').replace(/\s*([=+\-*/%<>!&|^])\s*/g, ' $1 ').replace(/\s*,\s*/g, ', ');
  }

  fmtJs(c) {
    const ls = c.split('\n');
    let lvl = 0, res = [];
    for (const l of ls) {
      let ln = l.trim();
      if (ln.startsWith('}')) lvl = Math.max(0, lvl - 1);
      res.push('  '.repeat(lvl) + ln);
      if (ln.endsWith('{')) lvl++;
    }
    return res.join('\n').replace(/\}\s*else/g, '} else').replace(/\{\s*\}\s*/g, '{} ');
  }

  fmtTs(c) { return this.fmtJs(c); }

  fmtHtml(c) {
    let r = c.replace(/></g, '>\n<');
    const ls = r.split('\n'), res = [], sz = 2;
    let lvl = 0;
    for (const l of ls) {
      let ln = l.trim();
      if (ln.startsWith('</')) lvl = Math.max(0, lvl - 1);
      res.push(' '.repeat(lvl * sz) + ln);
      if (!ln.startsWith('</') && ln.endsWith('>') && !ln.startsWith('<')) lvl++;
    }
    return res.join('\n');
  }

  fmtCss(c) {
    return c.replace(/\{/g, ' {\n  ').replace(/\}/g, '\n}\n').replace(/;\s*/g, ';\n  ').replace(/^\s{2}/gm, '').trim();
  }

  fmtJson(c) {
    try { return JSON.stringify(JSON.parse(c), null, 2); } catch { return c; }
  }

  fmtMd(c) {
    return c.replace(/^(#+)(.+)$/gm, '$1 $2').replace(/^(\s*)([-*])(\s+)/gm, '$1$2$3');
  }
}

module.exports = CodeRun;
