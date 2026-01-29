const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class FileOps extends EventEmitter {
  constructor() {
    super();
    this.watchers = new Map();
    this.hashes = new Map();
    this.allowed = new Set();
    this.maxSize = 100 * 1024 * 1024;
    this.setupAllowed();
  }

  setupAllowed() {
    const home = require('os').homedir();
    this.addAllowed(process.cwd());
    this.addAllowed(home);
    this.addAllowed(home + '/Desktop');
    this.addAllowed(home + '/Documents');
    this.addAllowed(home + '/Downloads');
  }

  addAllowed(p) {
    try { this.allowed.add(path.resolve(p)); } catch (e) {}
  }

  checkPath(p) {
    const abs = path.resolve(p);
    for (const a of this.allowed) {
      if (abs.startsWith(a) || abs.replace(a, '').startsWith('..') === false) return true;
    }
    return false;
  }

  async read(filePath, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(filePath);
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };
      if (!fs.existsSync(abs)) return { ok: false, err: 'File not found', id };

      const st = fs.statSync(abs);
      if (st.size > (opt.maxSize || this.maxSize)) return { ok: false, err: 'File too large', id };
      if (st.isDirectory()) return { ok: false, err: 'Is directory', id };

      const enc = opt.enc || 'utf-8';
      const content = fs.readFileSync(abs, enc);
      const h = crypto.createHash('sha256').update(content).digest('hex');
      this.hashes.set(abs, h);

      return { ok: true, data: { content, path: abs, name: path.basename(abs), size: st.size, enc, hash: h }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async write(filePath, content, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(filePath);
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };

      const parent = path.dirname(abs);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });

      let backup = null;
      if (fs.existsSync(abs) && opt.backup !== false) {
        backup = abs + '.bak.' + Date.now();
        fs.copyFileSync(abs, backup);
      }

      const tmp = abs + '.tmp.' + crypto.randomUUID();
      fs.writeFileSync(tmp, content, { enc: opt.enc || 'utf-8' });

      const tmpC = fs.readFileSync(tmp, 'utf-8');
      if (tmpC !== content) { fs.unlinkSync(tmp); return { ok: false, err: 'Write verify failed', id }; }

      fs.renameSync(tmp, abs);
      const h = crypto.createHash('sha256').update(content).digest('hex');
      this.hashes.set(abs, h);

      return { ok: true, data: { path: abs, name: path.basename(abs), backup, hash: h }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async append(filePath, content, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(filePath);
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };
      if (!fs.existsSync(abs)) return { ok: false, err: 'File not found', id };
      fs.appendFileSync(abs, content, { enc: opt.enc || 'utf-8' });
      return { ok: true, data: { bytes: Buffer.byteLength(content) }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async replace(filePath, from, to, all = false) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(filePath);
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };
      if (!fs.existsSync(abs)) return { ok: false, err: 'File not found', id };

      const content = fs.readFileSync(abs, 'utf-8');
      if (!content.includes(from)) return { ok: false, err: 'String not found', id };

      const backup = abs + '.bak.' + Date.now();
      fs.copyFileSync(abs, backup);

      const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), all ? 'g' : '');
      const newC = content.replace(re, to);
      fs.writeFileSync(abs, newC, 'utf-8');

      const cnt = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      return { ok: true, data: { replacements: all ? 'all' : 1, backup }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async mkdir(dirPath, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(dirPath);
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };
      if (fs.existsSync(abs)) return { ok: false, err: 'Already exists', id };
      fs.mkdirSync(abs, { recursive: true });
      return { ok: true, data: { path: abs, created: true }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async ls(dirPath, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(dirPath || '.');
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };
      if (!fs.existsSync(abs)) return { ok: false, err: 'Not found', id };
      if (!fs.statSync(abs).isDirectory()) return { ok: false, err: 'Not directory', id };

      const items = [];
      const walk = (cur, d = 0) => {
        if (opt.maxDepth && d > opt.maxDepth) return;
        try {
          const list = fs.readdirSync(cur);
          for (const item of list) {
            const ip = path.join(cur, item);
            const st = fs.statSync(ip);
            const entry = { name: item, path: ip, type: st.isDirectory() ? 'dir' : 'file', size: st.size, ext: st.isFile() ? path.extname(item) : null };
            if (opt.hash && st.isFile()) {
              try { entry.hash = crypto.createHash('sha256').update(fs.readFileSync(ip, 'utf-8')).digest('hex'); } catch {}
            }
            items.push(entry);
            if (st.isDirectory() && (opt.recursive || d === 0)) walk(ip, d + 1);
          }
        } catch {}
      };
      walk(abs);

      return { ok: true, data: { path: abs, items, total: items.length, dirs: items.filter(i => i.type === 'dir').length, files: items.filter(i => i.type === 'file').length }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async tree(dirPath, depth = 10) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(dirPath || '.');
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };

      const build = (cur, d = 0) => {
        if (d > depth || !fs.existsSync(cur) || !fs.statSync(cur).isDirectory()) return null;
        const list = fs.readdirSync(cur);
        const kids = [];
        for (const item of list) {
          const ip = path.join(cur, item);
          const st = fs.statSync(ip);
          if (st.isDirectory()) {
            const child = build(ip, d + 1);
            if (child) kids.push(child);
          } else {
            kids.push({ name: item, path: ip, type: 'file', size: st.size, ext: path.extname(item) });
          }
        }
        kids.sort((a, b) => (a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name)));
        return { name: path.basename(cur), path: cur, type: 'dir', kids, files: kids.filter(k => k.type === 'file').length, dirs: kids.filter(k => k.type === 'dir').length };
      };

      const t = build(abs);
      return { ok: true, data: { path: abs, tree: t }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async del(filePath) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const abs = path.resolve(filePath);
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied', id };
      if (!fs.existsSync(abs)) return { ok: false, err: 'Not found', id };

      const st = fs.statSync(abs);
      if (st.isDirectory()) fs.rmdirSync(abs);
      else fs.unlinkSync(abs);

      return { ok: true, data: { path: abs, type: st.isDirectory() ? 'dir' : 'file', size: st.size }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async move(src, dst) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const s = path.resolve(src);
      const d = path.resolve(dst);
      if (!this.checkPath(s) || !this.checkPath(d)) return { ok: false, err: 'Access denied', id };
      if (!fs.existsSync(s)) return { ok: false, err: 'Source not found', id };

      const pd = path.dirname(d);
      if (!fs.existsSync(pd)) fs.mkdirSync(pd, { recursive: true });
      fs.renameSync(s, d);

      const st = fs.statSync(d);
      return { ok: true, data: { src: s, dst: d, type: st.isDirectory() ? 'dir' : 'file' }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async copy(src, dst) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const s = path.resolve(src);
      const d = path.resolve(dst);
      if (!this.checkPath(s) || !this.checkPath(d)) return { ok: false, err: 'Access denied', id };
      if (!fs.existsSync(s)) return { ok: false, err: 'Source not found', id };

      const cp = (sPath, dPath) => {
        const st = fs.statSync(sPath);
        if (st.isDirectory()) {
          fs.mkdirSync(dPath, { recursive: true });
          for (const i of fs.readdirSync(sPath)) cp(path.join(sPath, i), path.join(dPath, i));
        } else fs.copyFileSync(sPath, dPath);
      };
      cp(s, d);
      return { ok: true, data: { src: s, dst: d }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async find(path, keyword, type) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const sp = path.resolve(path || '.');
      if (!this.checkPath(sp)) return { ok: false, err: 'Access denied', id };

      const re = new RegExp(keyword, 'i');
      const res = [];

      const walk = (cur, d = 0) => {
        if (!fs.existsSync(cur)) return;
        try {
          const list = fs.readdirSync(cur);
          for (const item of list) {
            const ip = path.join(cur, item);
            const st = fs.statSync(ip);
            if (re.test(item) && (!type || (type === 'dir' && st.isDirectory()) || (type === 'file' && st.isFile()))) {
              res.push({ name: item, path: ip, type: st.isDirectory() ? 'dir' : 'file', size: st.size });
            }
            if (st.isDirectory()) walk(ip, d + 1);
          }
        } catch {}
      };
      walk(sp);
      return { ok: true, data: { keyword, path: sp, results: res, total: res.length }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async info(filePath) {
    try {
      const abs = path.resolve(filePath);
      if (!this.checkPath(abs)) return { ok: false, err: 'Access denied' };
      if (!fs.existsSync(abs)) return { ok: false, err: 'Not found' };

      const st = fs.statSync(abs);
      const c = st.isFile() ? fs.readFileSync(abs) : null;
      return { ok: true, data: { path: abs, name: path.basename(abs), type: st.isDirectory() ? 'dir' : 'file', size: st.size, hash: c ? crypto.createHash('sha256').update(c).digest('hex') : null } };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }

  async stat(filePath) {
    try {
      const st = fs.statSync(path.resolve(filePath));
      return { ok: true, data: { isFile: st.isFile(), isDir: st.isDirectory(), size: st.size, mtime: st.mtime } };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }
}

module.exports = FileOps;
