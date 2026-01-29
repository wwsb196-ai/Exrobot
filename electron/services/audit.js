const f = require('fs');
const p = require('path');
const crypto = require('crypto');

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000;
    this.logDir = p.join(process.cwd(), '.logs');
    this.curFile = null;
    if (!f.existsSync(this.logDir)) f.mkdirSync(this.logDir, { recursive: true });
    this.rotate();
  }

  rotate() {
    const d = new Date().toISOString().split('T')[0];
    this.curFile = p.join(this.logDir, `log-${d}.log`);
  }

  add(action, det = {}, meta = {}) {
    const entry = {
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      action,
      det: typeof det === 'string' ? { msg: det } : det,
      meta: { user: meta.user || 'sys', sid: meta.sid || 'def', pid: process.pid, plat: process.platform, node: process.version, ...meta },
      lvl: this.getLvl(action),
      hash: null
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs = this.logs.slice(-this.maxLogs);
    this.write(entry);
    return entry;
  }

  getLvl(act) {
    const hi = ['DELETE', 'RUN_SHELL', 'EXECUTE_CODE', 'PLAN_CREATE'];
    const wa = ['MODIFY', 'MOVE', 'COPY', 'PLAN_EXECUTE'];
    if (hi.some(h => act.includes(h))) return 'err';
    if (wa.some(w => act.includes(w))) return 'warn';
    return 'info';
  }

  write(entry) {
    try {
      const line = JSON.stringify(entry) + '\n';
      f.appendFileSync(this.curFile, line);
      const d = new Date().toISOString().split('T')[0];
      if (!this.curFile.includes(d)) this.rotate();
    } catch (e) {}
  }

  get(opt = {}) {
    let r = [...this.logs];
    if (opt.action) r = r.filter(l => l.action.toLowerCase().includes(opt.action.toLowerCase()));
    if (opt.lvl) r = r.filter(l => l.lvl === opt.lvl);
    if (opt.start) r = r.filter(l => new Date(l.time) >= new Date(opt.start));
    if (opt.end) r = r.filter(l => new Date(l.time) <= new Date(opt.end));
    if (opt.search) {
      const s = opt.search.toLowerCase();
      r = r.filter(l => JSON.stringify(l).toLowerCase().includes(s));
    }
    const so = opt.order === 'asc' ? 1 : -1;
    r.sort((a, b) => (new Date(a.time) - new Date(b.time)) * so);
    const pg = opt.page || 1, ps = opt.pageSize || 50;
    return { ok: true, data: { logs: r.slice((pg - 1) * ps, pg * ps), pg, ps, total: r.length, levels: { err: r.filter(l => l.lvl === 'err').length, warn: r.filter(l => l.lvl === 'warn').length, info: r.filter(l => l.lvl === 'info').length } } };
  }

  async export(fmt = 'json') {
    if (fmt === 'json') return { ok: true, data: this.logs, type: 'app/json', name: `log-${new Date().toISOString().split('T')[0]}.json` };
    if (fmt === 'csv') {
      const h = 'time,action,level,detail\n';
      const rows = this.logs.map(l => `${l.time},${l.action},${l.lvl},"${JSON.stringify(l.det).replace(/"/g, '""')}"`).join('\n');
      return { ok: true, data: h + rows, type: 'text/csv', name: `log-${new Date().toISOString().split('T')[0]}.csv` };
    }
    return { ok: false, err: `Bad fmt: ${fmt}` };
  }

  stats() {
    const n = Date.now(), d24 = this.logs.filter(l => n - new Date(l.time).getTime() < 24 * 60 * 60 * 1000).length;
    const c = {};
    for (const l of this.logs) c[l.action] = (c[l.action] || 0) + 1;
    return { ok: true, data: { total: this.logs.length, d24, top: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([a, b]) => ({ action: a, count: b })) } };
  }

  clear() { this.logs = []; return { ok: true }; }
}

module.exports = Logger;
