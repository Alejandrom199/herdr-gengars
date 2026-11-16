// Gengar Office: every agent is a Gengar (#94) in a small purple office.
//   working -> sits at a desk, monitor on      blocked -> stands in front of the desk, "!"
//   done    -> stands in front of the desk, "✓"   idle    -> asleep on the sofa / by the coffee machine
// Click a Gengar to jump to its agent. The office grows (and scrolls) with the number of agents.
import { View, div, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { agents, spaces, theme, run, appHome, readTextFile } from "herdr";
import { loadGengar, imageMagick, SKINS } from "./sprite.js";
import { ROLES, roleOf, attackFor } from "./roles.js";

const ART = (n) => `mods/gengar-office/art/${n}.svg`;

const H = 236; // office height
const TILE = 170; // wall/floor tile width
const PAD = 16;
const CELL = 150; // width of one desk station
const MIN_DESKS = 3;
const DESK_TOP = 140; // desk image top (its tabletop is the first 22px)
const SEAT_FEET = 152; // feet of a Gengar sitting behind the desk
const STAND_FEET = 196; // feet of a Gengar standing on the floor in front
const SOFA_FEET = 168; // feet of a Gengar on the sofa
const LABEL_TOP = 216;
const DEMO = false; // true: fake agents in every status, to preview the office
const LABEL_W = 120;
const MOVE = { duration: 600, easing: "linear" };

// One office per Herdr space: each space gets its own look (tint over the walls and floor).
// The look follows the space's position, so neighbouring spaces never share one.
const LOOKS = [
  { name: "Violeta", tint: "#8b5cf6" },
  { name: "Océano", tint: "#06b6d4" },
  { name: "Bosque", tint: "#22c55e" },
  { name: "Atardecer", tint: "#f97316" },
  { name: "Rosa", tint: "#ec4899" },
  { name: "Ámbar", tint: "#eab308" },
];
const lookOf = (sp) => LOOKS[(sp?.index ?? 0) % LOOKS.length];
const activeSpace = () => spaces().find((s) => s.active) ?? spaces()[0] ?? null;

function tabsById() {
  const out = {};
  for (const s of spaces()) for (const t of s.tabs) out[t.id] = t;
  return out;
}

function tagOf(a, tabs) {
  const t = tabs[a.tab];
  if (t?.named) return t.name;
  return a.space_name || a.tab_name || a.address;
}

const slotOf = (a) => a.pane || a.address;

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Skins are random but stable: the same pane always gets the same Gengar.
// 50% normal, 25% shiny, 15% mega, 10% shiny mega.
// Los roles del equipo llevan la misma piel que en el panel "Equipo".
const EQUIPO_SKIN = {
  "analista-negocios": "shiny", innovacion: "mega", pm: "normal", uiux: "mega-shiny", arquitecto: "mega",
  "lider-tecnico": "shiny", backend: "normal", dba: "mega-shiny", frontend: "shiny", qa: "normal",
  devops: "mega", seguridad: "mega-shiny", documentador: "shiny",
};
const EQUIPO_IDS = Object.keys(EQUIPO_SKIN);

function skinOf(a) {
  if (a.virtualRole && EQUIPO_SKIN[a.virtualRole]) return EQUIPO_SKIN[a.virtualRole];
  const r = hash(`gengar:${slotOf(a)}`) % 100;
  return r < 50 ? "normal" : r < 75 ? "shiny" : r < 90 ? "mega" : "mega-shiny";
}

// What the agent was asked, as far as Herdr can tell: its tab name, terminal title and space.
function taskText(a, tabs) {
  if (a.virtualRole) return "rol:" + a.virtualRole; // subagente de Claude Code (estado.json)
  const t = tabs[a.tab];
  return [t?.named ? "rol:" + t.name : "", a.title, a.tab_name, a.space_name].join(" ");
}

const DEMO_TASKS = [
  ["working", "Explícame el módulo de facturación"],
  ["working", "Implementa el endpoint de cobros"],
  ["blocked", "Revisa los tests de pagos"],
  ["done", "Diseña la arquitectura de notas de crédito"],
  ["working", "Consulta SQL de facturas vencidas"],
  ["idle", "Qué tal"],
  ["idle", "Revisa el módulo de nómina"],
  ["idle", "Crea un reporte de cobros"],
];

export default class GengarOffice extends View {
  init(_p, cx) {
    this.width = 900;
    this.magick = null; // null: not checked yet
    this.metas = {}; // skin -> sprite set | "loading" | { error, at }
    this.seats = {}; // address -> lounge seat index (stable while the agent stays idle)
    this.hover = null;
    cx.spawn(async (cx) => {
      this.magick = !!(await imageMagick());
      this.want(cx);
      cx.notify();
    });
    cx.timer.every(1500, (cx) => this.want(cx));
    // Subagentes de Claude Code: el hook ~/.claude/hooks/equipo-estado.js escribe { rol: [inicios] }.
    this.team = {};
    this.readTeam = async (cx) => {
      let next = {};
      try { next = JSON.parse((await readTextFile(`${appHome()}/data/equipo-gengar/estado.json`)) || "{}"); } catch {}
      const now = Date.now();
      const act = (s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, (v || []).filter((t) => now - t < 20 * 60 * 1000).length]).filter(([, n]) => n > 0));
      const a = act(next);
      if (JSON.stringify(a) !== JSON.stringify(this.team)) { this.team = a; cx.notify(); }
    };
    this.readTeam(cx);
    cx.timer.every(700, (cx) => this.readTeam(cx));
    this.prev = {}; // address -> last seen status
    this.say = {}; // address -> { text, until }: the attack it just used
    this.nextSay = {}; // address -> when a working agent uses its next attack
    cx.timer.every(1000, (cx) => this.speak(cx));
  }

  // "Gengar <name> usó <attack>": when an agent starts working (and every so often while it
  // works) and when it finishes, it uses a move that fits its role.
  speak(cx) {
    const now = Date.now();
    const tabs = tabsById();
    let changed = false;
    const list = this.listAgents();
    const live = new Set(list.map((a) => a.address));
    const use = (a, suffix = "") => {
      const role = roleOf(taskText(a, tabs));
      this.say[a.address] = { text: `Gengar ${tagOf(a, tabs)} usó ${attackFor(role)}${suffix}`, until: now + 4500 };
      changed = true;
    };
    for (const a of list) {
      const was = this.prev[a.address];
      if (a.status !== was) {
        if (a.status === "working") { use(a); this.nextSay[a.address] = now + 30000 + Math.random() * 20000; }
        else if (a.status === "done") use(a, ". ¡Fue muy eficaz!");
        this.prev[a.address] = a.status;
      } else if (a.status === "working" && now >= (this.nextSay[a.address] ?? Infinity)) {
        use(a);
        this.nextSay[a.address] = now + 30000 + Math.random() * 20000;
      }
    }
    for (const k of Object.keys(this.say)) {
      if (!live.has(k) || this.say[k].until <= now) { delete this.say[k]; changed = true; }
    }
    for (const k of Object.keys(this.prev)) if (!live.has(k)) { delete this.prev[k]; delete this.nextSay[k]; }
    if (changed) cx.notify();
  }

  listAgents() {
    const sp = activeSpace();
    const real = agents().filter((a) => !sp || a.space === sp.id);
    const virtual = [];
    // Los 13 roles siempre están en la oficina: activos (hook) = escritorio, el resto duerme en el sillón.
    for (const role of EQUIPO_IDS) {
      const n = this.team?.[role] ?? 0;
      const base = { pane: "", virtual: true, virtualRole: role, space: sp?.id, tab: "", tab_name: "", title: "", space_name: ROLES[role]?.label ?? role, focused: false };
      if (n === 0) virtual.push({ ...base, address: `subagente:${role}#zz`, status: "idle" });
      for (let k = 0; k < n; k++) virtual.push({ ...base, address: `subagente:${role}#${k}`, status: "working" });
    }
    const list = [...real, ...virtual];
    if (!DEMO) return list;
    const base = list[0] ?? { address: "x", pane: "", space_name: "demo", tab: "", tab_name: "", title: "" };
    return DEMO_TASKS.map(([status, title], i) => ({ ...base, address: `demo${i}`, pane: "", status, title, space_name: `agente-${i + 1}`, focused: false }));
  }

  // Loads the skins on screen, one background download each; a failed one retries after a minute.
  want(cx) {
    if (!this.magick) return;
    for (const skin of new Set(this.listAgents().map(skinOf))) {
      const cur = this.metas[skin];
      if (cur === "loading" || (cur && !cur.error)) continue;
      if (cur?.error && Date.now() - cur.at < 60000) continue;
      this.metas[skin] = "loading";
      cx.spawn(async (cx) => {
        try {
          this.metas[skin] = await loadGengar(skin);
        } catch (e) {
          this.metas[skin] = { error: String(e?.message ?? e), at: Date.now() };
        }
        cx.notify();
      });
    }
  }

  // Lounge seats for idle agents: sofa left, sofa right, then spots on the floor in front of the machine.
  seatFor(list) {
    const idle = list.filter((a) => a.status === "idle");
    const live = new Set(idle.map((a) => a.address));
    for (const k of Object.keys(this.seats)) if (!live.has(k)) delete this.seats[k];
    const taken = new Set(Object.values(this.seats));
    for (const a of idle) {
      if (this.seats[a.address] !== undefined) continue;
      let i = 0;
      while (taken.has(i)) i++;
      this.seats[a.address] = i;
      taken.add(i);
    }
    return idle.length ? Math.max(...Object.values(this.seats)) + 1 : 0;
  }

  render(cx) {
    const t = theme();
    const sp = activeSpace();
    const look = lookOf(sp);
    const list = this.listAgents();
    const tabs = tabsById();
    const seatCount = this.seatFor(list);

    const workers = list.filter((a) => a.status !== "idle"); // working / blocked / done: escritorio
    const desks = Math.max(MIN_DESKS, workers.length);
    const deskX0 = PAD + 8; // desks first, so working agents are always in view
    const x0 = deskX0 + desks * CELL + 24; // lounge (sofa) after the desks
    const sofas = Math.max(1, Math.ceil(seatCount / 2)); // one sofa seats 2; more sleepers add sofas
    const loungeW = Math.max(250, sofas * 170 + 80);
    const W = Math.max(x0 + loungeW + PAD, this.width);

    const room = div().relative().flex_none().w(W).h(H);

    // 1. wall + floor, rug, sofa back, coffee machine
    for (let i = 0; i * TILE < W; i++) {
      room.child(image(ART(i % 2 === 0 ? "wall-a" : "wall-b")).absolute().left(i * TILE).top(0).w(TILE).h(H));
    }
    room.child(image(ART("rug")).absolute().left(x0 - 8).top(168).w(loungeW).h(56));
    for (let s = 0; s < sofas; s++) room.child(image(ART("sofa-back")).absolute().left(x0 + s * 170).top(100).w(170).h(80));
    room.child(image(ART("coffee")).absolute().left(x0 + 186 + (sofas - 1) * 170).top(100).w(64).h(100));
    room.child(image(ART("steam")).absolute().left(x0 + 213 + (sofas - 1) * 170).top(78).w(22).h(26)
      .loop("opacity", { from: 0.1, to: 0.8, period: 1800 }));

    // 1b. this space's look: a tint over the walls and floor, so every space reads as its own office
    room.child(div().absolute().left(0).top(0).w(W).h(H).bg(look.tint + "38"));

    // 2. where each Gengar is
    const items = list.map((a) => {
      const cellX = deskX0 + Math.max(0, workers.indexOf(a)) * CELL;
      const seat = this.seats[a.address];
      if (a.status === "working") return { a, cxp: cellX + 58, feet: SEAT_FEET, behind: true, sprite: "idle" };
      if (a.status === "idle") {
        return { a, cxp: x0 + Math.floor(seat / 2) * 170 + 52 + (seat % 2) * 66, feet: SOFA_FEET, behind: false, sprite: "sleep" };
      }
      return { a, cxp: cellX + CELL / 2, feet: STAND_FEET, behind: false, sprite: "idle" }; // blocked / done
    });

    // A role's accessory sits on the Gengar (hat on the head, glasses on the face, a tool at its side).
    // Sleepers curl up, so they go without.
    const accessory = (it, m) => {
      const role = ROLES[roleOf(taskText(it.a, tabs))];
      if (!role.art || !m || it.sprite === "sleep") return null;
      const top = it.feet - m.box.h; // top of the visible body
      const spot = {
        hat: [it.cxp - role.w / 2, top - role.h + 8],
        face: [it.cxp - role.w / 2, top + m.box.h * 0.32],
        side: [it.cxp - m.box.w / 2 - role.w * 0.45, top + m.box.h * 0.5],
      }[role.mode];
      return image(ART(role.art)).id(`r-${it.a.address}`).absolute().left(spot[0]).top(spot[1]).w(role.w).h(role.h)
        .transition("left", MOVE);
    };

    const draw = (it) => {
      const { a, cxp, feet, sprite } = it;
      const set = this.metas[skinOf(a)];
      const m = set && set.idle ? set[sprite] : null;
      it.m = m;
      const click = () => (a.virtual ? null : a.pane ? run("pane.focus", { pane: a.pane }) : run("agent.focus", { terminal: a.address }));
      const hover = (h, cx) => {
        const next = h ? a.address : this.hover === a.address ? null : this.hover;
        if (next !== this.hover) { this.hover = next; cx.notify(); }
      };
      if (m) {
        it.headY = feet - m.box.h;
        return image(m.path).id(`g-${a.address}`).absolute()
          .left(cxp - (m.box.x + m.box.w / 2)).top(feet - (m.box.y + m.box.h)).w(m.w).h(m.h)
          .transition("left", MOVE).cursor_pointer().on_click(click).on_hover(hover);
      }
      // sprite not ready yet: a purple blob waits in its place
      it.headY = feet - 34;
      return div().id(`g-${a.address}`).absolute().left(cxp - 17).top(feet - 34).w(34).h(34)
        .rounded_full().bg(t.accent).cursor_pointer().on_click(click).on_hover(hover)
        .loop("opacity", { from: 0.35, to: 0.9, period: 1200 });
    };

    // 3. seated / sleeping-on-the-sofa Gengars, then the furniture that covers their lower half
    const add = (it) => room.child(draw(it));
    items.filter((it) => it.behind).forEach(add);
    for (let i = 0; i < desks; i++) {
      const cellX = deskX0 + i * CELL;
      const working = workers[i]?.status === "working";
      room.child(image(ART("desk")).absolute().left(cellX + 10).top(DESK_TOP).w(130).h(74));
      room.child(image(ART(working ? "monitor-on" : "monitor-off")).absolute().left(cellX + 92).top(DESK_TOP - 30).w(44).h(44)
        .when(working, (e) => e.loop("opacity", { from: 0.8, to: 1, period: 1400 })));
    }
    for (let s = 0; s < sofas; s++) room.child(image(ART("sofa-front")).absolute().left(x0 + s * 170).top(140).w(170).h(50));

    // 4. standing Gengars (blocked, done, overflow idle) in front of everything
    items.filter((it) => !it.behind).forEach(add);
    // role accessories last, so no desk or cushion ever covers them
    for (const it of items) {
      const acc = accessory(it, it.m);
      if (acc) room.child(acc);
    }

    // 5. bubbles, attack messages and name tags
    const now = Date.now();
    for (const it of items) {
      const { a, cxp } = it;
      const hovered = this.hover === a.address;
      const say = this.say[a.address];
      if (say && say.until > now) {
        room.child(h_flex().absolute().left(Math.max(4, cxp - 110)).w(220).top(Math.max(2, (it.headY ?? 60) - 50))
          .justify_center()
          .child(div().px(8).py(3).rounded(6).bg("#f3eefa").border_1().border_color(t.accent).text_size(10.5).font_semibold()
            .text_color("#17121f").child(say.text)));
      }
      const bubble =
        a.status === "blocked" ? div().px(7).rounded(7).bg(t.blocked).text_color("#ffffff").font_bold().child("!")
          .loop("opacity", { from: 0.65, to: 1, period: 900 })
        : a.status === "done" ? div().px(7).rounded(7).bg(t.done).text_color("#17121f").font_bold().child("✓")
        : a.status === "idle" ? div().text_color(t.muted).frames(["z", "zZ", "zZz", "zZ"], 700)
        : null;
      if (bubble) {
        room.child(h_flex().absolute().left(cxp - 30).w(60).top(Math.max(2, (it.headY ?? 60) - 22))
          .justify_center().text_size(13).child(bubble));
      }
      room.child(
        h_flex().id(`l-${a.address}`).absolute().left(cxp - (a.status === "idle" ? 35 : LABEL_W / 2)).top(LABEL_TOP).w(a.status === "idle" ? 70 : LABEL_W).h(18)
          .justify_center().items_center().gap(4).transition("left", MOVE)
          .cursor_pointer()
          .on_click(() => (a.virtual ? null : a.pane ? run("pane.focus", { pane: a.pane }) : run("agent.focus", { terminal: a.address })))
          .child(div().flex_none().size(6).rounded_full().bg(t[a.status] ?? t.idle))
          .child(div().min_w(0).truncate().text_size(10.5)
            .text_color(hovered || a.focused ? t.foreground : t.muted)
            .child(hovered
              ? `${ROLES[roleOf(taskText(a, tabs))].label} · ${skinOf(a)} · ${tagOf(a, tabs)}`
              : tagOf(a, tabs))),
      );
    }

    // 6. notes: empty office, loading, errors
    const failed = Object.values(this.metas).find((m) => m && m.error);
    const note =
      this.magick === false ? "Install ImageMagick (magick) to see Gengar"
      : failed ? `Couldn't prepare Gengar: ${failed.error}`
      : list.length === 0 ? `Oficina "${sp?.name ?? "?"}" vacía. Cada agente que inicies en este space aparece aquí como un Gengar.`
      : null;
    if (note) {
      room.child(div().absolute().left(PAD).top(26).text_size(11).text_color(t.muted).child(note));
    }
    // the office's name: the selected space and how many agents work in it
    room.child(h_flex().absolute().left(PAD).top(6).items_center().gap(6)
      .child(div().flex_none().size(8).rounded_full().bg(look.tint))
      .child(div().text_size(11).font_semibold().text_color(t.foreground)
        .child(`Oficina · ${sp?.name ?? "sin space"}`))
      .child(div().text_size(10.5).text_color(t.muted)
        .child(`${look.name} · ${list.length} ${list.length === 1 ? "agente" : "agentes"}`)));

    return div().id("gengar-office").size_full().overflow_hidden().bg(t.canvas)
      .on_size_change((size, cx) => {
        if (Math.abs(size.width - this.width) > 1) { this.width = size.width; cx.notify(); }
      })
      .child(div().id("gengar-scroll").size_full().overflow_x_scrollbar().child(room));
  }
}
