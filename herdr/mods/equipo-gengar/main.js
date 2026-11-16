// Equipo: los roles de agentes como Gengars, en una columna a la derecha.
// Cada Gengar lleva un accesorio de su rol (gorro, lupa, casco, escudo...).
// Un rol despierta cuando el orquestador lo invoca (hook de Claude Code) y duerme al terminar.
import { View, div, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, appHome, readTextFile } from "herdr";

// Un hook de Claude Code (~/.claude/hooks/equipo-estado.js) escribe aquí los roles invocados.
const ESTADO = () => `${appHome()}/data/equipo-gengar/estado.json`;

const GIF = (skin, kind) => `data/gengar-office/sprites/${skin}/${kind}.gif`;
const ART = (n) => `mods/equipo-gengar/art/${n}.svg`;
const K = 0.7; // escala del sprite
const AK = 0.8; // escala de los accesorios
const CW = 60, CH = 78, TOP = 20; // caja del sprite
// Caja visible de cada piel, en px del GIF
const BOX = {
  normal: { w: 64, h: 80, x: 6, y: 8, bw: 52, bh: 52 },
  shiny: { w: 64, h: 80, x: 6, y: 8, bw: 52, bh: 52 },
  mega: { w: 80, h: 80, x: 2, y: 6, bw: 78, bh: 58 },
  "mega-shiny": { w: 80, h: 80, x: 2, y: 6, bw: 78, bh: 58 },
};

// acc: [arte, lugar, ancho, alto] · lugar: hat (cabeza) / face (cara) / side (al costado)
const ROLES = [
  { id: "analista-negocios", label: "Analista de Negocios", about: "procesos y valor", color: "#facc15", skin: "shiny", acc: ["role-chart", "side", 28, 26], re: /negocio|business|\bba\b/ },
  { id: "innovacion", label: "Innovación / Ideas", about: "ideas y propuestas", color: "#ffe066", skin: "mega", acc: ["role-bulb", "hat", 26, 32], re: /innova|\bidea/ },
  { id: "pm", label: "PM / Analista", about: "requerimientos", color: "#60a5fa", skin: "normal", acc: ["role-clipboard", "side", 22, 28], re: /\bpm\b|analista funcional|requerim/ },
  { id: "uiux", label: "UI / UX", about: "diseño de interfaz", color: "#ec4899", skin: "mega-shiny", acc: ["role-beret", "hat", 38, 20], re: /ui\/ux|\buiux\b|\bux\b|dise[nñ]o de interfaz|\bui\b/ },
  { id: "arquitecto", label: "Arquitecto", about: "diseño y ADRs", color: "#a78bfa", skin: "mega", acc: ["role-mortarboard", "hat", 46, 26], re: /arquitect|\badr\b/ },
  { id: "lider-tecnico", label: "Líder técnico", about: "revisión y estándares", color: "#fb9f4a", skin: "shiny", acc: ["role-crown", "hat", 36, 24], re: /l[ií]der|lider-tecnico/ },
  { id: "backend", label: "Backend", about: "APIs y lógica", color: "#4ade80", skin: "normal", acc: ["role-helmet", "hat", 40, 22], re: /backend|back-end/ },
  { id: "dba", label: "DBA / Datos", about: "DDL y SQL", color: "#facc15", skin: "mega-shiny", acc: ["role-db", "side", 22, 26], re: /\bdba\b|\bsql\b|\bddl\b/ },
  { id: "frontend", label: "Frontend", about: "UI e integración", color: "#22d3ee", skin: "shiny", acc: ["role-code", "side", 30, 22], re: /frontend|front-end/ },
  { id: "qa", label: "QA", about: "pruebas", color: "#f87171", skin: "normal", acc: ["role-glasses", "face", 42, 16], re: /\bqa\b|prueb|\btest/ },
  { id: "devops", label: "DevOps / Release", about: "publish y deploy", color: "#f472b6", skin: "mega", acc: ["role-rocket", "side", 22, 30], re: /devops|release|deploy|publish/ },
  { id: "seguridad", label: "Seguridad", about: "vulnerabilidades", color: "#fb7185", skin: "mega-shiny", acc: ["role-shield", "side", 24, 28], re: /segur|security/ },
  { id: "documentador", label: "Documentador", about: "docs y runbooks", color: "#94a3b8", skin: "shiny", acc: ["role-notebook", "side", 24, 28], re: /document|readme|runbook/ },
];

