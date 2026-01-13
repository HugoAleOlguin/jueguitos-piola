// ============================================================================
// GAMES.JS - BASE DE DATOS DE JUEGOS
// ============================================================================
// 
// Este archivo contiene TODOS los datos de los juegos del sitio.
// Para agregar un nuevo juego, solo necesitás agregar un objeto nuevo aquí.
// La página de detalle se genera automáticamente usando estos datos.
//
// ============================================================================

const gamesData = [
  // =========================================================================
  // UTILIDADES (no son juegos, pero están en el listado)
  // =========================================================================
  {
    // ID único del juego (debe coincidir con el que se usa en la URL)
    id: "simular-lan",

    // Nombre que se muestra en la tarjeta y página de detalle
    title: "Simular Lan",

    // Descripción corta para la tarjeta del hub
    description: "RadminVPN",

    // Descripción larga para la página de detalle (opcional)
    fullDescription: "Herramienta para simular una red LAN y jugar con amigos online como si estuvieran en la misma red local.",

    // URL de la imagen de portada
    image: "https://www.radmin-vpn.com/images/gallery_main_page/es/main_dark.png",

    // Tags/etiquetas para filtrar y mostrar
    tags: ["Utilidad"],

    // URL de descarga principal
    downloadUrl: "https://www.radmin-vpn.com/es/",

    // URL para fix online (opcional - si no tiene, dejarlo vacío o no incluirlo)
    fixOnlineUrl: "",

    // URL para mods (opcional)
    modsUrl: "",

    // Si es true, abre el downloadUrl directamente en lugar de ir a la página de detalle
    // Útil para links externos como RadminVPN
    externalLink: true
  },

  // =========================================================================
  // JUEGOS COOP
  // =========================================================================
  {
    id: "content-warning",
    title: "Content Warning",
    description: "quien graba?.",
    fullDescription: "Juego cooperativo de terror donde grabas contenido paranormal con tus amigos.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2881650/header.jpg?t=1736717925",
    tags: ["Coop", "Terror"],
    downloadUrl: "https://www.mediafire.com/file/2p7gz7bzxs1o48k",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "lethal-company",
    title: "Lethal Company",
    description: "Con mods es un juegazo.",
    fullDescription: "Explora lunas abandonadas y recolecta chatarra para cumplir la cuota de la Compañía. ¡No mueras!",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1966720/header.jpg?t=1723894859",
    tags: ["Coop", "Terror"],
    downloadUrl: "https://www.mediafire.com/file/jh2f14k4uava6nv",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "halo",
    title: "Halo 1 Online",
    description: "7 palabras.",
    fullDescription: "El clásico Halo Combat Evolved con multiplayer online.",
    image: "https://pressover.news/wp-content/uploads/2021/11/Halo-CE-1.jpg",
    tags: ["Accion", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/mx83lirxptvfzw6/HALO_CE_v.1.10_%5BDarkMaster%5D.rar/file",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "satisfactory",
    title: "Satisfactory",
    description: "buen juego, supongo.",
    fullDescription: "Construye fábricas masivas en un planeta alienígena con tus amigos.",
    image: "https://cdn1.epicgames.com/offer/crab/EGS_Satisfactory_CoffeeStainStudios_S1_2560x1440-4d68c4229e649463c317109338a53a15",
    tags: ["Supervivencia", "Simulacion", "Crafteo"],
    downloadUrl: "https://www.mediafire.com/file/satisfactory",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "AoE",
    title: "Age Of Empires 2",
    description: "No lo se jugar.",
    fullDescription: "El clásico juego de estrategia en tiempo real.",
    image: "https://i.ytimg.com/vi/vkhNdN0Az9Y/maxresdefault.jpg",
    tags: ["Estrategia"],
    downloadUrl: "https://www.mediafire.com/file/aoe2",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "isaac",
    title: "Isaac",
    description: "facha.",
    fullDescription: "The Binding of Isaac - Roguelike de acción con generación procedural.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/113200/header.jpg?t=1643480517",
    tags: ["Roguelike"],
    downloadUrl: "https://www.mediafire.com/file/isaac",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "forest",
    title: "The Forest",
    description: "El agus deforesta medio mapa en 3 minutos.",
    fullDescription: "Sobrevive en una isla habitada por caníbales mutantes. Solo o con amigos.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/242760/header.jpg?t=1699381053",
    tags: ["Supervivencia", "Terror", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/forest",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "gang-beast",
    title: "Gang Beast",
    description: "Juego piola.",
    fullDescription: "Pelea de gelatinas multijugador. Muy divertido con amigos.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/285900/header.jpg?t=1732109683",
    tags: ["Coop", "Party"],
    downloadUrl: "https://www.mediafire.com/file/gangbeast",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "initial",
    title: "Initial Unity",
    description: "Gas Gas Gas.",
    fullDescription: "Juego de carreras estilo Initial D con drift.",
    image: "https://media.tenor.com/ceRw7O2NH90AAAAM/022106-tofushop.gif",
    tags: ["Carreras", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/initial",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "repo",
    title: "R.E.P.O",
    description: "bruh.",
    fullDescription: "Juego cooperativo de simulación y terror.",
    image: "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/3241660/fda868129a96b58493b4935c7e2c3390b4ebb108/capsule_616x353.jpg?t=1740578354",
    tags: ["Simulacion", "Terror", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/repo",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "deadisland",
    title: "Dead Island",
    description: "goty.",
    fullDescription: "Mata zombies en una isla tropical con tus amigos.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjPFIaDRflSYj5EOHkOft5MswoVOoEV2O0IWDf8O5VnVemYyOsIzDRbQTnpjf-_qOZRmQ&usqp=CAU",
    tags: ["Accion", "Terror", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/deadisland",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "liars",
    title: "Liars Bar",
    description: "siuu.",
    fullDescription: "Juego de mentiras y engaños con amigos.",
    image: "https://media.tenor.com/GJBocHhyMIkAAAAM/pig-liar%27s-bar.gif",
    tags: ["Coop", "Party"],
    downloadUrl: "https://www.mediafire.com/file/liars",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "underplus",
    title: "Undertale Plus",
    description: "Todavia no sale pero puede estar bueno.",
    fullDescription: "Fan game de Undertale con contenido adicional.",
    image: "https://m.gjcdn.net/game-header/1900/895064-ll-grwzcdzh-v4.webp",
    tags: ["Info"],
    downloadUrl: "https://gamejolt.com/p/undertale-plus-devlog-11-colored-sprites-plus-remixes-and-more-twhkyipq",
    fixOnlineUrl: "",
    modsUrl: "",
    externalLink: true,
  },
  {
    // CASO ESPECIAL: Schedule tiene contenido custom (tabla de mods)
    // Por eso usamos customPage: true para mantener su archivo HTML separado
    id: "schedule",
    title: "Schedule (UPDATE v0.4.1f12)",
    description: "Jesse, eso no es azucar.",
    fullDescription: "Simulador de negocios... especiales.",
    image: "https://pivigames.blog/wp-content/uploads/2025/03/Schedule-1-Juego-PC-Pivigames.jpg",
    tags: ["Simulacion", "Coop"],
    downloadUrl: "https://store-eu-gra-2.gofile.io/download/web/cef62d41-b2aa-4d83-9518-c584d85a2b85/Schedule.I.v0.4.1f12-OFME.rar",
    fixOnlineUrl: "https://store4.gofile.io/download/web/d2e11e7b-05ea-49a1-85bd-1480d14e8c5e/ScheduleI_Fix_Repair_Steam_V2_Generic.rar",
    modsUrl: "",
    // Esta página tiene contenido especial (tabla de mods), así que usa su propio HTML
    customPage: true,
    customUrl: "games/schedule.html"
  },
  {
    id: "fastfood",
    title: "Fast food Simulator",
    description: "A cocinar pibes.",
    fullDescription: "Simulador de comida rápida cooperativo.",
    image: "https://pivigames.blog/wp-content/uploads/2024/12/Fast-Food-Simulator-Pivigames.jpg",
    tags: ["Simulacion", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/fastfood",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "lfd",
    title: "Left 4 Dead",
    description: "uy.",
    fullDescription: "El clásico shooter cooperativo de zombies.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe6TrxL9Yh_CBDSv91IiywZRLYk5CR8sBdrg&s",
    tags: ["Accion", "Terror", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/lfd",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "agus",
    title: "Jueguito",
    description: "siuu.",
    fullDescription: "Un jueguito.",
    image: "https://www.guvi.in/blog/wp-content/uploads/2024/03/Puzzle-Game.webp",
    tags: ["Puzzle"],
    downloadUrl: "https://www.mediafire.com/file/agus",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "lfd2",
    title: "Left 4 Dead 2",
    description: "ojo al piojo.",
    fullDescription: "Secuela del clásico shooter cooperativo de zombies.",
    image: "https://pivigames.blog/wp-content/uploads/2020/09/Left-4-Dead-2-The-last-Stand-2020-PiviGames.jpg",
    tags: ["Accion", "Terror", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/lfd2",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "minecraft",
    title: "Minecraft",
    description: "mundos de minecraft.",
    fullDescription: "El juego de construcción y supervivencia más famoso del mundo.",
    image: "https://i.ytimg.com/vi/X-z288TTcf0/sddefault.jpg",
    tags: ["Supervivencia", "Sandbox", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/minecraft",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "chained",
    title: "Chained Together",
    description: "te voy a cagar a trompadas agus.",
    fullDescription: "Juego de parkour cooperativo donde estás encadenado a tus amigos.",
    image: "https://pivigames.blog/wp-content/uploads/2024/07/Chained-Together-Pivigames.jpg",
    tags: ["Coop", "Party"],
    downloadUrl: "https://www.mediafire.com/file/chained",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "cc",
    title: "Castle Crashers",
    description: "uff.",
    fullDescription: "Beat 'em up cooperativo con estilo cartoon.",
    image: "https://pivigames.blog/wp-content/uploads/2019/01/Descargar-Castle-Crashers-Ultima-Version-PC-Gratis.jpg",
    tags: ["Coop", "Accion"],
    downloadUrl: "https://www.mediafire.com/file/cc",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "peak",
    title: "Peak",
    description: "otro juego de parkour alm.",
    fullDescription: "Juego de parkour cooperativo.",
    image: "https://pivigames.blog/wp-content/uploads/2025/06/PEAK-Pivigames.webp",
    tags: ["Coop", "Parkour"],
    downloadUrl: "https://www.mediafire.com/file/peak",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "border2",
    title: "Borderlands 2",
    description: "GOTY.",
    fullDescription: "Looter shooter cooperativo con millones de armas.",
    image: "https://pivigames.blog/wp-content/uploads/2017/05/borderlands-2-big.jpeg",
    tags: ["Accion", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/border2",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "raft",
    title: "Raft",
    description: "Aventura y supervivencia en el mar.",
    fullDescription: "Sobrevive en una balsa en medio del océano con tus amigos.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/648800/header.jpg",
    tags: ["Supervivencia", "Crafteo", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/raft",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "rain2",
    title: "Risk of Rain 2 V1.4.1",
    description: "Este juego me salvó de vanguards.",
    fullDescription: "Roguelike de acción con muchas balas y cooperativo.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/632360/header.jpg",
    tags: ["Roguelike", "Coop"],
    downloadUrl: "https://media.rushuploads.com/Risk.of.Rain.2.v1.4.1.Yuumi.Jungle.rar",
    fixOnlineUrl: "https://gofile.io/d/gKWNN2",
    modsUrl: "https://github.com/Kesomannen/gale/releases/download/1.5.10/Gale_1.5.10_x64_en-US.msi"
  },
  {
    id: "rain2d",
    title: "Risk of Rain Returns",
    description: "Risk of Rain pero 2D.",
    fullDescription: "El Risk of Rain original remasterizado.",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1337520/header.jpg?t=1759857583",
    tags: ["Roguelike", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/rain2d",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "forever",
    title: "Forever Skies",
    description: "Supervivencia en un mundo post-apocalíptico. Tiene unos re graficos, no me anda :(",
    fullDescription: "Juego de supervivencia en un dirigible sobre un mundo devastado.",
    image: "https://pivigames.blog/wp-content/uploads/2025/04/Forever-Skies-PC-Pivigames-Juego.jpg",
    tags: ["Supervivencia", "Coop"],
    downloadUrl: "https://www.mediafire.com/file/forever",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "mudrunner",
    title: "MudRunner",
    description: "a manejar.",
    fullDescription: "Simulador de vehículos todoterreno.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/675010/header.jpg?t=1729687266",
    tags: ["Coop", "Simulador", "Autos"],
    downloadUrl: "https://uploads.online-fix.me:2053/torrents/MudRunner/MudRunner.Build.07042021-OFME.torrent",
    fixOnlineUrl: "",
    modsUrl: ""
  },
  {
    id: "sworn",
    title: "Sworn",
    description: "ta weno.",
    fullDescription: "Roguelike cooperativo de acción.",
    image: "https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/store/software/switch/70010000078501/3394878a0b7ff522fe98cf73415727b641e278bc79782aeb7d35753cd4e3d9be",
    tags: ["Coop", "Rogue Like", "Rogue Lite"],
    downloadUrl: "https://www.mediafire.com/file/sworn",
    fixOnlineUrl: "",
    modsUrl: ""
  }
];

// ============================================================================
// NOTA PARA AGREGAR NUEVOS JUEGOS:
// ============================================================================
//
// 1. Copia un objeto existente
// 2. Cambia el "id" (debe ser único, sin espacios, minúsculas)
// 3. Actualiza todos los campos
// 4. ¡Listo! El juego aparece automáticamente en el hub y tiene su página
//
// Campos obligatorios: id, title, description, image, tags, downloadUrl
// Campos opcionales: fullDescription, fixOnlineUrl, modsUrl, externalLink, customPage
//
// ============================================================================