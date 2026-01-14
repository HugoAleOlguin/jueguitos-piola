// ============================================================================
// ADD_GAME.JS - Herramienta para agregar juegos fácilmente
// ============================================================================
//
// Este script te ayuda a agregar nuevos juegos a games.js de forma interactiva.
//
// CÓMO USAR:
// 1. Abrí la terminal en la carpeta del proyecto
// 2. Ejecutá: node add_game.js
// 3. Seguí las instrucciones en pantalla
//
// NOTA: Este archivo está en .gitignore, es solo una herramienta local.
//
// ============================================================================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Ruta al archivo games.js
const GAMES_FILE = path.join(__dirname, 'beta', 'assets', 'js', 'games.js');

// Colores para la consola
const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Interfaz de readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para hacer preguntas
function preguntar(pregunta, obligatorio = true) {
    return new Promise((resolve) => {
        const prefix = obligatorio
            ? `${colors.cyan}${pregunta}${colors.reset}`
            : `${colors.yellow}${pregunta} (opcional, Enter para omitir)${colors.reset}`;

        rl.question(`${prefix}\n> `, (respuesta) => {
            if (obligatorio && !respuesta.trim()) {
                console.log(`${colors.red}⚠️  Este campo es obligatorio${colors.reset}`);
                resolve(preguntar(pregunta, obligatorio));
            } else {
                resolve(respuesta.trim());
            }
        });
    });
}

// Función para confirmar
function confirmar(pregunta) {
    return new Promise((resolve) => {
        rl.question(`${colors.magenta}${pregunta} (s/n)${colors.reset} `, (respuesta) => {
            resolve(respuesta.toLowerCase() === 's' || respuesta.toLowerCase() === 'si');
        });
    });
}

// Función principal
async function main() {
    console.log(`
${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════════╗
║           🎮 AGREGAR NUEVO JUEGO A JUEGUITOS PIOLA          ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

    // Recopilar datos obligatorios
    console.log(`${colors.green}📝 Datos obligatorios:${colors.reset}\n`);

    const id = await preguntar('ID del juego (sin espacios, minúsculas, ej: "lethal-company"):');
    const title = await preguntar('Nombre del juego:');
    const description = await preguntar('Descripción corta (para la tarjeta):');
    const image = await preguntar('URL de la imagen:');

    console.log(`\n${colors.yellow}Tags disponibles: Coop, Terror, Party, Accion, Roguelike, Supervivencia, Simulacion, Estrategia, Puzzle, Carreras, Crafteo, Sandbox${colors.reset}`);
    const tagsInput = await preguntar('Tags (separados por coma, ej: "Coop, Terror"):');
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    const downloadUrl = await preguntar('URL de descarga:');

    // Datos opcionales
    console.log(`\n${colors.green}📝 Datos opcionales:${colors.reset}\n`);

    const fullDescription = await preguntar('Descripción larga (para la página de detalle):', false);
    const fixOnlineUrl = await preguntar('URL de Fix Online:', false);
    const modsUrl = await preguntar('URL de Mods:', false);

    // Specs personalizadas
    const customSpecs = await confirmar('\n¿Querés agregar specs personalizadas?');
    let specs = null;

    if (customSpecs) {
        console.log(`\n${colors.yellow}Dejá vacío para usar el valor por defecto${colors.reset}\n`);
        const os = await preguntar('Sistema operativo:', false);
        const cpu = await preguntar('Procesador:', false);
        const ram = await preguntar('Memoria RAM:', false);
        const gpu = await preguntar('Gráficos:', false);

        if (os || cpu || ram || gpu) {
            specs = {};
            if (os) specs.os = os;
            if (cpu) specs.cpu = cpu;
            if (ram) specs.ram = ram;
            if (gpu) specs.gpu = gpu;
        }
    }

    // Opciones especiales
    const externalLink = await confirmar('\n¿Es un link externo (como RadminVPN)?');
    const customPage = await confirmar('¿Tiene una página personalizada (como schedule.html)?');

    let customUrl = '';
    if (customPage) {
        customUrl = await preguntar('URL de la página personalizada (ej: "games/schedule.html"):');
    }

    // Construir el objeto del juego
    const nuevoJuego = {
        id,
        title,
        description,
        image,
        tags,
        downloadUrl
    };

    if (fullDescription) nuevoJuego.fullDescription = fullDescription;
    if (fixOnlineUrl) nuevoJuego.fixOnlineUrl = fixOnlineUrl;
    if (modsUrl) nuevoJuego.modsUrl = modsUrl;
    if (specs) nuevoJuego.specs = specs;
    if (externalLink) nuevoJuego.externalLink = true;
    if (customPage) {
        nuevoJuego.customPage = true;
        nuevoJuego.customUrl = customUrl;
    }

    // Mostrar preview
    console.log(`
${colors.bold}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}
${colors.bold}📋 PREVIEW DEL JUEGO:${colors.reset}
${colors.bold}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}
`);
    console.log(JSON.stringify(nuevoJuego, null, 4));
    console.log(`
${colors.bold}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}
`);

    // Confirmar
    const confirmarAgregar = await confirmar('¿Agregar este juego a games.js?');

    if (!confirmarAgregar) {
        console.log(`${colors.yellow}❌ Operación cancelada${colors.reset}`);
        rl.close();
        return;
    }

    // Leer el archivo games.js
    try {
        let contenido = fs.readFileSync(GAMES_FILE, 'utf8');

        // Buscar el último objeto del array (antes del ];)
        const insertIndex = contenido.lastIndexOf('}');

        if (insertIndex === -1) {
            throw new Error('No se pudo encontrar dónde insertar el juego');
        }

        // Formatear el nuevo juego
        const nuevoJuegoStr = ',\n    ' + JSON.stringify(nuevoJuego, null, 4)
            .split('\n')
            .map((line, i) => i === 0 ? line : '    ' + line)
            .join('\n');

        // Insertar el nuevo juego
        contenido = contenido.slice(0, insertIndex + 1) + nuevoJuegoStr + contenido.slice(insertIndex + 1);

        // Guardar
        fs.writeFileSync(GAMES_FILE, contenido);

        console.log(`
${colors.bold}${colors.green}✅ ¡Juego agregado exitosamente!${colors.reset}

${colors.cyan}Ahora podés:${colors.reset}
1. Verificar en: file:///${GAMES_FILE.replace(/\\/g, '/')}
2. Probar localmente abriendo beta/index.html
3. Hacer commit y push para publicar

${colors.yellow}Comando sugerido:${colors.reset}
git add -A && git commit -m "✨ Agregado ${title}" && git push
`);

    } catch (error) {
        console.log(`${colors.red}❌ Error al guardar: ${error.message}${colors.reset}`);
        console.log(`\n${colors.yellow}Copiá esto y pegalo manualmente en games.js:${colors.reset}\n`);
        console.log(JSON.stringify(nuevoJuego, null, 4));
    }

    rl.close();
}

// Ejecutar
main().catch(console.error);
