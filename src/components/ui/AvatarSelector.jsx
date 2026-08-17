import React, { useState } from 'react';

// Generador de avatares aleatorios instantáneos basados en Pixel Art Piola
export const generateRandomAvatar = (seed) => {
    const randomSeed = seed || Math.random().toString(36).substring(2, 9);
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}`;
};

export const AvatarSelector = ({ currentAvatar, onSelectAvatar }) => {
    const [isUrlMode, setIsUrlMode] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    // Detectar si el avatar actual es una imagen personalizada (subida de PC o URL externa)
    const isCustomAvatar = Boolean(
        currentAvatar && (
            currentAvatar.startsWith('data:image') || 
            (currentAvatar.startsWith('http') && !currentAvatar.includes('dicebear.com'))
        )
    );

    // Al escribir o pegar URL, actualizar inmediatamente en vivo
    const handleUrlChange = (e) => {
        const val = e.target.value;
        setUrlInput(val);
        const trimmed = val.trim();
        if (trimmed.length > 4) {
            onSelectAvatar(trimmed);
        }
    };

    // Subir desde PC
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        setUploadError('');
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Formato no válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 160;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/webp', 0.88);
                onSelectAvatar(compressedBase64);
                setUrlInput('');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Quitar foto personalizada y volver al avatar aleatorio generado
    const handleRemoveCustomAvatar = (e) => {
        e.stopPropagation();
        const newRandomAvatar = generateRandomAvatar();
        onSelectAvatar(newRandomAvatar);
        setUrlInput('');
        setIsUrlMode(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Cuadro de Avatar con Overlay de Cruz al pasar el mouse */}
                <div 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{ 
                        position: 'relative', 
                        width: '58px', 
                        height: '58px', 
                        flexShrink: 0,
                        borderRadius: '14px',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        cursor: isCustomAvatar ? 'pointer' : 'default'
                    }}
                    title={isCustomAvatar ? "Haz clic para borrar foto" : "Avatar pixel art"}
                    onClick={isCustomAvatar ? handleRemoveCustomAvatar : undefined}
                >
                    <img 
                        src={currentAvatar || generateRandomAvatar()} 
                        alt="Avatar"
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            display: 'block'
                        }}
                    />

                    {/* Cruz de borrar foto al pasar el cursor */}
                    {isCustomAvatar && isHovered && (
                        <div 
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.75)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(2px)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#ff4d4f',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                boxShadow: '0 2px 8px rgba(255, 77, 79, 0.6)'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <label style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                    }}>
                        Subir desde PC
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileUpload} 
                            style={{ display: 'none' }}
                        />
                    </label>

                    <button
                        type="button"
                        onClick={() => setIsUrlMode(!isUrlMode)}
                        style={{
                            flex: 1,
                            background: isUrlMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            padding: '8px 10px',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {isUrlMode ? 'Ocultar' : 'Pegar Enlace'}
                    </button>
                </div>
            </div>

            {uploadError && (
                <div style={{ color: '#ff4d4f', fontSize: '0.7rem' }}>
                    {uploadError}
                </div>
            )}

            {/* Input de Enlace con previsualización en tiempo real automática */}
            {isUrlMode && (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                        type="url" 
                        placeholder="Pega el enlace directo de la imagen..."
                        value={urlInput}
                        onChange={handleUrlChange}
                        autoFocus
                        style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '7px 10px',
                            fontSize: '0.75rem',
                            outline: 'none'
                        }}
                    />
                </div>
            )}
        </div>
    );
};
