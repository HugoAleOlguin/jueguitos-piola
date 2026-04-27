// ============================================================================
// EASTER EGGS & CONSOLA
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Arte ASCII de Jueguitos Piola
    const asciiArt = `
                     ░▒▒▒▒▒▒▒▒▒▒▒░                     
                  ░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▒▒▒░                  
                ▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▓▓▒▒░               
              ▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒              
            ░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░            
           ▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░          
         ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒         
        ░▒▒▒▒░░░░░░░░░░░░▒▒▓▒▒░░░░░░░░░░░░▒▒▓▒▒        
       ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▒▓▒▒       
      ▒▒▓▓▒▓▒▒▒▒▒░░░░░▒▒░▒▓▓▓▒▒▒▒░░░░░▒▒▒▒▓▒▓▓▒▒▒░     
     ▒▒▓▓▓▓▓▒▒▒▒▒░░░▒▒▒▒▒▓▓▓▒▒▒▒▒▒▒░░░▒▒▒▒▒▒▓▓▒▒▒▒     
    ▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░   
   ▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒░  
  ▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▓▓▓▓▓▓▓▒▒░ 
 ▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▓▓▓▓▓▓▓▒▒▒▒ 
░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▒▒▒
▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▓▒▓▓▒▒▒▓▓▒▒▒▒▒░▒▒▓▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▒▒
▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░░░░░░░░░▒▒▒▒▒▒▒▓▓▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▒
▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒
▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒
░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒
 ▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒ 
  ▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒  
    ▒▒▒▒▒▒▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒    
       ░▒▒▒▒▒▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▓▒▒▒▒░       
            ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░           
                                                                      
██████╗ ██╗ ██████╗ ██╗      █████╗ 
██╔══██╗██║██╔═══██╗██║     ██╔══██╗
██████╔╝██║██║   ██║██║     ███████║
██╔═══╝ ██║██║   ██║██║     ██╔══██║
██║     ██║╚██████╔╝███████╗██║  ██║
╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
`;

    // Imprimir con estilo neón
    console.log(
        `%c${asciiArt}`,
        "color: #c2ae00ff; font-weight: bold; text-shadow: 0 0 5px #c2ae00ff;"
    );

    // Mensajes divertidos
    console.log(
        "%c¿Qué haces inspeccionando la consola?",
        "color: #ff00ff; font-size: 14px; font-weight: bold; padding: 5px; border-radius: 5px;"
    );

    console.log(
        "%cSi encuentras un bug... ignóralo",
        "color: #ffeb3b; font-size: 12px; font-style: italic;"
    );

    // 2. Pequeño comando secreto interactivo
    window.piola = {
        hackear: () => {
            console.log("%cIniciando secuencia de hackeo...", "color: #00ff00; font-size: 14px;");
            setTimeout(() => console.log("%cAccediendo al servidor central...", "color: #00ff00"), 1000);
            setTimeout(() => console.log("%cBypasseando seguridad...", "color: #00ff00"), 2000);
            setTimeout(() => console.log("%c¡Hackeo completado! (no paso nada...)", "color: #ff00ff; font-size: 16px; font-weight: bold;"), 3000);
        }
    };

    console.log(
        "%cTip: Intenta escribir %cpiola.hackear()%c y presiona Enter.",
        "color: #888; font-size: 11px;",
        "color: #00ff00; font-family: monospace; font-size: 11px;",
        "color: #888; font-size: 11px;"
    );
});
