import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AvatarSelector, generateRandomAvatar } from './ui/AvatarSelector';

export const AuthModal = () => {
    const { 
        isAuthModalOpen, 
        authModalMode, 
        setAuthModalMode, 
        closeAuthModal, 
        login, 
        register, 
        logout, 
        updateProfile, 
        userProfile,
        isAuthenticated 
    } = useAuth();

    // Estado persistente del formulario (no se borra al cerrar el modal por misclick)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [description, setDescription] = useState('');
    const [favoriteGame, setFavoriteGame] = useState('');
    const [avatar, setAvatar] = useState(() => generateRandomAvatar());
    const [nameColor, setNameColor] = useState('#00f3ff');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const COLOR_PALETTE = [
        { name: 'Cian Neón', hex: '#00f3ff' },
        { name: 'Oro Piola', hex: '#ffd700' },
        { name: 'Verde Matrix', hex: '#00ff88' },
        { name: 'Rosa Arcade', hex: '#ff007f' },
        { name: 'Naranja Láser', hex: '#ff8800' },
        { name: 'Azul Cyber', hex: '#38bdf8' },
        { name: 'Blanco Puro', hex: '#ffffff' }
    ];

    // Sincronizar datos únicamente si el usuario ya está autenticado
    useEffect(() => {
        setErrorMsg('');
        setSuccessMsg('');
        if (isAuthenticated && userProfile) {
            setUsername(userProfile.name || '');
            setDescription(userProfile.description || '');
            setFavoriteGame(userProfile.favoriteGame || '');
            setAvatar(userProfile.avatar || generateRandomAvatar());
            setNameColor(userProfile.nameColor || '#00f3ff');
        }
    }, [isAuthModalOpen, isAuthenticated, userProfile]);

    if (!isAuthModalOpen) return null;

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        if (!username.trim() || !password) {
            setErrorMsg('Ingresa tu usuario y contraseña.');
            return;
        }

        setLoading(true);
        try {
            await login(username.trim(), password);
        } catch (err) {
            console.error("Error login:", err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setErrorMsg('Usuario o contraseña incorrectos.');
            } else if (err.code === 'auth/too-many-requests') {
                setErrorMsg('Demasiados intentos. Espera unos momentos.');
            } else {
                setErrorMsg(err.message || 'Error al iniciar sesión.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        const cleanUser = username.trim();
        if (cleanUser.length < 3) {
            setErrorMsg('El usuario debe tener al menos 3 caracteres.');
            return;
        }
        if (cleanUser.length > 20) {
            setErrorMsg('El usuario no puede superar los 20 caracteres.');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            await register(cleanUser, password, {
                avatar,
                nameColor,
                description: description.trim() || 'Jugador en Jueguitos Piola',
                favoriteGame: favoriteGame.trim() || 'Juegos Retro'
            });
        } catch (err) {
            console.error("Error register:", err);
            if (err.code === 'auth/email-already-in-use') {
                setErrorMsg('Ese nombre de usuario ya está registrado.');
            } else {
                setErrorMsg(err.message || 'Error al crear cuenta.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);
        try {
            await updateProfile({
                avatar,
                nameColor,
                description: description.trim(),
                favoriteGame: favoriteGame.trim()
            });
            setSuccessMsg('Perfil actualizado correctamente.');
            setTimeout(() => {
                closeAuthModal();
            }, 800);
        } catch (err) {
            console.error("Error update profile:", err);
            setErrorMsg(err.message || 'Error al guardar cambios.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setDescription('');
            setFavoriteGame('');
            setAvatar(generateRandomAvatar());
            setNameColor('#00f3ff');
            setErrorMsg('');
            setSuccessMsg('');
            closeAuthModal();
        } catch (err) {
            console.error("Error al cerrar sesión:", err);
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                className="auth-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                    style={{
                        position: 'relative',
                        width: '680px',
                        maxWidth: '94vw',
                        minHeight: '380px',
                        background: 'rgba(10, 12, 18, 0.82)',
                        backdropFilter: 'blur(28px) saturate(1.3)',
                        WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '20px',
                        padding: '24px 26px',
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header con Switcher y Botón Cerrar */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: '800',
                                letterSpacing: '-0.3px',
                                margin: 0,
                                fontFamily: 'Space Grotesk, sans-serif'
                            }}>
                                {authModalMode === 'login' && 'Acceso al Chat'}
                                {authModalMode === 'register' && 'Registro de Usuario'}
                                {authModalMode === 'profile' && 'Perfil de Usuario'}
                            </h2>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {authModalMode !== 'profile' && (
                                    <div style={{
                                        display: 'flex',
                                        position: 'relative',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        borderRadius: '10px',
                                        padding: '3px',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => { setAuthModalMode('login'); setErrorMsg(''); }}
                                            style={{
                                                position: 'relative',
                                                padding: '5px 14px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'transparent',
                                                color: authModalMode === 'login' ? '#fff' : 'rgba(255, 255, 255, 0.45)',
                                                fontWeight: '700',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                zIndex: 2,
                                                transition: 'color 0.2s ease',
                                                fontFamily: 'Space Grotesk, sans-serif'
                                            }}
                                        >
                                            Iniciar Sesion
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setAuthModalMode('register'); setErrorMsg(''); }}
                                            style={{
                                                position: 'relative',
                                                padding: '5px 14px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'transparent',
                                                color: authModalMode === 'register' ? '#fff' : 'rgba(255, 255, 255, 0.45)',
                                                fontWeight: '700',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                zIndex: 2,
                                                transition: 'color 0.2s ease',
                                                fontFamily: 'Space Grotesk, sans-serif'
                                            }}
                                        >
                                            Crear Cuenta
                                        </button>

                                        <motion.div
                                            layoutId="auth-tab-pill-active"
                                            style={{
                                                position: 'absolute',
                                                top: '3px',
                                                bottom: '3px',
                                                left: authModalMode === 'login' ? '3px' : '50%',
                                                width: 'calc(50% - 3px)',
                                                background: 'rgba(255, 255, 255, 0.14)',
                                                borderRadius: '7px',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                zIndex: 1
                                            }}
                                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                        />
                                    </div>
                                )}

                                {/* Botón Cerrar (Única vía para cerrar el modal) */}
                                <button
                                    onClick={closeAuthModal}
                                    aria-label="Cerrar modal"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Alertas */}
                        {errorMsg && (
                            <div style={{
                                background: 'rgba(255, 59, 48, 0.12)',
                                border: '1px solid rgba(255, 59, 48, 0.3)',
                                color: '#ff6b6b',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                marginBottom: '10px'
                            }}>
                                {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div style={{
                                background: 'rgba(0, 255, 136, 0.12)',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                                color: '#00ff88',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                marginBottom: '10px'
                            }}>
                                {successMsg}
                            </div>
                        )}
                    </div>

                    {/* CUERPO PRINCIPAL: 2 COLUMNAS SIMÉTRICAS */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                        {/* MODO 1: INICIAR SESION (2 COLUMNAS EQUILIBRADAS) */}
                        {authModalMode === 'login' && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '24px',
                                alignItems: 'stretch'
                            }}>
                                {/* Columna 1: Formulario */}
                                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Usuario o Correo
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ingresa tu apodo"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '10px',
                                                padding: '9px 12px',
                                                color: '#fff',
                                                fontSize: '0.85rem',
                                                outline: 'none'
                                            }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '10px',
                                                padding: '9px 12px',
                                                color: '#fff',
                                                fontSize: '0.85rem',
                                                outline: 'none'
                                            }}
                                            required
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            background: '#fff',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '11px',
                                            fontWeight: '700',
                                            fontSize: '0.85rem',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontFamily: 'Space Grotesk, sans-serif',
                                            marginTop: '6px'
                                        }}
                                    >
                                        {loading ? 'Ingresando...' : 'Entrar a mi Cuenta'}
                                    </motion.button>
                                </form>

                                {/* Columna 2: Información y Enlace a Registro */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '14px',
                                    padding: '18px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                                            Comunidad Piola
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.45, margin: 0 }}>
                                            Con tu apodo y contraseña puedes ingresar desde cualquier dispositivo y mantener tu perfil sincronizado.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { setAuthModalMode('register'); setErrorMsg(''); }}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            color: '#fff',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '10px',
                                            padding: '9px 12px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontFamily: 'Space Grotesk, sans-serif'
                                        }}
                                    >
                                        ¿No tienes cuenta? Crear una ahora
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* MODO 2: CREAR CUENTA (2 COLUMNAS EQUILIBRADAS) */}
                        {authModalMode === 'register' && (
                            <form onSubmit={handleRegisterSubmit} style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '24px'
                            }}>
                                {/* Columna 1: Credenciales y Color */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Nombre de Usuario
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: NeoGamer"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                color: '#fff',
                                                fontSize: '0.85rem',
                                                outline: 'none'
                                            }}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                                Contraseña
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="Mín. 6 letras"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255, 255, 255, 0.04)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '10px',
                                                    padding: '8px 10px',
                                                    color: '#fff',
                                                    fontSize: '0.85rem',
                                                    outline: 'none'
                                                }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                                Repetir
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="Mín. 6 letras"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255, 255, 255, 0.04)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '10px',
                                                    padding: '8px 10px',
                                                    color: '#fff',
                                                    fontSize: '0.85rem',
                                                    outline: 'none'
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Color de Nombre
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {COLOR_PALETTE.map((color) => {
                                                const isSelected = nameColor === color.hex;
                                                return (
                                                    <button
                                                        key={color.hex}
                                                        type="button"
                                                        onClick={() => setNameColor(color.hex)}
                                                        title={color.name}
                                                        style={{
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '50%',
                                                            background: color.hex,
                                                            border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                                                            boxShadow: isSelected ? `0 0 12px ${color.hex}` : 'none',
                                                            cursor: 'pointer',
                                                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            background: '#fff',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '10px',
                                            fontWeight: '700',
                                            fontSize: '0.85rem',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontFamily: 'Space Grotesk, sans-serif',
                                            marginTop: '4px'
                                        }}
                                    >
                                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                                    </motion.button>
                                </div>

                                {/* Columna 2: Avatar y Bio */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                                            Foto de Perfil
                                        </div>
                                        <AvatarSelector
                                            currentAvatar={avatar}
                                            onSelectAvatar={setAvatar}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Estado / Bio (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Jugador de clásicos"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            maxLength={100}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                color: '#fff',
                                                fontSize: '0.82rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* MODO 3: EDITAR PERFIL */}
                        {authModalMode === 'profile' && (
                            <form onSubmit={handleSaveProfile} style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '24px'
                            }}>
                                {/* Columna 1: Usuario, Bio y Juego */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{
                                        padding: '8px 12px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Usuario Activo
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: '800', color: nameColor, fontFamily: 'Space Grotesk, sans-serif' }}>
                                            @{userProfile?.name || username}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Biografía / Estado
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Jugador de clásicos"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            maxLength={100}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                color: '#fff',
                                                fontSize: '0.82rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                            Juego Favorito
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Half-Life, Doom"
                                            value={favoriteGame}
                                            onChange={(e) => setFavoriteGame(e.target.value)}
                                            maxLength={40}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                color: '#fff',
                                                fontSize: '0.82rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            background: '#fff',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '10px',
                                            fontWeight: '700',
                                            fontSize: '0.85rem',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontFamily: 'Space Grotesk, sans-serif'
                                        }}
                                    >
                                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </motion.button>
                                </div>

                                {/* Columna 2: Foto, Color y Salir */}
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                                                Foto de Perfil
                                            </div>
                                            <AvatarSelector
                                                currentAvatar={avatar}
                                                onSelectAvatar={setAvatar}
                                            />
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Space Mono, monospace' }}>
                                                Color de Nombre
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {COLOR_PALETTE.map((color) => {
                                                    const isSelected = nameColor === color.hex;
                                                    return (
                                                        <button
                                                            key={color.hex}
                                                            type="button"
                                                            onClick={() => setNameColor(color.hex)}
                                                            title={color.name}
                                                            style={{
                                                                width: '22px',
                                                                height: '22px',
                                                                borderRadius: '50%',
                                                                background: color.hex,
                                                                border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                                                                boxShadow: isSelected ? `0 0 12px ${color.hex}` : 'none',
                                                                cursor: 'pointer',
                                                                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        style={{
                                            background: 'transparent',
                                            color: '#ff4d4f',
                                            border: '1px solid rgba(255, 77, 79, 0.25)',
                                            borderRadius: '10px',
                                            padding: '9px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontFamily: 'Space Grotesk, sans-serif',
                                            marginTop: '6px'
                                        }}
                                    >
                                        Cerrar Sesion
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
