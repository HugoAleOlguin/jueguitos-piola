import React, { useState } from 'react';

export const ChatMessageMedia = ({ src, alt = "Multimedia de chat", isGrouped = false }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div style={{
                marginTop: isGrouped ? '0' : '4px',
                padding: '8px 12px',
                background: 'rgba(255, 77, 79, 0.08)',
                border: '1px solid rgba(255, 77, 79, 0.2)',
                borderRadius: '8px',
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.7)'
            }}>
                <span style={{ color: '#ff4d4f', fontWeight: '700' }}>⚠️ Imagen no disponible</span>
            </div>
        );
    }

    return (
        <div 
            style={{
                marginTop: isGrouped ? '0' : '4px',
                width: '230px',
                maxWidth: '100%',
                height: '175px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#0a0c10',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative'
            }}
        >
            <img 
                src={src} 
                alt={alt}
                onError={() => setHasError(true)}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: '9px'
                }}
            />
        </div>
    );
};
