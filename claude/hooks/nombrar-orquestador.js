// Al iniciar Claude Code dentro de Herdr, nombra su pestaña "Orquestador" para que el agente
// principal se muestre con ese nombre y no con el del proyecto/carpeta.
// Solo renombra pestañas sin nombre propio (las que Herdr llama "1", "2"...).
const { execFileSync } = require("child_process");
const os = require("os");
const path = require("path");

const NOMBRE = "Orquestador";
const APP = path.join(os.homedir(), "AppData", "Local", "Programs", "herdr-app", "herdr-app.exe");
const terminal = process.env.HC_TERMINAL_ID;

process.stdin.resume();
process.stdin.on("data", () => {});
process.stdin.on("end", () => {
  try {
    if (!terminal) return; // no estamos dentro de Herdr
    const ls = JSON.parse(execFileSync(APP, ["ls"], { encoding: "utf8", timeout: 8000 }));
    for (const space of ls.spaces ?? []) {
      for (const tab of space.tabs ?? []) {
        if (!(tab.terminals ?? []).some((t) => t.terminal === terminal)) continue;
        if (!/^\d+$/.test(String(tab.name))) return; // ya tiene nombre propio
        execFileSync(APP, ["do", "tab.rename", JSON.stringify({ id: tab.id, name: NOMBRE })], { timeout: 8000 });
        return;
      }
    }
  } catch {
    // nunca debe interrumpir el inicio de Claude
  }
});
