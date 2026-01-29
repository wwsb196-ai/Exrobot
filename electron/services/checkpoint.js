const f = require('fs');
const p = require('path');
const crypto = require('crypto');

class Checkpointer {
  constructor() {
    this.cps = new Map();
    this.dir = p.join(process.cwd(), '.checkpoints');
    this.max = 100;
    if (!f.existsSync(this.dir)) f.mkdirSync(this.dir, { recursive: true });
    this.load();
  }

  load() {
    try {
      const files = f.readdirSync(this.dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const c = JSON.parse(f.readFileSync(p.join(this.dir, file), 'utf-8'));
            this.cps.set(c.id, c);
          } catch {}
        }
      }
    } catch {}
  }

  async create(desc, name) {
    const id = `cp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const cp = { id, name, desc, status: 'ready', created: Date.now(), updated: Date.now(), data: {} };
    this.cps.set(id, cp);
    this.persist(cp);
    this.clean();
    return id;
  }

  async save(id, state) {
    const cp = this.cps.get(id);
    if (!cp) return { ok: false, err: 'Not found' };
    cp.data = state;
    cp.updated = Date.now();
    this.cps.set(id, cp);
    this.persist(cp);
    return { ok: true };
  }

  async load(id) {
    const cp = this.cps.get(id);
    if (cp) return { ok: true, data: cp.data };
    const fp = this.fp(id);
    if (f.existsSync(fp)) {
      try {
        const c = JSON.parse(f.readFileSync(fp, 'utf-8'));
        return { ok: true, data: c.data };
      } catch {}
    }
    return { ok: false, err: 'Not found' };
  }

  async list() {
    const r = Array.from(this.cps.values())
      .map(cp => ({ id: cp.id, name: cp.name, desc: cp.desc, status: cp.status, created: cp.created }))
      .sort((a, b) => b.created - a.created);
    return r;
  }

  async del(id) {
    if (this.cps.has(id)) {
      this.cps.delete(id);
      const fp = this.fp(id);
      if (f.existsSync(fp)) f.unlinkSync(fp);
      return true;
    }
    return false;
  }

  async get(id) {
    return this.cps.get(id) || null;
  }

  async update(id, upd) {
    const cp = this.cps.get(id);
    if (!cp) return { ok: false, err: 'Not found' };
    const ucp = { ...cp, ...upd, updated: Date.now() };
    this.cps.set(id, ucp);
    this.persist(ucp);
    return { ok: true, cp: ucp };
  }

  async clean() {
    if (this.cps.size <= this.max) return;
    const s = Array.from(this.cps.values()).sort((a, b) => a.updated - b.updated);
    for (const cp of s.slice(0, this.cps.size - this.max)) this.del(cp.id);
  }

  persist(cp) {
    try { f.writeFileSync(this.fp(cp.id), JSON.stringify(cp, null, 2), 'utf-8'); } catch {}
  }

  fp(id) { return p.join(this.dir, `${id}.json`); }
}

module.exports = Checkpointer;
