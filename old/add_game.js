// ============================================================================
// GAME MANAGER - Herramienta para gestionar juegos
// ============================================================================
//
// CÓMO USAR:
// 1. Abrí la terminal en la carpeta del proyecto
// 2. Ejecutá: node add_game.js
// 3. Seguí las instrucciones en pantalla
//
// ============================================================================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Ruta al archivo games.js
const GAMES_FILE = path.join(__dirname, 'beta', 'assets', 'js', 'games.js');

// Colores para la consola
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m'
};

// Interfaz de readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ============================================================================
// UTILIDADES
// ============================================================================

function clear() {
    console.clear();
}

function linea(char = '─', len = 60) {
    return char.repeat(len);
}

function titulo(text) {
    const padding = Math.floor((56 - text.length) / 2);
    console.log(`\n${c.cyan}╔${linea('═', 58)}╗${c.reset}`);
    console.log(`${c.cyan}║${' '.repeat(padding)}${c.bold}${text}${c.reset}${c.cyan}${' '.repeat(58 - padding - text.length)}║${c.reset}`);
    console.log(`${c.cyan}╚${linea('═', 58)}╝${c.reset}\n`);
}

function subtitulo(text) {
    console.log(`\n${c.yellow}── ${text} ${linea('─', 50 - text.length)}${c.reset}\n`);
}

function exito(text) {
    console.log(`${c.green}✓ ${text}${c.reset}`);
}

function error(text) {
    console.log(`${c.red}✗ ${text}${c.reset}`);
}

function info(text) {
    console.log(`${c.dim}  ${text}${c.reset}`);
}

async function preguntar(pregunta, valorActual = '', obligatorio = true) {
    const actual = valorActual ? ` ${c.dim}[${valorActual}]${c.reset}` : '';
    const opcional = !obligatorio ? ` ${c.dim}(opcional)${c.reset}` : '';

    return new Promise((resolve) => {
        rl.question(`${c.cyan}${pregunta}${actual}${opcional}${c.reset}\n> `, (respuesta) => {
            const valor = respuesta.trim() || valorActual;
            if (obligatorio && !valor) {
                error('Este campo es obligatorio');
                resolve(preguntar(pregunta, valorActual, obligatorio));
            } else {
                resolve(valor);
            }
        });
    });
}

async function seleccionar(pregunta, opciones) {
    console.log(`\n${c.cyan}${pregunta}${c.reset}\n`);
    opciones.forEach((op, i) => {
        console.log(`  ${c.yellow}${i + 1}.${c.reset} ${op}`);
    });

    return new Promise((resolve) => {
        rl.question(`\n${c.dim}Selecciona (1-${opciones.length}):${c.reset} `, (respuesta) => {
            const num = parseInt(respuesta);
            if (num >= 1 && num <= opciones.length) {
                resolve(num);
            } else {
                error('Opción inválida');
                resolve(seleccionar(pregunta, opciones));
            }
        });
    });
}

async function confirmar(pregunta) {
    return new Promise((resolve) => {
        rl.question(`${c.magenta}${pregunta} ${c.dim}(s/n)${c.reset} `, (respuesta) => {
            resolve(['s', 'si', 'y', 'yes'].includes(respuesta.toLowerCase()));
        });
    });
}

// ============================================================================
// CARGAR/GUARDAR JUEGOS
// ============================================================================

function cargarJuegos() {
    try {
        const contenido = fs.readFileSync(GAMES_FILE, 'utf8');
        // Extraer el array de gamesData
        const match = contenido.match(/const gamesData = \[([\s\S]*)\];/);
        if (!match) throw new Error('No se encontró gamesData');

        // Evaluar el array (cuidado: solo para uso local)
        const arrayStr = '[' + match[1] + ']';
        return eval(arrayStr);
    } catch (err) {
        error(`Error cargando juegos: ${err.message}`);
        return [];
    }
}

function guardarJuegos(juegos) {
    try {
        const contenidoJuegos = juegos.map(j =>
            '    ' + JSON.stringify(j, null, 4).split('\n').join('\n    ')
        ).join(',\n');

        const nuevoContenido = `const gamesData = [\n${contenidoJuegos}\n];\n`;
        fs.writeFileSync(GAMES_FILE, nuevoContenido);
        return true;
    } catch (err) {
        error(`Error guardando: ${err.message}`);
        return false;
    }
}

