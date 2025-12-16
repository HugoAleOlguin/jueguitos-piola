const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const TEMPLATE_PATH = path.join(__dirname, 'beta', 'games', '1plantilla.html');
const GAMES_JS_PATH = path.join(__dirname, 'beta', 'assets', 'js', 'games.js');
const OUTPUT_DIR = path.join(__dirname, 'beta', 'games');

// Helper to prompt user
function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

// Generate a URL-friendly slug
function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^\w\s-]/g, '') // remove non-word chars
        .replace(/\s+/g, '-')     // replace spaces with hyphens
        .trim();
}

async function main() {
    console.log("=== AGREGAR NUEVO JUEGO (BETA) ===");

    try {
        // 1. Gather Info
        const title = await ask('Título del Juego: ');
        if (!title) throw new Error("El título es obligatorio.");

        const description = await ask('Descripción Corta: ');
        const image = await ask('URL de la Imagen (Poster): ');
        const downloadUrl = await ask('Link de Descarga: ');
        const fixOnlineUrl = await ask('Link Fix Online (Opcional): ');
        const tagsInput = await ask('Etiquetas (separadas por coma, ej: Coop, Terror): ');

        const slug = generateSlug(title);
        const fileName = `${slug}.html`;
        const filePath = path.join(OUTPUT_DIR, fileName);

        console.log(`\nGenerando archivo: ${fileName}...`);

        // 2. Process HTML Template
        let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

        // Handle Optional Fix Online Button
        let fixOnlineButton = "";
        if (fixOnlineUrl && fixOnlineUrl.trim() !== "") {
            fixOnlineButton = `<a href="${fixOnlineUrl}" target="_blank" class="btn btn-primary">Fix Online</a>`;
        }

        // Replace placeholders (naive replacement based on known template strings)
        let htmlContent = template
            .replace(/Nombre del Juego/g, title) // Replace all occurrences
            .replace(/URL_DE_LA_IMAGEN/g, image || '#')
            .replace(/ENLACE_DE_DESCARGA/g, downloadUrl || '#')
            .replace(/<!-- FIX_ONLINE_PLACEHOLDER -->/g, fixOnlineButton)
            .replace(/\[Género del juego\]/g, tagsInput)
            .replace(/\[Descripción del juego\]/g, description || "")
            .replace(/\[Versión del juego\]/g, "v1.0") // Default
            // Add date
            .replace(/\[Fecha\]/g, new Date().toLocaleDateString('es-ES'));

        fs.writeFileSync(filePath, htmlContent);
        console.log(`✅ Archivo HTML creado: ${filePath}`);

        // 3. Update games.js
        console.log(`\nActualizando índice (games.js)...`);

        let jsContent = fs.readFileSync(GAMES_JS_PATH, 'utf-8');

        // Extract array content using regex to find the array brackets
        // We look for 'const gamesData = [' and the last '];'
        const startMarker = 'const gamesData = [';
        const endMarker = '];';

        const startIndex = jsContent.indexOf(startMarker);
        const lastIndex = jsContent.lastIndexOf(endMarker);

        if (startIndex === -1 || lastIndex === -1) {
            throw new Error("No se pudo encontrar la estructura 'gamesData' en games.js");
        }

        // Get the inner JSON part (careful, it might have trailing commas which JSON.parse hates, but we are appending JS objects not strictly JSON)
        // Actually, since it's a JS file, we can just insert the new object before the last bracket.

        const newEntry = {
            id: slug,
            title: title,
            description: description,
            image: image,
            url: `games/${fileName}`,
            tags: tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
        };

        // Format as a JS object string with indentation
        const newEntryString = JSON.stringify(newEntry, null, 2);

        // Insert before the last closing bracket
        // We add a comma if it's not the first element (it likely isn't)
        const insertionPoint = lastIndex;
        const prefix = jsContent.substring(0, insertionPoint).trimEnd();
        const suffix = jsContent.substring(lastIndex);

        // Check if we need a preceeding comma
        const needsComma = !prefix.trim().endsWith('[');

        const newContent = `${prefix}${needsComma ? ',' : ''}\n  ${newEntryString}\n${suffix}`;

        fs.writeFileSync(GAMES_JS_PATH, newContent);
        console.log(`✅ Índice actualizado correctamente.`);

        console.log(`\n🎉 PROCESO COMPLETADO! El juego "${title}" ha sido agregado.`);

    } catch (error) {
        console.error("\n❌ Error:", error.message);
    } finally {
        rl.close();
    }
}

main();
