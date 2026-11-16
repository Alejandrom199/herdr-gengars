// Roles are deduced from the task: the tab's name (when someone named it), the terminal's
// title (agents usually set it to a summary of what they were asked) and the space's name.
// The first rule that matches wins, so order matters: asking to *explain* beats the topic's words.
export const ROLES = {
  explorador: { label: "Explorador", art: "role-lupa", mode: "side", w: 26, h: 28, about: "explica, analiza, investiga: solo lee" },
  revisor: { label: "Revisor", art: "role-glasses", mode: "face", w: 42, h: 16, about: "revisa, prueba, audita, valida" },
  arquitecto: { label: "Arquitecto", art: "role-mortarboard", mode: "hat", w: 46, h: 26, about: "diseña, planea, propone" },
  constructor: { label: "Constructor", art: "role-helmet", mode: "hat", w: 40, h: 22, about: "implementa, crea, arregla, refactoriza" },
  datos: { label: "Datos", art: "role-db", mode: "side", w: 22, h: 26, about: "SQL, tablas, consultas, reportes" },
  generalista: { label: "Generalista", art: null, mode: null, w: 0, h: 0, about: "sin tarea clara" },

  // Roles del equipo: se reconocen por el nombre de la pestaña ("rol:<nombre>").
  "analista-negocios": { label: "Analista de negocios", art: "role-chart", mode: "side", w: 28, h: 26, about: "problema de negocio y KPIs" },
  innovacion: { label: "Innovación", art: "role-bulb", mode: "hat", w: 26, h: 32, about: "ideas y alternativas" },
  pm: { label: "PM", art: "role-clipboard", mode: "side", w: 22, h: 28, about: "historias de usuario y alcance" },
  uiux: { label: "UI/UX", art: "role-beret", mode: "hat", w: 38, h: 20, about: "flujos y pantallas" },
  dba: { label: "DBA", art: "role-db", mode: "side", w: 22, h: 26, about: "DDL y modelado de datos" },
  backend: { label: "Backend", art: "role-helmet", mode: "hat", w: 40, h: 22, about: "API y lógica" },
  frontend: { label: "Frontend", art: "role-code", mode: "side", w: 30, h: 22, about: "interfaz e integración" },
  qa: { label: "QA", art: "role-glasses", mode: "face", w: 42, h: 16, about: "pruebas y casos borde" },
  seguridad: { label: "Seguridad", art: "role-shield", mode: "side", w: 24, h: 28, about: "vulnerabilidades" },
  "lider-tecnico": { label: "Líder técnico", art: "role-crown", mode: "hat", w: 36, h: 24, about: "revisión y veredicto" },
  documentador: { label: "Documentador", art: "role-notebook", mode: "side", w: 24, h: 28, about: "README y guías" },
  orquestador: { label: "Orquestador", art: "role-baton", mode: "side", w: 26, h: 28, about: "dirige a los roles (batuta)" },
  devops: { label: "DevOps", art: "role-rocket", mode: "side", w: 22, h: 30, about: "publicación y despliegue" },
};

const NOMBRES = ["analista-negocios", "innovacion", "pm", "uiux", "dba", "backend", "frontend", "qa", "seguridad", "lider-tecnico", "documentador", "devops", "arquitecto", "orquestador"];
const RULES = [
  ...NOMBRES.map((n) => [n, new RegExp("^rol:" + n + "( |$)")]),
  ["explorador", /explic|explain|expl[ií]came|analiz|analy[sz]|entend|understand|investig|explor|resum|summar|document|c[oó]mo funciona|how does|qu[eé] hace|what does|lee\b|leer\b|read\b/],
  ["revisor", /review|revis|test|prueb|\bqa\b|audit|verific|valid|inspecc|lint|code ?review/],
  ["arquitecto", /dise[nñ]|arquitect|architect|design|planea|plan\b|propuest|propos|estrateg|roadmap|adr\b/],
  ["constructor", /implement|crea\b|crear|constru|build|fix\b|arregl|corrig|bug|refactor|migra|agrega|a[nñ]ad|add\b|escrib|write\b|genera|generate/],
  ["datos", /\bsql\b|base de datos|database|\bdb\b|query|consulta|tabla|table|schema|esquema|\bddl\b|\betl\b|reporte|report|dataset|datos/],
];

export function roleOf(text) {
  const s = (text || "").toLowerCase();
  for (const [role, re] of RULES) if (re.test(s)) return role;
  return "generalista";
}

// Gengar's moves, in Spanish as the games name them, by role. Agents "use" one when they start
// working or finish: "Gengar facturación usó Tinieblas".
export const ATTACKS = {
  explorador: ["Mal de Ojo", "Rayo Confuso", "Tinieblas"],
  revisor: ["Gafe", "Rencor", "Pulso Umbrío"],
  arquitecto: ["Bola Sombra", "Hipnosis", "Mismo Destino"],
  constructor: ["Puño Sombra", "Golpe Bajo", "Bomba Lodo"],
  datos: ["Come Sueños", "Lengüetazo", "Fuego Fatuo"],
  generalista: ["Sombra Vil", "Maldición"],
  "analista-negocios": ["Mal de Ojo", "Rayo Confuso"],
  innovacion: ["Hipnosis", "Come Sueños"],
  pm: ["Mismo Destino", "Maldición"],
  uiux: ["Bola Sombra", "Rayo Confuso"],
  dba: ["Come Sueños", "Lengüetazo"],
  backend: ["Puño Sombra", "Bomba Lodo"],
  frontend: ["Golpe Bajo", "Puño Sombra"],
  qa: ["Gafe", "Rencor"],
  seguridad: ["Pulso Umbrío", "Rencor"],
  "lider-tecnico": ["Mismo Destino", "Pulso Umbrío"],
  documentador: ["Tinieblas", "Mal de Ojo"],
  devops: ["Fuego Fatuo", "Bomba Lodo"],
  orquestador: ["Mismo Destino", "Hipnosis", "Maldición"],
};

export const attackFor = (role) => {
  const list = ATTACKS[role] ?? ATTACKS.generalista;
  return list[Math.floor(Math.random() * list.length)];
};