// ============================================================================
// MENÚ PRINCIPAL
// ============================================================================

async function menuPrincipal() {
    clear();
    titulo('GAME MANAGER');

    const juegos = cargarJuegos();
    info(`${juegos.length} juegos en la base de datos\n`);

    const opcion = await seleccionar('¿Qué querés hacer?', [
        'Agregar nuevo juego',
        'Editar juego existente',
        'Ver lista de juegos',
        'Eliminar juego',
        'Salir'
    ]);

    switch (opcion) {
        case 1: await agregarJuego(); break;
        case 2: await editarJuego(); break;
        case 3: await listarJuegos(); break;
        case 4: await eliminarJuego(); break;
        case 5:
            console.log(`\n${c.cyan}¡Hasta luego!${c.reset}\n`);
            rl.close();
            return;
    }

    await menuPrincipal();
}

// ============================================================================
// AGREGAR JUEGO
// ============================================================================

async function agregarJuego() {
    clear();
    titulo('AGREGAR NUEVO JUEGO');

    subtitulo('Datos obligatorios');

    const id = await preguntar('ID (ej: lethal-company)');
    const title = await preguntar('Nombre del juego');
    const description = await preguntar('Descripción corta');
    const image = await preguntar('URL de la imagen');

    console.log(`\n${c.dim}Tags disponibles: Coop, Terror, Party, Accion, Roguelike, Supervivencia, Simulacion, Estrategia, Puzzle, Carreras, Crafteo, Sandbox${c.reset}`);
    const tagsInput = await preguntar('Tags (separados por coma)');
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    const downloadUrl = await preguntar('URL de descarga');

    subtitulo('Datos opcionales');

    const fullDescription = await preguntar('Descripción larga', '', false);
    const fixOnlineUrl = await preguntar('URL Fix Online', '', false);
    const modsUrl = await preguntar('URL de Mods', '', false);

    // Construir juego
    const nuevoJuego = { id, title, description, image, tags, downloadUrl };
    if (fullDescription) nuevoJuego.fullDescription = fullDescription;
    if (fixOnlineUrl) nuevoJuego.fixOnlineUrl = fixOnlineUrl;
    if (modsUrl) nuevoJuego.modsUrl = modsUrl;

    // Preview
    subtitulo('Preview');
    console.log(JSON.stringify(nuevoJuego, null, 2));

    if (await confirmar('\n¿Guardar este juego?')) {
        const juegos = cargarJuegos();
        juegos.push(nuevoJuego);
        if (guardarJuegos(juegos)) {
            exito(`¡"${title}" agregado exitosamente!`);
        }
    } else {
        info('Operación cancelada');
    }

    await preguntar('\nPresiona Enter para continuar...', '', false);
}

// ============================================================================
// EDITAR JUEGO
// ============================================================================

