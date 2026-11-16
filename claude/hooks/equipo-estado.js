// Registra qué roles (subagentes) están activos para que el panel "Equipo" de Herdr
// despierte a su Gengar. Uso: node equipo-estado.js start|stop  (JSON del hook por stdin).
// Estado: ~/.config/herdr-app/data/equipo-gengar/estado.json -> { rol: [timestamps de inicio] }
const fs = require("fs");
const path = require("path");
const os = require("os");

const FILE = path.join(os.homedir(), ".config", "herdr-app", "data", "equipo-gengar", "estado.json");
const EXPIRA = 20 * 60 * 1000; // un rol que nunca avisó que terminó se duerme solo a los 20 min

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  try {
    const mode = process.argv[2];
    const e = JSON.parse(raw || "{}");
    const role = mode === "start" ? e.tool_input?.subagent_type : e.agent_type;
    if (!role) return;

    let state = {};
    try { state = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
    const now = Date.now();
    for (const k of Object.keys(state)) {
      state[k] = (state[k] || []).filter((t) => now - t < EXPIRA);
      if (!state[k].length) delete state[k];
    }
    if (mode === "start") (state[role] ||= []).push(now);
    else if (state[role]) { state[role].shift(); if (!state[role].length) delete state[role]; }

    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state));
  } catch {
    // un hook de estado nunca debe interrumpir a Claude
  }
});
