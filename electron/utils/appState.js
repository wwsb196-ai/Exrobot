const path = require('path');
const fs = require('fs');

class AppState {
  constructor(name = 'app') {
    this.name = name;
    this.data = {};
    this.listeners = new Map();
    this.dir = path.join(process.cwd(), '.state');
    this.init();
  }

  init() {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    this.load();
  }

  load() {
    const fp = path.join(this.dir, `${this.name}.json`);
    if (fs.existsSync(fp)) {
      try {
        this.data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      } catch (e) {
        this.data = {};
      }
    }
  }

  save() {
    const fp = path.join(this.dir, `${this.name}.json`);
    fs.writeFileSync(fp, JSON.stringify(this.data, null, 2));
  }

  get(k) { return this.data[k]; }
  set(k, v) {
    const old = this.data[k];
    this.data[k] = v;
    this.save();
    this.emit(k, v, old);
    return v;
  }

  del(k) {
    delete this.data[k];
    this.save();
    this.emit(k, undefined, this.data[k]);
  }

  on(k, fn) {
    if (!this.listeners.has(k)) this.listeners.set(k, []);
    this.listeners.get(k).push(fn);
    return () => this.off(k, fn);
  }

  off(k, fn) {
    const arr = this.listeners.get(k);
    if (arr) {
      const i = arr.indexOf(fn);
      if (i > -1) arr.splice(i, 1);
    }
  }

  emit(k, v, old) {
    const arr = this.listeners.get(k) || [];
    arr.forEach(fn => fn(v, old));
    this.listeners.get('*')?.forEach(fn => fn(k, v, old));
  }

  keys() { return Object.keys(this.data); }
  all() { return { ...this.data }; }
  clear() {
    this.data = {};
    this.save();
  }
}

class WinState {
  constructor(id = 'main') {
    this.id = id;
    this.state = { width: 1200, height: 800, x: 0, y: 0, max: false };
    this.stateDir = path.join(process.cwd(), '.state');
    this.stateFile = path.join(this.stateDir, `win-${id}.json`);
    this.load();
  }

  load() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
    if (fs.existsSync(this.stateFile)) {
      try {
        this.state = { ...this.state, ...JSON.parse(fs.readFileSync(this.stateFile, 'utf8')) };
      } catch (e) {}
    }
  }

  save() {
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  get() { return this.state; }
  set(s) {
    this.state = { ...this.state, ...s };
    this.save();
  }
}

module.exports = { AppState, WinState };
