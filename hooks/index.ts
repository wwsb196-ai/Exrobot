import { useState, useEffect, useCallback, useRef } from 'react';

const useOps = () => (window as any).ops;

export function useFileSystem() {
  const ops = useOps();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wrap = async (fn) => {
    try { setLoading(true); return await fn(); }
    catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  };

  return {
    read: (p, o) => wrap(() => ops?.fs?.read(p, o)),
    write: (p, c, o) => wrap(() => ops?.fs?.write(p, c, o)),
    append: (p, c) => wrap(() => ops?.fs?.append(p, c)),
    replace: (p, f, t, a) => wrap(() => ops?.fs?.replace(p, f, t, a)),
    mkdir: (p) => wrap(() => ops?.fs?.mkdir(p)),
    ls: (p, o) => wrap(() => ops?.fs?.ls(p, o)),
    tree: (p, d) => wrap(() => ops?.fs?.tree(p, d)),
    del: (p) => wrap(() => ops?.fs?.del(p)),
    move: (s, t) => wrap(() => ops?.fs?.move(s, t)),
    copy: (s, t) => wrap(() => ops?.fs?.copy(s, t)),
    find: (p, k, t) => wrap(() => ops?.fs?.find(p, k, t)),
    loading, error
  };
}

export function useSystemCommand() {
  const ops = useOps();
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (c, o) => {
    setLoading(true);
    try { return await ops?.cmd?.run(c, o); }
    finally { setLoading(false); }
  }, [ops]);

  return {
    run, check: ops?.cmd?.check.bind(ops),
    listWl: ops?.cmd?.list.bind(ops),
    addWl: ops?.cmd?.addWl.bind(ops),
    delWl: ops?.cmd?.delWl.bind(ops),
    ps: ops?.cmd?.ps.bind(ops),
    kill: ops?.cmd?.kill.bind(ops),
    loading
  };
}

export function useCodeExecution() {
  const ops = useOps();
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (c, l, o) => {
    setLoading(true);
    try { return await ops?.code?.run(c, l, o); }
    finally { setLoading(false); }
  }, [ops]);

  return {
    run, fmt: ops?.code?.fmt.bind(ops),
    lint: ops?.code?.lint.bind(ops),
    install: ops?.code?.install.bind(ops),
    loading
  };
}

export function useSearch() {
  const ops = useOps();
  const [loading, setLoading] = useState(false);

  const wrap = async (fn) => {
    setLoading(true);
    try { return await fn(); }
    finally { setLoading(false); }
  };

  return {
    web: (q, n) => wrap(() => ops?.search?.web(q, n)),
    grep: (p, k, o) => wrap(() => ops?.search?.grep(p, k, o)),
    file: (p, k) => wrap(() => ops?.search?.file(p, k)),
    loading
  };
}

export function useTaskPlanner() {
  const ops = useOps();
  const [plans, setPlans] = useState([]);
  const [running, setRunning] = useState(null);

  useEffect(() => {
    ops?.plan?.list().then(setPlans);
  }, []);

  const refresh = async () => setPlans(await ops?.plan?.list());

  const parse = async (s, c) => {
    const res = await ops?.plan?.parse(s, c);
    await refresh();
    return res;
  };

  const run = async (id) => {
    setRunning(id);
    try { return await ops?.plan?.run(id); }
    finally { setRunning(null); await refresh(); }
  };

  const del = async (id) => {
    await ops?.plan?.del(id);
    await refresh();
  };

  return { plans, running, parse, run, get: ops?.plan?.get.bind(ops), del, refresh };
}

export function useAudit() {
  const ops = useOps();
  const [logs, setLogs] = useState([]);

  useEffect(() => { ops?.audit?.list().then(setLogs); }, []);

  const log = async (op) => {
    await ops?.audit?.log(op);
    setLogs(await ops?.audit?.list());
  };

  return {
    log, list: (q) => ops?.audit?.list(q).then(setLogs),
    get: ops?.audit?.get.bind(ops),
    export: ops?.audit?.export.bind(ops),
    logs
  };
}

