// Gengar (#94) sprites. Nothing ships with the mod: on first use it downloads PMDCollab's
// SpriteCollab sheets with curl and cuts them into looping GIFs with ImageMagick, into
// ~/.config/herdr-app/data/gengar-office/. Written for this mod; technique after reading
// how other Herdr sprite mods do it.
import { exec, appHome } from "herdr";
import * as fs from "fs/promises";

export const DATA_REL = "data/gengar-office";
const DATA = `${appHome()}/${DATA_REL}`;
const PMD = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0094";
// Skins: folder inside the Gengar sprite directory (form, then shiny flag).
export const SKINS = { normal: "", shiny: "/0000/0001", mega: "/0001", "mega-shiny": "/0001/0001" };
const VERSION = 2; // bump when the GIF recipe changes

// PMD sheets: one row per facing (0 = down, toward the viewer). Gengar faces us for both.
const CUTS = [
  ["idle", "Idle", 0],
  ["sleep", "Sleep", 0],
];

let tools = null;
export async function imageMagick() {
  if (tools !== null) return tools;
  const r = await exec("magick", ["-version"]).catch(() => null);
  tools = r?.code === 0;
  return tools;
}

async function im(args) {
  const r = await exec("magick", args);
  if (r.code !== 0) throw new Error(r.stderr.trim() || "magick failed");
  return r.stdout.trim();
}

async function curl(pairs) {
  const args = ["-sfL", "--retry", "2", "--connect-timeout", "10"];
  for (const [file, url] of pairs) args.push("-o", file, url);
  const r = await exec("curl", args);
  if (r.code !== 0) throw new Error(`download failed (curl ${r.code})`);
}

function parseAnims(xml) {
  const anims = {};
  for (const m of xml.matchAll(/<Anim>([\s\S]*?)<\/Anim>/g)) {
    const body = m[1];
    const get = (tag) => body.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1];
    const name = get("Name");
    if (!name) continue;
    anims[name] = {
      name,
      copyOf: get("CopyOf") ?? null,
      fw: Number(get("FrameWidth")),
      fh: Number(get("FrameHeight")),
      durations: [...body.matchAll(/<Duration>(\d+)<\/Duration>/g)].map((d) => Number(d[1])),
    };
  }
  return anims;
}

// "Idle is a copy of Walk": follow CopyOf to the animation that owns a sheet.
function resolve(anims, name) {
  let a = anims[name];
  for (let hops = 0; a?.copyOf && hops < 4; hops++) a = anims[a.copyOf];
  return a && a.fw > 0 && a.fh > 0 ? a : null;
}

// One row of a sheet as a looping GIF, pixel-doubled. Returns its size and the box its
// visible pixels fill (the feet are the bottom of that box).
async function cut(sheet, anim, row, scale, out) {
  const [w, h] = (await im(["identify", "-format", "%w %h", sheet])).split(" ").map(Number);
  const rows = Math.max(1, Math.floor(h / anim.fh));
  const cols = Math.max(1, Math.floor(w / anim.fw));
  const y = Math.min(row, rows - 1) * anim.fh;
  const n = Math.min(cols, anim.durations.length || cols);
  // Durations are game frames (1/60 s); GIF delays are 1/100 s.
  const cs = (anim.durations.length ? anim.durations : [10]).slice(0, n).map((d) => Math.max(2, Math.round((d * 100) / 60)));
  const delay = cs.slice(0, -1).map((c, i) => `t==${i}?${c}:`).join("") + cs[cs.length - 1];
  await im([
    sheet, "-crop", `${n * anim.fw}x${anim.fh}+0+${y}`, "+repage",
    "-crop", `${anim.fw}x${anim.fh}`, "+repage",
    "-scale", `${scale * 100}%`,
    "-set", "delay", `%[fx:${delay}]`, "-set", "dispose", "Background", "-loop", "0", out,
  ]);
  const box = await im([out, "-coalesce", "-background", "none", "-flatten", "-format", "%@", "info:"]);
  const m = box.match(/(\d+)x(\d+)\+(-?\d+)\+(-?\d+)/);
  const fw = anim.fw * scale;
  const fh = anim.fh * scale;
  const bb = m ? { x: +m[3], y: +m[4], w: +m[1], h: +m[2] } : { x: 0, y: 0, w: fw, h: fh };
  return { w: fw, h: fh, box: bb };
}

// Builds (once) and returns { idle, sleep }, each { path, w, h, box }. meta.json is written last.
export async function loadGengar(skin = "normal") {
  const BASE = `${PMD}${SKINS[skin] ?? ""}`;
  const dir = `${DATA}/sprites/${skin}`;
  const metaFile = `${dir}/meta.json`;
  if (await fs.exists(metaFile).catch(() => false)) {
    try {
      const meta = JSON.parse(await fs.readFile(metaFile, "utf8"));
      if (meta.version === VERSION) return meta;
    } catch {}
  }
  await fs.mkdir(dir, { recursive: true });
  await curl([[`${dir}/AnimData.xml`, `${BASE}/AnimData.xml`]]);
  const anims = parseAnims(await fs.readFile(`${dir}/AnimData.xml`, "utf8"));
  const walk = resolve(anims, "Walk");
  const idle = resolve(anims, "Idle") ?? walk;
  if (!idle) throw new Error("no idle animation");
  const sleep = resolve(anims, "Sleep") ?? idle;
  const pick = { Idle: idle, Sleep: sleep };
  const sheets = [...new Set(Object.values(pick).map((a) => a.name))];
  await curl(sheets.map((n) => [`${dir}/${n}.png`, `${BASE}/${n}-Anim.png`]));
  const scale = idle.fh > 64 ? 1 : 2;
  const meta = { version: VERSION, scale };
  for (const [key, which, row] of CUTS) {
    const anim = pick[which];
    const file = `${key}.gif`;
    const size = await cut(`${dir}/${anim.name}.png`, anim, row, scale, `${dir}/${file}`);
    meta[key] = { path: `${DATA_REL}/sprites/${skin}/${file}`, ...size };
  }
  await fs.writeFile(metaFile, JSON.stringify(meta));
  return meta;
}