async function editarJuego() {
    clear();
    titulo('EDITAR JUEGO');

    const juegos = cargarJuegos();

    if (juegos.length === 0) {
        error('No hay juegos para editar');
        await preguntar('\nPresiona Enter para continuar...', '', false);
        return;
    }

    // Mostrar lista
    console.log(`${c.dim}Juegos disponibles:${c.reset}\n`);
    juegos.forEach((j, i) => {
        console.log(`  ${c.yellow}${(i + 1).toString().padStart(2)}.${c.reset} ${j.title} ${c.dim}(${j.id})${c.reset}`);
    });

    const busqueda = await preguntar('\nEscribí el número o parte del nombre');

    // Buscar juego
    let juegoIndex = -1;
    const num = parseInt(busqueda);
    if (!isNaN(num) && num >= 1 && num <= juegos.length) {
        juegoIndex = num - 1;
    } else {
        juegoIndex = juegos.findIndex(j =>
            j.title.toLowerCase().includes(busqueda.toLowerCase()) ||
            j.id.toLowerCase().includes(busqueda.toLowerCase())
        );
    }

    if (juegoIndex === -1) {
        error('Juego no encontrado');
        await preguntar('\nPresiona Enter para continuar...', '', false);
        return;
    }

    const juego = juegos[juegoIndex];

    clear();
    titulo(`EDITANDO: ${juego.title}`);

    // Mostrar campos actuales y permitir editar
    subtitulo('Editá los campos (Enter para mantener)');

    juego.id = await preguntar('ID', juego.id);
    juego.title = await preguntar('Título', juego.title);
    juego.description = await preguntar('Descripción', juego.description);
    juego.image = await preguntar('Imagen URL', juego.image);

    const tagsStr = (juego.tags || []).join(', ');
    const nuevosTags = await preguntar('Tags', tagsStr);
    juego.tags = nuevosTags.split(',').map(t => t.trim()).filter(t => t);

    juego.downloadUrl = await preguntar('Download URL', juego.downloadUrl);
    juego.fullDescription = await preguntar('Descripción larga', juego.fullDescription || '', false);
    juego.fixOnlineUrl = await preguntar('Fix Online URL', juego.fixOnlineUrl || '', false);
    juego.modsUrl = await preguntar('Mods URL', juego.modsUrl || '', false);

    // Limpiar campos vacíos
    if (!juego.fullDescription) delete juego.fullDescription;
    if (!juego.fixOnlineUrl) delete juego.fixOnlineUrl;
    if (!juego.modsUrl) delete juego.modsUrl;

    // Preview
    subtitulo('Preview');
    console.log(JSON.stringify(juego, null, 2));

    if (await confirmar('\n¿Guardar cambios?')) {
        juegos[juegoIndex] = juego;
        if (guardarJuegos(juegos)) {
            exito(`¡"${juego.title}" actualizado!`);
        }
    } else {
        info('Cambios descartados');
    }

    await preguntar('\nPresiona Enter para continuar...', '', false);
}

// ============================================================================
// LISTAR JUEGOS
// ============================================================================

async function listarJuegos() {
    clear();
    titulo('LISTA DE JUEGOS');

    const juegos = cargarJuegos();

    if (juegos.length === 0) {
        info('No hay juegos');
    } else {
        juegos.forEach((j, i) => {
            const tags = (j.tags || []).slice(0, 3).join(', ');
            console.log(`${c.yellow}${(i + 1).toString().padStart(2)}.${c.reset} ${c.bold}${j.title}${c.reset}`);
            console.log(`   ${c.dim}ID: ${j.id} | Tags: ${tags}${c.reset}`);
            console.log(`   ${c.dim}${j.description}${c.reset}\n`);
        });
    }

    await preguntar('\nPresiona Enter para volver...', '', false);
}

// ============================================================================
// ELIMINAR JUEGO
// ============================================================================

async function eliminarJuego() {
    clear();
    titulo('ELIMINAR JUEGO');

    const juegos = cargarJuegos();

    if (juegos.length === 0) {
        error('No hay juegos para eliminar');
        await preguntar('\nPresiona Enter para continuar...', '', false);
        return;
    }

    // Mostrar lista
    juegos.forEach((j, i) => {
        console.log(`  ${c.yellow}${(i + 1).toString().padStart(2)}.${c.reset} ${j.title}`);
    });

    const busqueda = await preguntar('\nNúmero o nombre del juego a eliminar');

    let juegoIndex = -1;
    const num = parseInt(busqueda);
    if (!isNaN(num) && num >= 1 && num <= juegos.length) {
        juegoIndex = num - 1;
    } else {
        juegoIndex = juegos.findIndex(j =>
            j.title.toLowerCase().includes(busqueda.toLowerCase())
        );
    }

    if (juegoIndex === -1) {
        error('Juego no encontrado');
        await preguntar('\nPresiona Enter para continuar...', '', false);
        return;
    }

    const juego = juegos[juegoIndex];

    console.log(`\n${c.red}¿Estás seguro de eliminar "${juego.title}"?${c.reset}`);

    if (await confirmar('Esta acción no se puede deshacer')) {
        juegos.splice(juegoIndex, 1);
        if (guardarJuegos(juegos)) {
            exito(`"${juego.title}" eliminado`);
        }
    } else {
        info('Operación cancelada');
    }

    await preguntar('\nPresiona Enter para continuar...', '', false);
}

// ============================================================================
// EJECUTAR
// ============================================================================

menuPrincipal().catch(console.error);