export function useCheckpoint() {
  const [cps, setCps] = useState([]);
  const ops = useOps();

  useEffect(() => { ops?.cp?.list().then(setCps); }, []);

  const create = async (d, n) => {
    await ops?.cp?.create(d, n);
    setCps(await ops?.cp?.list());
  };

  const save = async (i, s) => {
    await ops?.cp?.save(i, s);
    setCps(await ops?.cp?.list());
  };

  const load = async (i) => {
    const res = await ops?.cp?.load(i);
    setCps(await ops?.cp?.list());
    return res;
  };

  const del = async (i) => {
    await ops?.cp?.del(i);
    setCps(await ops?.cp?.list());
  };

  return { cps, create, save, load, del, list: () => ops?.cp?.list().then(setCps) };
}

export function useSecurity() {
  const ops = useOps();
  const [wl, setWl] = useState([]);
  const [danger, setDanger] = useState([]);

  useEffect(() => {
    Promise.all([ops?.sec?.listWl(), ops?.sec?.listDanger()])
      .then(([w, d]) => { setWl(w || []); setDanger(d || []); });
  }, []);

  const checkCmd = ops?.sec?.checkCmd.bind(ops);

  const addWl = async (c) => {
    await ops?.sec?.addWl(c);
    setWl(await ops?.sec?.listWl());
  };

  const delWl = async (c) => {
    await ops?.sec?.delWl(c);
    setWl(await ops?.sec?.listWl());
  };

  const addDanger = async (p) => {
    await ops?.sec?.addDanger(p);
    setDanger(await ops?.sec?.listDanger());
  };

  const delDanger = async (p) => {
    await ops?.sec?.delDanger(p);
    setDanger(await ops?.sec?.listDanger());
  };

  return { wl, danger, checkCmd, addWl, delWl, addDanger, delDanger };
}

export function useAppState() {
  const ops = useOps();
  const [state, setState] = useState({});

  const keys = useCallback(async () => {
    const k = await ops?.state?.keys();
    setState(Object.fromEntries((k || []).map(key => [key, null])));
    return k || [];
  }, [ops]);

  useEffect(() => { keys(); }, []);

  const get = useCallback(async (k) => {
    const v = await ops?.state?.get(k);
    setState(s => ({ ...s, [k]: v }));
    return v;
  }, [ops]);

  const set = useCallback(async (k, v) => {
    await ops?.state?.set(k, v);
    setState(s => ({ ...s, [k]: v }));
  }, [ops]);

  const del = useCallback(async (k) => {
    await ops?.state?.del(k);
    setState(s => { const ns = { ...s }; delete ns[k]; return ns; });
  }, [ops]);

  const clear = useCallback(async () => {
    await ops?.state?.clear();
    setState({});
  }, [ops]);

  return { state, keys, get, set, del, clear };
}

export function useWindowControls() {
  const ops = useOps();
  const [winState, setWinState] = useState(null);

  useEffect(() => {
    ops?.win?.getState().then(setWinState);
  }, []);

  return {
    close: ops?.win?.close,
    min: ops?.win?.min,
    max: ops?.win?.max,
    state: winState,
    refresh: () => ops?.win?.getState().then(setWinState)
  };
}

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

export function useLocalStorage(key, init) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); }
    catch {}
  }, [key, v]);
  return [v, setV];
}

export function useClipboard() {
  const copy = useCallback(async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
  }, []);
  return copy;
}

export function useKeyboardShortcut(keys, callback) {
  useEffect(() => {
    const handler = (e) => {
      const pressed = keys.map(k => {
        const kLower = k.toLowerCase();
        return e.key.toLowerCase() === kLower || 
               (kLower === 'ctrl' && (e.ctrlKey || e.metaKey)) ||
               (kLower === 'shift' && e.shiftKey) ||
               (kLower === 'alt' && e.altKey);
      }).every(Boolean);
      if (pressed) { e.preventDefault(); callback(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys, callback]);
}
