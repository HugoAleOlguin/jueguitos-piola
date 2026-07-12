import React from 'react';
import { Settings } from 'lucide-react';

export const Header = ({ 
    searchQuery, 
    setSearchQuery, 
    onGoHome, 
    showSearch, 
    onFreeGames,
    onOpenSettings
}) => {
    return (
        <header id="mainHeader">
            {/* Capa de borde estático cambiante de colores (sin animaciones de giro ni respiración) */}
            <div className="header-border-static" aria-hidden="true" />
            
            {/* Contenido real del header con fondo sólido */}
            <div className="header-inner">
                <h1 
                    className="logo" 
                    onClick={onGoHome} 
                    onKeyDown={(e) => { if (e.key === 'Enter') onGoHome(); }}
                    tabIndex={0}
                    role="banner"
                >
                    Jueguitos Piola
                </h1>

                {showSearch && (
                    <div className="search-bar" id="searchBar">
                        <input 
                            type="search" 
                            placeholder="Buscar juego..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Buscar minijuegos"
                        />
                    </div>
                )}

                <div className="header-right">
                    <button 
                        className="btn-gift" 
                        aria-label="Ver juegos gratis"
                        onClick={(e) => {
                            e.preventDefault();
                            if (onFreeGames) onFreeGames();
                        }}
                    >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 8H17.8C18.6 6.9 19 5.5 19 4C19 2.3 17.7 1 16 1C14.7 1 13.5 1.8 12.8 3H11.2C10.5 1.8 9.3 1 8 1C6.3 1 5 2.3 5 4C5 5.5 5.4 6.9 6.2 8H2C0.9 8 0 8.9 0 10V12C0 12.8 0.5 13.5 1.2 13.8C1.1 13.9 1 14.1 1 14.3V21C1 22.1 1.9 23 3 23H21C22.1 23 23 22.1 23 21V14.3C23 14.1 22.9 13.9 22.8 13.8C23.5 13.5 24 12.8 24 12V10C24 8.9 23.1 8 22 8ZM16 3C16.6 3 17 3.4 17 4C17 4.6 16.6 5 16 5C14.8 5 13.3 3.6 13 3H16ZM8 3H11C10.7 3.6 9.2 5 8 5C7.4 5 7 4.6 7 4C7 3.4 7.4 3 8 3ZM3 10H11V12H3V10ZM3 14H11V21H3V14ZM21 21H13V14H21V21ZM21 12H13V10H21V12Z" />
                        </svg>
                        Juegos Gratis
                    </button>

                    <button 
                        className="btn-settings" 
                        aria-label="Abrir ajustes"
                        onClick={(e) => {
                            e.preventDefault();
                            if (onOpenSettings) onOpenSettings();
                        }}
                    >
                        <Settings />
                    </button>
                </div>
            </div>
        </header>
    );
};
