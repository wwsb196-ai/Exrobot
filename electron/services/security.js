const crypto = require('crypto');

class SecMgr {
  constructor() {
    this.wl = new Set(['ls', 'dir', 'pwd', 'cat', 'type', 'echo', 'head', 'tail', 'less', 'more', 'mkdir', 'rmdir', 'touch', 'cp', 'copy', 'mv', 'move', 'rm', 'del', 'erase', 'find', 'locate', 'which', 'where', 'git', 'hg', 'svn', 'npm', 'npx', 'yarn', 'pnpm', 'pip', 'pip3', 'pipenv', 'conda', 'node', 'deno', 'vi', 'vim', 'nano', 'whoami', 'hostname', 'date', 'time', 'uptime', 'df', 'du', 'free', 'top', 'ps', 'kill', 'jobs', 'bg', 'fg', 'exit', 'ping', 'traceroute', 'tracepath', 'nslookup', 'dig', 'host', 'curl', 'wget', 'lynx', 'links', 'tar', 'zip', 'unzip', 'gzip', 'gunzip', 'bzip2', 'make', 'cmake', 'gradle', 'maven', 'ant', 'python', 'python3', 'docker', 'docker-compose', 'clear', 'cls', 'history', 'man', 'help']);
    this.danger = [/\brm\s+-rf\b/i, /\bdel\s+\/s\b/i, /\bformat\b/i, /\bmkfs\b/i, /\bdd\b.*(?:if=|of=)/i, /\bchmod\s+777\b/i, /\bchown\b.*\broot\b/i, /\|\s*sh\b/i, /\|\s*bash\b/i, /\`.*\`/, /\$\(.*\)/, /\;.*(?:rm|del|format)/i, /\&\&.*(?:rm|del|format)/i, /\|\|.*(?:rm|del|format)/i, />>\s*\/(?:etc|usr)/i, />\s*\/(?:etc|usr)/i, /\bwget\b.*\|\s*sh/i, /\bcurl\b.*\|\s*sh/i, /eval\s*\(/i, /exec\s*\(/i];
    this.sens = ['/etc/passwd', '/etc/shadow', '/etc/sudoers', '/root/', '/home/*/.ssh/', '/var/log/', 'C:\\Windows\\', 'C:\\Program Files\\', '%APPDATA%', '%LOCALAPPDATA%'];
  }

  checkCmd(cmd) {
    const n = cmd.trim().toLowerCase();
    const base = n.split(/\s+/)[0];
    for (const p of this.danger) {
      if (p.test(cmd)) return { allow: false, lvl: 'CRIT', reason: `Danger: ${p}`, needConfirm: true, mit: ['Avoid destructive cmds', 'Use safer ways', 'Verify before run'] };
    }
    const isWl = Array.from(this.wl).some(w => n.startsWith(w.toLowerCase()));
    if (isWl) return { allow: true, lvl: 'LOW', reason: 'Whitelisted' };
    return { allow: false, lvl: 'MED', reason: `Unknown: ${base}`, needConfirm: true, mit: ['Verify cmd', 'Use alternative'] };
  }

  checkOp(op, target) {
    const t = (target || '').toLowerCase();
    for (const s of this.sens) {
      if (t.includes(s.toLowerCase().replace(/\*/g, ''))) {
        return { allow: false, lvl: 'HIGH', reason: `Sensitive: ${s}`, needConfirm: true, mit: ['Avoid sys dirs', 'Use user space', 'Confirm access'] };
      }
    }
    const risks = { delete_file: { lvl: 'HIGH', r: 'Irreversible' }, delete_dir: { lvl: 'HIGH', r: 'May lose data' }, write_file: { lvl: 'MED', r: 'Overwrite risk' }, move_file: { lvl: 'MED', r: 'Location change' }, copy_file: { lvl: 'LOW', r: 'Safe' }, read_file: { lvl: 'LOW', r: 'Safe' }, create_directory: { lvl: 'LOW', r: 'Safe' }, run_command: { lvl: 'MED', r: 'Sys access' }, execute_code: { lvl: 'HIGH', r: 'Full access' } };
    const r = risks[op] || { lvl: 'UNK', r: 'Unknown' };
    return { allow: r.lvl !== 'HIGH' || this.isSafePath(target), lvl: r.lvl, reason: r.r, needConfirm: r.lvl !== 'LOW', mit: this.getMit(op) };
  }

  isSafePath(p) {
    if (!p) return true;
    const t = p.toLowerCase();
    const safe = [process.cwd(), require('os').homedir(), require('os').homedir() + '/Desktop', require('os').homedir() + '/Documents', require('os').homedir() + '/Downloads', '/tmp', '/var/tmp'];
    for (const s of safe) {
      if (t.startsWith(s.toLowerCase()) || t.includes(s.toLowerCase())) return true;
    }
    return false;
  }

  getMit(op) {
    const m = { delete_file: ['Backup first', 'Use trash', 'Verify before del'], delete_dir: ['Check contents', 'Use trash', 'Confirm'], write_file: ['Backup', 'Verify path', 'Use append'], run_command: ['Review cmd', 'Trust source', 'Test first'], execute_code: ['Review code', 'Trust source', 'Use sandbox'] };
    return m[op] || ['Verify operation'];
  }

  getWl() { return Array.from(this.wl).sort(); }
  addWl(cmd) { this.wl.add(cmd); return { ok: true }; }
  delWl(cmd) { return this.wl.has(cmd) ? (this.wl.delete(cmd), { ok: true }) : { ok: false, err: 'Not in wl' }; }

  reqConfirm(op, det) {
    return { id: crypto.randomUUID(), op, det, time: new Date().toISOString(), need: true, msg: `Op "${op}" needs confirm`, warn: this.getWarn(op) };
  }

  getWarn(op) {
    const w = { delete_file: '⚠️ Permanent delete. Cannot undo.', delete_dir: '⚠️ Directory and contents deleted.', run_command: '⚠️ Running on your system.', execute_code: '⚠️ Full sys access. Only run trusted code.', write_file: '⚠️ Overwrite existing file.' };
    return w[op] || '⚠️ Please confirm.';
  }

  report() {
    return { time: new Date().toISOString(), wlSize: this.wl.size, dangerPat: this.danger.length, sensPath: this.sens.length, recs: ['Review cmds before run', 'Use wl for safe cmds', 'Avoid untrusted sources', 'Backup before destructive ops', 'Test in safe env'] };
  }
}

module.exports = SecMgr;
