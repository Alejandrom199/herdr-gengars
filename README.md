<div align="center">

# 👻 Herdr Gengars

**Una oficina virtual donde cada agente de Claude Code es un Gengar.**
Los roles trabajan en sus escritorios, descansan en el sillón y se ponen su accesorio.

![Herdr](https://img.shields.io/badge/Herdr-mod-8b5cf6?style=for-the-badge&labelColor=2e1065)
![Claude Code](https://img.shields.io/badge/Claude_Code-hooks-a78bfa?style=for-the-badge&labelColor=2e1065)
![Gengar](https://img.shields.io/badge/Pok%C3%A9mon-%2394-7c3aed?style=for-the-badge&labelColor=2e1065)
![Roles](https://img.shields.io/badge/roles-13%20%2B%20orquestador-c084fc?style=for-the-badge&labelColor=2e1065)

<br>

<img src="docs/sprites/normal-idle.gif" height="110" alt="Gengar normal">
<img src="docs/sprites/shiny-idle.gif" height="110" alt="Gengar shiny">
<img src="docs/sprites/mega-idle.gif" height="110" alt="Mega Gengar">
<img src="docs/sprites/mega-shiny-idle.gif" height="110" alt="Mega Gengar shiny">

<sub>trabajando</sub>

<img src="docs/sprites/normal-sleep.gif" height="80" alt="Gengar durmiendo">
<img src="docs/sprites/shiny-sleep.gif" height="80" alt="Gengar shiny durmiendo">
<img src="docs/sprites/mega-sleep.gif" height="80" alt="Mega Gengar durmiendo">
<img src="docs/sprites/mega-shiny-sleep.gif" height="80" alt="Mega Gengar shiny durmiendo">

<sub>zZz... descansando en el sillón</sub>

</div>

---

## 💜 Qué es

Mi configuración de Herdr y Claude Code para ver a los agentes trabajar:

- 🖥️ **Oficina** (`gengar-office`): cada rol activo se sienta en un escritorio con el monitor encendido y usa un ataque según su rol ("Gengar Backend usó Puño Sombra").
- 🛋️ **Sillón**: los roles que no trabajan duermen ahí. El sillón crece con cada dos dormidos.
- 👥 **Panel Equipo** (`equipo-gengar`): una columna con los 13 roles. El que trabaja se despierta.
- 🎩 **Accesorios**: cada rol lleva el suyo (gorro, lupa, casco, escudo...) y el Orquestador una batuta.
- 🤖 **13 agentes** de Claude Code con sus instrucciones y dos ganchos que avisan a Herdr cuándo trabaja cada uno.

## ⚙️ Cómo funciona

```
Claude Code lanza un agente
        │  (hook PreToolUse / SubagentStop)
        ▼
equipo-estado.js  ──►  ~/.config/herdr-app/data/equipo-gengar/estado.json
                                   │  lo lee cada 0,7 s
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
          panel "Equipo"                      oficina (escritorios)
```

## 🎭 Los roles

| Rol | Accesorio | Dónde | Skin |
|---|:---:|---|---|
| Analista de negocios | <img src="herdr/mods/equipo-gengar/art/role-chart.svg" height="26"> gráfico | costado | shiny |
| Innovación | <img src="herdr/mods/equipo-gengar/art/role-bulb.svg" height="26"> bombilla | cabeza | mega |
| PM | <img src="herdr/mods/equipo-gengar/art/role-clipboard.svg" height="26"> portapapeles | costado | normal |
| UI/UX | <img src="herdr/mods/equipo-gengar/art/role-beret.svg" height="20"> boina | cabeza | mega shiny |
| Arquitecto | <img src="herdr/mods/equipo-gengar/art/role-mortarboard.svg" height="22"> birrete | cabeza | mega |
| DBA | <img src="herdr/mods/equipo-gengar/art/role-db.svg" height="26"> base de datos | costado | mega shiny |
| Backend | <img src="herdr/mods/equipo-gengar/art/role-helmet.svg" height="22"> casco | cabeza | normal |
| Frontend | <img src="herdr/mods/equipo-gengar/art/role-code.svg" height="22"> código | costado | shiny |
| QA | <img src="herdr/mods/equipo-gengar/art/role-glasses.svg" height="16"> gafas | cara | normal |
| Seguridad | <img src="herdr/mods/equipo-gengar/art/role-shield.svg" height="26"> escudo | costado | mega shiny |
| Líder técnico | <img src="herdr/mods/equipo-gengar/art/role-crown.svg" height="22"> corona | cabeza | shiny |
| Documentador | <img src="herdr/mods/equipo-gengar/art/role-notebook.svg" height="26"> cuaderno | costado | shiny |
| DevOps | <img src="herdr/mods/equipo-gengar/art/role-rocket.svg" height="26"> cohete | costado | mega |
| Orquestador | <img src="herdr/mods/gengar-office/art/role-baton.svg" height="26"> batuta | costado | la de su terminal |

## 📦 Qué hay en el repositorio

```
claude/
├── CLAUDE.md          preferencias (agentes en paralelo y en conjunto)
├── settings.json      hooks de Claude Code
├── agents/            los 13 roles
└── hooks/             equipo-estado.js · nombrar-orquestador.js
herdr/
├── mods/gengar-office/   la oficina
├── mods/equipo-gengar/   el panel Equipo
├── layouts/main-gengar.json
└── themes/               gengar · gengar-shiny · gengar-mega
docs/sprites/             GIFs de este README
```

## 🚀 Instalación

Necesitas Herdr, [Claude Code](https://claude.com/claude-code), `curl` e [ImageMagick](https://imagemagick.org) (`magick`).

1. Clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/herdr-gengars.git
   ```
2. Copia las carpetas:
   - `herdr/*` → `~/.config/herdr-app/`
   - `claude/agents`, `claude/hooks` y `claude/CLAUDE.md` → `~/.claude/`
3. **Ajusta `settings.json`.** Los ganchos apuntan a `C:/Users/smaldonado/.claude/hooks/...`: cambia esa ruta por la de tu usuario. Si ya tienes un `settings.json`, fusiona solo el bloque `hooks` en vez de sobrescribirlo.
4. Comprueba que el mod carga:
   ```bash
   herdr-app check mods/gengar-office
   ```
5. Abre Herdr y cambia al layout `main-gengar`.

La primera vez, la oficina descarga los sprites y los corta con ImageMagick. Si ves el aviso "Install ImageMagick", instálalo y reinicia Herdr.

## 🙏 Créditos

- Sprites de Gengar: [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab) (`sprite/0094`), arte hecho por fans. Los GIFs de `docs/` son recortes de esas hojas.
- Pokémon y Gengar son marcas de Nintendo, Game Freak y Creatures Inc. Este es un proyecto personal de fans, sin relación con ellos ni con Herdr.
- Si haces público este repositorio, revisa antes la licencia de PMDCollab para los sprites de `docs/`.

<div align="center">

<sub>👻 hecho con mucho cariño y un poco de maldición</sub>

</div>
