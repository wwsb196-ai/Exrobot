const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ops', {
  fs: {
    read: (p, o) => ipcRenderer.invoke('fs:read', { path: p, opt: o }),
    write: (p, c, o) => ipcRenderer.invoke('fs:write', { path: p, content: c, opt: o }),
    append: (p, c) => ipcRenderer.invoke('fs:append', { path: p, content: c }),
    replace: (p, from, to, all) => ipcRenderer.invoke('fs:replace', { path: p, from, to, all }),
    mkdir: (p) => ipcRenderer.invoke('fs:mkdir', { path: p }),
    ls: (p, o) => ipcRenderer.invoke('fs:ls', { path: p, opt: o }),
    tree: (p, d) => ipcRenderer.invoke('fs:tree', { path: p, depth: d }),
    del: (p) => ipcRenderer.invoke('fs:del', { path: p }),
    move: (s, t) => ipcRenderer.invoke('fs:move', { src: s, tgt: t }),
    copy: (s, t) => ipcRenderer.invoke('fs:copy', { src: s, tgt: t }),
    find: (p, k, t) => ipcRenderer.invoke('fs:find', { path: p, keyword: k, type: t }),
    watch: (p, cb) => {
      const ch = `fs:watch:${p}`;
      ipcRenderer.on(ch, (e, ev) => cb(ev));
      ipcRenderer.send('fs:watch', { path: p });
      return () => ipcRenderer.off(ch);
    }
  },

  cmd: {
    run: (c, o) => ipcRenderer.invoke('cmd:run', { cmd: c, opt: o }),
    check: (c) => ipcRenderer.invoke('cmd:check', { cmd: c }),
    list: () => ipcRenderer.invoke('cmd:list'),
    addWl: (c) => ipcRenderer.invoke('cmd:addWl', { cmd: c }),
    delWl: (c) => ipcRenderer.invoke('cmd:delWl', { cmd: c }),
    ps: () => ipcRenderer.invoke('cmd:ps'),
    kill: (i) => ipcRenderer.invoke('cmd:kill', { pid: i })
  },

  code: {
    run: (c, l, o) => ipcRenderer.invoke('code:run', { code: c, lang: l, opt: o }),
    fmt: (c, l) => ipcRenderer.invoke('code:fmt', { code: c, lang: l }),
    lint: (c, l) => ipcRenderer.invoke('code:lint', { code: c, lang: l }),
    install: (pkgs, opt) => ipcRenderer.invoke('code:install', { pkgs, opt })
  },

  search: {
    web: (q, n) => ipcRenderer.invoke('search:web', { query: q, num: n }),
    grep: (p, k, o) => ipcRenderer.invoke('search:grep', { path: p, keyword: k, opt: o }),
    file: (p, k) => ipcRenderer.invoke('search:file', { path: p, keyword: k })
  },

  plan: {
    parse: (s, c) => ipcRenderer.invoke('plan:parse', { spec: s, ctx: c }),
    run: (i, cb) => ipcRenderer.invoke('plan:run', { id: i }),
    get: (i) => ipcRenderer.invoke('plan:get', { id: i }),
    list: () => ipcRenderer.invoke('plan:list'),
    del: (i) => ipcRenderer.invoke('plan:del', { id: i })
  },

  audit: {
    log: (o) => ipcRenderer.invoke('audit:log', { op: o }),
    list: (q) => ipcRenderer.invoke('audit:list', { query: q }),
    get: (i) => ipcRenderer.invoke('audit:get', { id: i }),
    export: (f) => ipcRenderer.invoke('audit:export', { format: f })
  },

  cp: {
    create: (d, n) => ipcRenderer.invoke('cp:create', { desc: d, name: n }),
    save: (i, s) => ipcRenderer.invoke('cp:save', { id: i, state: s }),
    load: (i) => ipcRenderer.invoke('cp:load', { id: i }),
    list: () => ipcRenderer.invoke('cp:list'),
    del: (i) => ipcRenderer.invoke('cp:del', { id: i })
  },

  sec: {
    checkCmd: (c) => ipcRenderer.invoke('sec:checkCmd', { cmd: c }),
    addWl: (c) => ipcRenderer.invoke('sec:addWl', { cmd: c }),
    delWl: (c) => ipcRenderer.invoke('sec:delWl', { cmd: c }),
    listWl: () => ipcRenderer.invoke('sec:listWl'),
    addDanger: (p) => ipcRenderer.invoke('sec:addDanger', { pattern: p }),
    delDanger: (p) => ipcRenderer.invoke('sec:delDanger', { pattern: p }),
    listDanger: () => ipcRenderer.invoke('sec:listDanger')
  },

  state: {
    get: (k) => ipcRenderer.invoke('state:get', { key: k }),
    set: (k, v) => ipcRenderer.invoke('state:set', { key: k, val: v }),
    del: (k) => ipcRenderer.invoke('state:del', { key: k }),
    keys: () => ipcRenderer.invoke('state:keys'),
    clear: () => ipcRenderer.invoke('state:clear')
  },

  win: {
    close: () => ipcRenderer.send('win:close'),
    min: () => ipcRenderer.send('win:min'),
    max: () => ipcRenderer.send('win:max'),
    getState: () => ipcRenderer.invoke('win:getState')
  }
});
