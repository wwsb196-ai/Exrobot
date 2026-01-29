const { exec, execSync, spawn } = require('child_process');
const os = require('os');
const crypto = require('crypto');
const fs = require('fs');

class CmdRunner {
  constructor() {
    this.procs = new Map();
    this.hist = [];
    this.wl = new Set([
      'git', 'npm', 'npx', 'node', 'yarn', 'pnpm', 'pip', 'pip3',
      'ls', 'dir', 'cd', 'pwd', 'cat', 'type', 'echo', 'mkdir', 'rm', 'del',
      'cp', 'copy', 'mv', 'move', 'find', 'grep', 'head', 'tail', 'less',
      'whoami', 'hostname', 'date', 'time', 'ver', 'cls', 'clear', 'exit',
      'python', 'python3', 'cargo', 'rustc', 'make', 'cmake',
      'tar', 'zip', 'unzip', 'curl', 'wget', 'ssh', 'scp'
    ]);
  }

  check(cmd) {
    const n = cmd.trim().toLowerCase();
    const base = n.split(/\s+/)[0];
    for (const w of this.wl) {
      if (n.startsWith(w.toLowerCase())) return { allow: true };
    }
    return { allow: false, reason: `Not in whitelist: ${base}`, needConfirm: true };
  }

  sanitize(cmd) {
    let s = cmd.replace(/[;&|`$(){}[\]\\]/g, m => '\\' + m);
    s = s.replace(/\.\.\//g, './');
    s = s.replace(/;\s*(?:sh|bash|cmd|powershell)/gi, '');
    return s;
  }

  async run(cmd, opt = {}) {
    const id = crypto.randomUUID();
    const start = Date.now();
    
    try {
      const sc = this.sanitize(cmd);
      const chk = this.check(sc);
      if (!chk.allow) {
        return { ok: false, err: `Security: ${chk.reason}`, id, needConfirm: chk.needConfirm };
      }

      const { timeout = 300000, cwd = process.cwd(), env = {}, capture = true } = opt;

      if (!fs.existsSync(cwd)) {
        return { ok: false, err: `Bad cwd: ${cwd}`, id };
      }

      return new Promise(resolve => {
        const pid = crypto.randomUUID();
        let out = '', err = '', killed = false;

        const opts = { cwd, env: { ...process.env, ...env }, timeout, maxBuffer: 10 * 1024 * 1024 };

        let child;
        if (process.platform === 'win32') {
          child = spawn('cmd.exe', ['/c', sc], { ...opts, windowsVerbatim: true, detached: false });
        } else {
          child = spawn('/bin/bash', ['-c', sc], { ...opts, detached: false });
        }

        this.procs.set(pid, { pid: child.pid, cmd: sc, cwd, start: new Date() });

        child.stdout?.on('data', d => { out += d.toString(); });
        child.stderr?.on('data', d => { err += d.toString(); });

        child.on('close', code => {
          if (killed) return;
          this.procs.delete(pid);
          this.hist.push({ id, pid, cmd: sc, cwd, code, outLen: out.length, errLen: err.length, time: Date.now() - start });
          resolve({ ok: code === 0, data: { cmd: sc, code, out, err, pid: child.pid }, time: Date.now() - start, id });
        });

        child.on('error', e => {
          this.procs.delete(pid);
          resolve({ ok: false, err: e.message, id });
        });

        if (timeout) {
          setTimeout(() => {
            if (child && !child.killed) {
              killed = true;
              child.kill('SIGTERM');
              setTimeout(() => { if (child && !child.killed) child.kill('SIGKILL'); }, 5000);
            }
          }, timeout);
        }
      });
    } catch (e) {
      return { ok: false, err: e.message, id };
    }
  }

  async env(vars = null) {
    try {
      const env = process.env;
      const res = {};
      if (vars) {
        for (const k of vars) res[k] = env[k] || null;
      } else {
        const bad = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'CREDENTIAL'];
        for (const [k, v] of Object.entries(env)) {
          if (!bad.some(p => k.toUpperCase().includes(p))) res[k] = v;
        }
      }
      return { ok: true, data: res, count: Object.keys(res).length };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }

  async sysInfo() {
    try {
      const cpus = os.cpus();
      return {
        ok: true,
        data: {
          platform: process.platform,
          arch: process.arch,
          cpu: { cores: cpus.length, model: cpus[0]?.model },
          memory: { total: os.totalmem(), free: os.freemem() },
          home: os.homedir(),
          node: process.version,
          uptime: os.uptime(),
          pid: process.pid,
          cwd: process.cwd()
        }
      };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }

  async ps(opt = {}) {
    try {
      const list = [];
      if (process.platform === 'win32') {
        const r = await this.run('tasklist /fo csv /nh', { timeout: 10000 });
        if (r.ok) {
          const lines = r.data.out.trim().split('\n');
          for (const l of lines) {
            const p = l.split('","').map(x => x.replace(/^"|"$/g, ''));
            if (p.length >= 5) {
              list.push({ name: p[0], pid: parseInt(p[1]), mem: p[4] });
            }
          }
        }
      } else {
        const r = await this.run('ps aux', { timeout: 10000 });
        if (r.ok) {
          const lines = r.data.out.trim().split('\n').slice(1);
          for (const l of lines) {
            const p = l.trim().split(/\s+/);
            if (p.length >= 11) {
              list.push({ user: p[0], pid: parseInt(p[1]), cpu: parseFloat(p[2]), mem: parseFloat(p[3]), cmd: p.slice(10).join(' ') });
            }
          }
        }
      }

      let f = list;
      if (opt.name) {
        f = f.filter(p => p.name?.toLowerCase().includes(opt.name.toLowerCase()) || p.cmd?.toLowerCase().includes(opt.name.toLowerCase()));
      }
      if (opt.pid) f = f.filter(p => p.pid === opt.pid);

      return { ok: true, data: { list: f.slice(0, opt.limit || 100), total: f.length } };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }

  async kill(pid, sig = 'SIGTERM') {
    try {
      const pl = await this.ps({ pid });
      if (!pl.ok || pl.data.list.length === 0) {
        return { ok: false, err: `Proc ${pid} not found` };
      }

      try {
        process.kill(pid, sig);
        return { ok: true, data: { pid, sig, killed: true } };
      } catch (e) {
        if (e.code === 'ESRCH') return { ok: false, err: `Proc ${pid} gone` };
        throw e;
      }
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }

  async hist(opt = {}) {
    let h = [...this.hist];
    if (opt.limit) h = h.slice(-opt.limit);
    if (opt.reverse) h.reverse();
    return { ok: true, data: { cmds: h, total: h.length } };
  }

  async clearHist() {
    this.hist = [];
    return { ok: true };
  }

  async running() {
    const list = [];
    for (const [id, info] of this.procs) {
      list.push({ id, ...info, now: new Date() });
    }
    return { ok: true, data: { list, count: list.length } };
  }
}

module.exports = CmdRunner;
