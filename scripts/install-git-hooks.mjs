// Copia los hooks versionados de .githooks/ a .git/hooks/.
//
// POR QUE COPIAR Y NO USAR core.hooksPath
// Apuntar core.hooksPath a .githooks/ seria mas limpio, pero DESACTIVA .git/hooks/ por
// completo — y ahi vive el pre-commit que instala `ai-framework-agent install-hooks` para
// mantener fresca la memoria del agente. Cambiar el mecanismo global romperia ese hook sin
// avisar. Copiar deja los dos conviviendo.
//
// POR QUE LOS HOOKS ESTAN VERSIONADOS
// Un hook en .git/hooks/ no se revisa en un pull request ni llega a nadie mas. Si el hook es
// una regla del equipo —y "no empujes directo a main" lo es— tiene que poder leerse y
// discutirse en el repositorio.
//
//   npm run hooks:install
//   npm run hooks:install -- --uninstall
import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const origen = path.join(raiz, ".githooks");
const destino = path.join(raiz, ".git", "hooks");
const MARCA = "# gestionado por scripts/install-git-hooks.mjs";
const desinstalar = process.argv.includes("--uninstall");

if (!fs.existsSync(path.join(raiz, ".git"))) {
  console.error("Error: no hay repositorio git aqui.");
  process.exit(1);
}
if (!fs.existsSync(origen)) {
  console.error(`Error: no existe ${origen}.`);
  process.exit(1);
}

fs.mkdirSync(destino, { recursive: true });
let tocados = 0;

for (const nombre of fs.readdirSync(origen)) {
  const rutaOrigen = path.join(origen, nombre);
  const rutaDestino = path.join(destino, nombre);
  if (!fs.statSync(rutaOrigen).isFile()) continue;

  // No se pisa un hook que no gestionamos: puede ser trabajo manual de alguien.
  if (fs.existsSync(rutaDestino)) {
    const actual = fs.readFileSync(rutaDestino, "utf8");
    if (!actual.includes(MARCA)) {
      console.error(`Aviso: ${nombre} ya existe y no lo gestiona este script. No se toca.`);
      continue;
    }
  }

  if (desinstalar) {
    if (fs.existsSync(rutaDestino)) {
      fs.unlinkSync(rutaDestino);
      console.log(`  quitado  ${nombre}`);
      tocados++;
    }
    continue;
  }

  const cuerpo = fs.readFileSync(rutaOrigen, "utf8");
  const conMarca = cuerpo.replace(/^#!.*\n/, (linea) => `${linea}${MARCA}\n`);
  fs.writeFileSync(rutaDestino, conMarca);
  // En Windows el bit de ejecucion no aplica; en Linux/macOS si hace falta.
  try { fs.chmodSync(rutaDestino, 0o755); } catch { /* sin permisos: git bash lo ejecuta igual */ }
  console.log(`  instalado ${nombre}`);
  tocados++;
}

console.log(tocados === 0 ? "Nada que hacer." : `OK. ${tocados} hook(s) ${desinstalar ? "quitados" : "instalados"}.`);