// Gengar + accesorio del rol, en una caja CW x CH.
function gengar(r, on) {
  const b = BOX[r.skin];
  const iw = b.w * K, ih = b.h * K;
  const left = (CW - iw) / 2;
  const bodyL = left + b.x * K, bodyT = TOP + b.y * K, bodyW = b.bw * K, bodyH = b.bh * K;
  const cx = bodyL + bodyW / 2;
  const [art, mode, aw, ah] = r.acc;
  const w = aw * AK, h = ah * AK;
  const spot = {
    hat: [cx - w / 2, bodyT - h + 7],
    face: [cx - w / 2, bodyT + bodyH * 0.32],
    side: [Math.max(0, bodyL - w * 0.4), bodyT + bodyH * 0.45],
  }[mode];
  return div().relative().flex_none().w(CW).h(CH)
    .child(image(GIF(r.skin, on ? "idle" : "sleep")).id(`s-${r.id}`).absolute().left(left).top(TOP).w(iw).h(ih)
      .when(!on, (e) => e.opacity(0.6)))
    .child(image(ART(art)).id(`a-${r.id}`).absolute().left(spot[0]).top(spot[1]).w(w).h(h)
      .when(!on, (e) => e.opacity(0.85)));
}

export default class Equipo extends View {
  init(_p, cx) {
    this.estado = {}; // rol -> [timestamps de inicio]
    this.leer = async (cx) => {
      let next = {};
      try { next = JSON.parse((await readTextFile(ESTADO())) || "{}"); } catch {}
      const now = Date.now();
      const act = (s) => Object.fromEntries(Object.entries(s).filter(([, v]) => v?.some((t) => now - t < 20 * 60 * 1000)));
      if (JSON.stringify(act(next)) !== JSON.stringify(act(this.estado))) { this.estado = next; cx.notify(); }
    };
    this.leer(cx);
    cx.timer.every(700, (cx) => this.leer(cx));
  }

  render(cx) {
    const t = theme();
    const now = Date.now();
    // Despierto = el orquestador invocó ese rol y aún no termina.
    const count = (r) => (this.estado[r.id] ?? []).filter((x) => now - x < 20 * 60 * 1000).length;
    const rows = ROLES.map((r) => ({ r, n: count(r) }));
    const awake = rows.filter((x) => x.n > 0).length;

    const card = ({ r, n }) => {
      const on = n > 0;
      return h_flex().id(`r-${r.id}`).items_center().gap(6).px(6).rounded(8)
        .bg(on ? t.surface0 ?? t.surface : t.canvas).border_1().border_color(on ? r.color : t.border)
        .child(gengar(r, on))
        .child(v_flex().min_w(0).flex_1().gap(1)
          .child(h_flex().items_center().gap(5)
            .child(div().flex_none().size(7).rounded_full().bg(r.color))
            .child(div().min_w(0).truncate().text_size(12).font_semibold().text_color(t.foreground).child(r.label)))
          .child(div().min_w(0).truncate().text_size(10.5).text_color(on ? r.color : t.muted)
            .child(on ? `¡despierto!${n > 1 ? ` ×${n}` : ""} · ${r.about}` : `zZ · ${r.about}`)))
        .child(on
          ? div().flex_none().size(8).rounded_full().bg(r.color).loop("opacity", { from: 0.3, to: 1, period: 800 })
          : div().flex_none().size(8));
    };

    return div().id("equipo").size_full().overflow_hidden().bg(t.canvas).p(8)
      .child(v_flex().size_full().gap(6)
        .child(v_flex().gap(1).pb(4)
          .child(div().text_size(13).font_bold().text_color(t.foreground).child("Equipo"))
          .child(div().text_size(10.5).text_color(t.muted).child(`Orquestador + ${ROLES.length} roles · ${awake} activos`)))
        .child(div().id("equipo-scroll").flex_1().min_h(0).overflow_y_scrollbar()
          .child(v_flex().gap(6).children(rows.map(card)))));
  }
}
