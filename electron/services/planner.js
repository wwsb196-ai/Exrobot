const crypto = require('crypto');

class PlanSvc {
  constructor(fs, log) {
    this.fs = fs;
    this.log = log;
    this.tasks = new Map();
    this.deps = new Map();
    this.id = () => crypto.randomUUID();
  }

  async parse(spec, ctx) {
    const id = this.id();
    const steps = this.toSteps(spec, ctx);
    const dag = this.buildDag(steps);
    const est = this.estimate(steps);

    const plan = {
      id, title: spec.title || 'Task Plan',
      steps, dag, est, status: 'ready',
      created: Date.now(), ctx
    };

    this.tasks.set(id, plan);
    this.log?.('plan:create', { id, title: plan.title, steps: steps.length });
    return plan;
  }

  toSteps(spec, ctx) {
    if (Array.isArray(spec)) {
      return spec.map((s, i) => ({ ...s, order: i, id: this.id() }));
    }
    if (typeof spec === 'string') {
      return [{ cmd: spec, order: 0, id: this.id() }];
    }
    if (spec.steps) {
      return spec.steps.map((s, i) => ({ ...s, order: i, id: this.id() }));
    }
    return [{ ...spec, order: 0, id: this.id() }];
  }

  buildDag(steps) {
    const adj = new Map();
    steps.forEach(s => adj.set(s.id, []));

    steps.forEach((s, i) => {
      if (s.after) {
        const targets = Array.isArray(s.after) ? s.after : [s.after];
        targets.forEach(t => {
          const tid = typeof t === 'object' ? t.id : t;
          if (adj.has(tid)) adj.get(tid).push(s.id);
        });
      }
      if (i > 0 && !s.after) {
        adj.get(steps[i-1].id).push(s.id);
      }
    });

    return adj;
  }

  estimate(steps) {
    return {
      time: steps.reduce((a, s) => a + (s.timeout || 30), 0),
      risk: this.calcRisk(steps),
      cost: steps.reduce((a, s) => a + (s.cost || 1), 0)
    };
  }

  calcRisk(steps) {
    const high = ['rm', 'del', 'format', 'mkfs', 'dd'];
    const mid = ['write', 'edit', 'move', 'copy'];
    let score = 0;
    steps.forEach(s => {
      const c = (s.cmd || s.action || '').toLowerCase();
      if (high.some(k => c.includes(k))) score += 3;
      else if (mid.some(k => c.includes(k))) score += 1;
    });
    return Math.min(score / steps.length / 3, 1);
  }

  async run(id, onStep) {
    const plan = this.tasks.get(id);
    if (!plan) return { ok: false, err: 'Plan not found' };

    plan.status = 'running';
    plan.started = Date.now();
    const results = [];

    const execOrder = this.topoSort(plan.dag);
    const stepMap = new Map(plan.steps.map(s => [s.id, s]));

    for (const sid of execOrder) {
      const step = stepMap.get(sid);
      const prev = results.filter(r => step.after?.includes(r.id) || (!step.after && results.length > 0));
      const ctx = { ...plan.ctx, prev };

      if (onStep) await onStep(step, ctx);

      const res = await this.execStep(step, ctx);
      results.push({ ...res, id: step.id, title: step.title });

      if (!res.ok && step.blockOnFail !== false) {
        plan.status = 'failed';
        break;
      }
    }

    plan.status = plan.status === 'running' ? 'completed' : plan.status;
    plan.finished = Date.now();
    plan.results = results;
    this.log?.('plan:done', { id, status: plan.status, steps: results.length });

    return { ok: plan.status === 'completed', plan };
  }

  async execStep(step, ctx) {
    try {
      const r = await step.exec?.(step, ctx);
      return r || { ok: true, out: 'done' };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }

  topoSort(dag) {
    const visited = new Set();
    const order = [];

    const dfs = n => {
      if (visited.has(n)) return;
      visited.add(n);
      (dag.get(n) || []).forEach(dfs);
      order.push(n);
    };

    dag.forEach((_, k) => dfs(k));
    return order;
  }

  get(id) { return this.tasks.get(id); }
  list() { return Array.from(this.tasks.values()); }
  del(id) { return this.tasks.delete(id); }
}

module.exports = PlanSvc;
