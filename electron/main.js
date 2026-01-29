const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');

class AppCore {
  constructor() {
    this.window = null;
    this.quitting = false;

    this.initServices();
    this.setupIPC();
  }

  initServices() {
    this.fs = require('./services/fileSystem');
    this.cmd = require('./services/systemCommand');
    this.code = require('./services/codeExecution');
    this.search = require('./services/search');
    this.logs = require('./services/audit');
    this.check = require('./services/checkpoint');
    this.plan = require('./services/planner');
    this.sec = require('./services/security');
    this.state = require('../utils/appState');
    this.winState = new this.state.WinState('main');
  }

  async start() {
    this.createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      } else {
        this.window?.show();
      }
    });
  }

  createWindow() {
    this.window = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      backgroundColor: '#0a0a0a',
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#1a1a1a',
        symbolColor: '#ffffff',
        height: 40
      },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload/index.js'),
        webSecurity: true
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      show: false,
      frame: false
    });

    const url = process.env.START_URL ||
      `file://${path.join(__dirname, '../dist/index.html')}`;

    this.window.loadURL(url);
    this.window.once('ready-to-show', () => {
      this.window.show();
      this.window.focus();
    });

    this.window.on('close', (e) => {
      if (!this.quitting) {
        e.preventDefault();
        this.window.hide();
      }
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    this.regShortcuts();
    const ws = this.winState.get();
    if (ws.x || ws.y) this.window.setPosition(ws.x, ws.y);
    if (ws.max) this.window.maximize();
  }

  regShortcuts() {
    globalShortcut.register('CommandOrControl+Shift+A', () => {
      if (this.window) {
        this.window.isVisible() ? this.window.hide() : this.window.show();
      }
    });

    globalShortcut.register('CommandOrControl+Shift+C', () => {
      if (this.window) {
        this.window.show();
        this.window.webContents.send('quick-chat');
      }
    });
  }

  setupIPC() {
    ipcMain.handle('fs:read', async (e, args) => this.fs.read(args.path, args.opt));
    ipcMain.handle('fs:write', async (e, args) => this.fs.write(args.path, args.content, args.opt));
    ipcMain.handle('fs:append', async (e, args) => this.fs.append(args.path, args.content));
    ipcMain.handle('fs:replace', async (e, args) => this.fs.replace(args.path, args.from, args.to, args.all));
    ipcMain.handle('fs:mkdir', async (e, args) => this.fs.mkdir(args.path));
    ipcMain.handle('fs:ls', async (e, args) => this.fs.ls(args.path, args.opt));
    ipcMain.handle('fs:tree', async (e, args) => this.fs.tree(args.path, args.depth));
    ipcMain.handle('fs:del', async (e, args) => this.fs.del(args.path));
    ipcMain.handle('fs:move', async (e, args) => this.fs.move(args.src, args.tgt));
    ipcMain.handle('fs:copy', async (e, args) => this.fs.copy(args.src, args.tgt));
    ipcMain.handle('fs:find', async (e, args) => this.fs.find(args.path, args.keyword, args.type));

    ipcMain.handle('cmd:run', async (e, args) => {
      const chk = this.sec.checkCmd(args.cmd);
      if (!chk.allow) return { ok: false, err: chk.reason, needConfirm: chk.needConfirm };
      return await this.cmd.run(args.cmd, args.opt);
    });
    ipcMain.handle('cmd:check', async (e, args) => this.sec.checkCmd(args.cmd));
    ipcMain.handle('cmd:list', async () => this.sec.listWl());
    ipcMain.handle('cmd:addWl', async (e, args) => this.sec.addWl(args.cmd));
    ipcMain.handle('cmd:delWl', async (e, args) => this.sec.delWl(args.cmd));
    ipcMain.handle('cmd:ps', async () => this.cmd.ps());
    ipcMain.handle('cmd:kill', async (e, args) => this.cmd.kill(args.pid));

    ipcMain.handle('code:run', async (e, args) => this.code.run(args.code, args.lang, args.opt));
    ipcMain.handle('code:fmt', async (e, args) => this.code.fmt(args.code, args.lang));
    ipcMain.handle('code:lint', async (e, args) => this.code.lint(args.code, args.lang));
    ipcMain.handle('code:install', async (e, args) => this.code.install(args.pkgs, args.opt));

    ipcMain.handle('search:web', async (e, args) => this.search.web(args.query, args.num));
    ipcMain.handle('search:grep', async (e, args) => this.search.grep(args.path, args.keyword, args.opt));
    ipcMain.handle('search:file', async (e, args) => this.search.file(args.path, args.keyword));

    ipcMain.handle('plan:parse', async (e, args) => this.plan.parse(args.spec, args.ctx));
    ipcMain.handle('plan:run', async (e, args) => this.plan.run(args.id));
    ipcMain.handle('plan:get', async (e, args) => this.plan.get(args.id));
    ipcMain.handle('plan:list', async () => this.plan.list());
    ipcMain.handle('plan:del', async (e, args) => this.plan.del(args.id));

    ipcMain.handle('audit:log', async (e, args) => this.logs.add(args.op.type, args.op.data));
    ipcMain.handle('audit:list', async (e, args) => this.logs.list(args.query));
    ipcMain.handle('audit:get', async (e, args) => this.logs.get(args.id));
    ipcMain.handle('audit:export', async (e, args) => this.logs.export(args.format));

    ipcMain.handle('cp:create', async (e, args) => this.check.create(args.desc, args.name));
    ipcMain.handle('cp:save', async (e, args) => this.check.save(args.id, args.state));
    ipcMain.handle('cp:load', async (e, args) => this.check.load(args.id));
    ipcMain.handle('cp:list', async () => this.check.list());
    ipcMain.handle('cp:del', async (e, args) => this.check.del(args.id));

    ipcMain.handle('sec:checkCmd', async (e, args) => this.sec.checkCmd(args.cmd));
    ipcMain.handle('sec:addWl', async (e, args) => this.sec.addWl(args.cmd));
    ipcMain.handle('sec:delWl', async (e, args) => this.sec.delWl(args.cmd));
    ipcMain.handle('sec:listWl', async () => this.sec.listWl());
    ipcMain.handle('sec:addDanger', async (e, args) => this.sec.addDanger(args.pattern));
    ipcMain.handle('sec:delDanger', async (e, args) => this.sec.delDanger(args.pattern));
    ipcMain.handle('sec:listDanger', async () => this.sec.listDanger());

    ipcMain.handle('state:get', async (e, args) => this.state.get(args.key));
    ipcMain.handle('state:set', async (e, args) => this.state.set(args.key, args.val));
    ipcMain.handle('state:del', async (e, args) => this.state.del(args.key));
    ipcMain.handle('state:keys', async () => this.state.keys());
    ipcMain.handle('state:clear', async () => this.state.clear());

    ipcMain.handle('win:close', () => this.window?.close());
    ipcMain.handle('win:min', () => this.window?.minimize());
    ipcMain.handle('win:max', () => {
      if (this.window?.isMaximized()) this.window.unmaximize();
      else this.window?.maximize();
    });
    ipcMain.handle('win:getState', async () => {
      const p = this.window?.getPosition();
      return { x: p?.[0], y: p?.[1], max: this.window?.isMaximized() };
    });

    ipcMain.handle('app:dialog', async (e, args) => {
      const opts = { title: args.title || 'App', defaultPath: args.path, filters: args.filters || [] };
      if (args.type === 'open') return await dialog.showOpenDialog(this.window, opts);
      if (args.type === 'save') return await dialog.showSaveDialog(this.window, opts);
      if (args.type === 'msg') {
        return await dialog.showMessageBox(this.window, {
          type: args.msgType || 'info',
          title: args.title || 'App',
          message: args.msg,
          detail: args.detail,
          buttons: args.btns || ['OK']
        });
      }
      return null;
    });
  }
}

const appInst = new AppCore();

app.whenReady().then(() => appInst.start());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});

process.on('uncaughtException', (err) => {
  console.error('ERR:', err);
});
