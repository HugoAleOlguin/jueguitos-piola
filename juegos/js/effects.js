/**
 * Efectos visuales y funcionalidades para las páginas de juegos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Convertir el título del header en un enlace a la página principal
    const headerTitle = document.querySelector('.header h1');
    if (headerTitle) {
        const link = document.createElement('a');
        link.href = 'https://hugoaleolguin.github.io/jueguitos-piola/';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
        link.innerHTML = headerTitle.innerHTML;
        
        // Efectos de hover para el título del header
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.textShadow = '0 0 20px rgba(245, 137, 255, 0.9), 0 0 30px rgba(76, 175, 80, 0.7)';
        });
        link.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.textShadow = '';
        });
        
        headerTitle.innerHTML = '';
        headerTitle.appendChild(link);
    }
    


    
    // Optimizar carga de imágenes
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Agregar loading lazy a todas las imágenes
        img.loading = 'lazy';
        // Agregar srcset para imágenes responsivas si existe el atributo data-srcset
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
        }
    });
    
    // Efecto de desplazamiento suave para los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Efecto de hover para los elementos de la lista
    const listItems = document.querySelectorAll('.game-details li, .mods-section li');
    listItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Añadir efecto de pulsación a los botones
    const buttons = document.querySelectorAll('.button, .button-secondary, .mod-download-btn');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        button.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Añadir efecto de parallax al fondo
    document.addEventListener('mousemove', function(e) {
        const moveX = (e.clientX / window.innerWidth) * 10;
        const moveY = (e.clientY / window.innerHeight) * 10;
        document.body.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
    });

    // Añadir efecto de brillo a los títulos
    const titles = document.querySelectorAll('h1, h2');
    titles.forEach(title => {
        title.addEventListener('mouseenter', function() {
            this.style.textShadow = '0 0 15px rgba(245, 137, 255, 0.8), 0 0 20px rgba(76, 175, 80, 0.5)';
        });
        title.addEventListener('mouseleave', function() {
            this.style.textShadow = '';
        });
    });
});