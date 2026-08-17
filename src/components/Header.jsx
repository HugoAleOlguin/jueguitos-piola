import React from 'react';
import { useAuth } from '../context/AuthContext';
import { generateRandomAvatar } from './ui/AvatarSelector';

export const Header = ({ searchQuery, setSearchQuery, onGoHome, showSearch, onFreeGames, onOpenSettings }) => {
    const { isAuthenticated, userProfile, openLogin, openProfile } = useAuth();

    return (
        <header id="mainHeader">
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
                {/* Botón de Perfil / Iniciar Sesión */}
                {isAuthenticated && userProfile ? (
                    <button
                        className="btn-profile-header"
                        onClick={openProfile}
                        title={`Mi Perfil: ${userProfile.name}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${userProfile.nameColor || '#00f3ff'}55`,
                            borderRadius: '30px',
                            padding: '4px 12px 4px 6px',
                            color: userProfile.nameColor || '#00f3ff',
                            fontSize: '0.82rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Space Grotesk, sans-serif'
                        }}
                    >
                        <img 
                            src={userProfile.avatar} 
                            alt={userProfile.name}
                            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.src = generateRandomAvatar(userProfile.name);
                            }}
                        />
                        <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {userProfile.name}
                        </span>
                    </button>
                ) : (
                    <button
                        className="btn-login-header"
                        onClick={openLogin}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '18px',
                            padding: '6px 14px',
                            color: '#fff',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Space Grotesk, sans-serif'
                        }}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Entrar</span>
                    </button>
                )}

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
                    aria-label="Abrir configuración"
                    onClick={(e) => {
                        e.preventDefault();
                        if (onOpenSettings) onOpenSettings();
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
            </div>
        </header>
    );
};
