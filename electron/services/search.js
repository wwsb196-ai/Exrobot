const f = require('fs');
const p = require('path');
const crypto = require('crypto');

class Searcher {
  async web(query, num = 10) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const r = await this.bing(query, num);
      return { ok: true, data: { query, results: r, total: r.length }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async bing(q, n) {
    return [
      { title: `${q} - Result 1`, url: `https://ex1.com/?q=${encodeURIComponent(q)}`, snippet: `Info about ${q}` },
      { title: `${q} - Result 2`, url: `https://ex2.com/?q=${encodeURIComponent(q)}`, snippet: `More on ${q}` }
    ].slice(0, n);
  }

  async grep(path, keyword, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const sp = p.resolve(path || process.cwd());
      if (!f.existsSync(sp)) return { ok: false, err: `Bad path: ${sp}`, id };

      const re = new RegExp(keyword, opt.ignoreCase !== false ? 'i' : '');
      const res = [];

      const walk = (cur, d = 0) => {
        if (opt.maxResults && res.length >= opt.maxResults) return;
        if (!opt.recursive && d > 0) return;
        try {
          const list = f.readdirSync(cur);
          for (const it of list) {
            if (opt.maxResults && res.length >= opt.maxResults) break;
            const ip = p.join(cur, it);
            try {
              const st = f.statSync(ip);
              if (st.isFile()) {
                try {
                  const c = f.readFileSync(ip, 'utf-8');
                  const lines = c.split('\n');
                  for (let i = 0; i < lines.length; i++) {
                    if (re.test(lines[i])) {
                      res.push({ file: ip, line: i + 1, content: lines[i].trim() });
                      if (opt.maxResults && res.length >= opt.maxResults) break;
                    }
                  }
                } catch {}
              }
              if (st.isDirectory() && !it.startsWith('.') && (opt.recursive || d === 0)) {
                walk(ip, d + 1);
              }
            } catch {}
          }
        } catch {}
      };
      walk(sp);
      return { ok: true, data: { keyword, path: sp, matches: res, total: res.length }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async file(path, keyword) {
    const id = crypto.randomUUID();
    const start = Date.now();
    try {
      const sp = p.resolve(path || process.cwd());
      if (!f.existsSync(sp)) return { ok: false, err: `Bad path: ${sp}`, id };

      const re = new RegExp(keyword, 'i');
      const res = [];

      const walk = (cur, d = 0) => {
        if (!f.existsSync(cur)) return;
        try {
          const list = f.readdirSync(cur);
          for (const it of list) {
            const ip = p.join(cur, it);
            try {
              const st = f.statSync(ip);
              if (re.test(it)) {
                res.push({ name: it, path: ip, type: st.isDirectory() ? 'dir' : 'file', size: st.size });
              }
              if (st.isDirectory()) walk(ip, d + 1);
            } catch {}
          }
        } catch {}
      };
      walk(sp);
      return { ok: true, data: { keyword, path: sp, results: res, total: res.length }, time: Date.now() - start, id };
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }
}

module.exports = Searcher;
