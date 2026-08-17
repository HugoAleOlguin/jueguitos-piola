import React from 'react';

/**
 * Convierte un Timestamp o Date a un objeto Date nativo
 */
export const toNativeDate = (timestamp) => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
        return timestamp;
    }
    if (typeof timestamp.toDate === 'function') {
        const d = timestamp.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
    }
    if (typeof timestamp === 'number') {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d;
    }
    if (typeof timestamp === 'string') {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date();
};

/**
 * Comprueba si dos fechas corresponden al mismo día calendario
 */
export const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = toNativeDate(d1);
    const date2 = toNativeDate(d2);
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

/**
 * Devuelve la etiqueta del separador de fecha ('Hoy', 'Ayer' o 'DD/MM/AAAA')
 */
export const getDateSeparatorLabel = (timestamp) => {
    if (!timestamp) return 'Hoy';
    const date = toNativeDate(timestamp);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Determina si dos mensajes consecutivos deben agruparse
 * (mismo autor, mismo día y diferencia de tiempo menor a 3 minutos)
 */
export const shouldGroupMessage = (currMsg, prevMsg) => {
    if (!prevMsg || !currMsg) return false;

    // Verificar mismo autor
    const sameAuthor = (
        (currMsg.authorId && prevMsg.authorId && currMsg.authorId === prevMsg.authorId) ||
        (currMsg.authorName && prevMsg.authorName && currMsg.authorName === prevMsg.authorName)
    );
    if (!sameAuthor) return false;

    // Verificar mismo día
    if (!isSameDay(currMsg.createdAt || currMsg.time, prevMsg.createdAt || prevMsg.time)) {
        return false;
    }

    // Diferencia menor a 3 minutos (180 segundos)
    if (currMsg.createdAt && prevMsg.createdAt) {
        const t1 = toNativeDate(currMsg.createdAt).getTime();
        const t2 = toNativeDate(prevMsg.createdAt).getTime();
        return Math.abs(t1 - t2) <= 180000;
    }

    return true;
};

/**
 * Formatea texto básico estilo Markdown de manera segura:
 * *negrita* -> <strong>
 * _cursiva_ -> <em>
 * `código`  -> <code>
 */
export const renderFormattedText = (text) => {
    if (typeof text !== 'string') return text;

    // Si es un enlace de imagen o GIF directo, se maneja en el componente
    // Dividir tokens: código `...`, negrita *...*, cursiva _..._
    const regex = /(`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (!part) return null;

        // Bloque de código: `código`
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            return (
                <code 
                    key={index} 
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.82em',
                        color: '#00f3ff',
                        border: '1px solid rgba(0, 243, 255, 0.2)'
                    }}
                >
                    {part.slice(1, -1)}
                </code>
            );
        }

        // Negrita: *negrita*
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return (
                <strong key={index} style={{ fontWeight: '700', color: '#fff' }}>
                    {part.slice(1, -1)}
                </strong>
            );
        }

        // Cursiva: _cursiva_
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
            return (
                <em key={index} style={{ fontStyle: 'italic', opacity: 0.9 }}>
                    {part.slice(1, -1)}
                </em>
            );
        }

        return <span key={index}>{part}</span>;
    });
};
