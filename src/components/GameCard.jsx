import React, { useState, useRef } from 'react';
// placeholder
import { motion, useSpring, useTransform } from 'framer-motion';

export const getTagClass = (tag) => {
    const t = tag.toLowerCase();
    if (['coop', 'cooperativo'].includes(t)) return 'tag tag-coop';
    if (['terror', 'horror'].includes(t)) return 'tag tag-terror';
    if (['party', 'fiesta'].includes(t)) return 'tag tag-party';
    return 'tag';
};

const cardVariants = {
    hidden: { opacity: 1 },
    visible: { 
        opacity: 1,
        transition: { duration: 0 }
    }
};

export const GameCard = ({ game, onOpen }) => {
    const cardRef = useRef(null);

    // Tilt 3D via springs para fluidez máxima
    const rotX = useSpring(0, { stiffness: 280, damping: 28 });
    const rotY = useSpring(0, { stiffness: 280, damping: 28 });
    const scaleS = useSpring(1, { stiffness: 280, damping: 28 });

    // Glow azul que sigue al mouse
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const isUtility = game.tags.some(tag => tag.toLowerCase() === 'utilidad');

    // Proxy de imágenes
    let proxiedUrl = game.image;
    if (game.image && game.image.startsWith('http')) {
        let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(game.image)}&w=400&output=webp&q=80`;
        if (game.image.toLowerCase().includes('.gif')) proxyUrl += '&n=-1';
        proxiedUrl = proxyUrl;
    }
    const bgStyle = proxiedUrl ? `url('${proxiedUrl}')` : 'linear-gradient(45deg, #111, #222)';

    const handleClick = (e) => {
        e.preventDefault();
        if (game.externalLink && game.downloadUrl) {
            window.open(game.downloadUrl, '_blank');
        } else if (game.internalLink && game.downloadUrl) {
            window.location.href = game.downloadUrl;
        } else {
            onOpen(game.id);
        }
    };

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const box = card.getBoundingClientRect();

        const x = e.clientX - box.left - box.width / 2;
        const y = e.clientY - box.top - box.height / 2;

        const maxRot = 10;
        rotX.set((-y / (box.height / 2)) * maxRot);
        rotY.set((x / (box.width / 2)) * maxRot);

        // Posición del glow azul (porcentaje)
        const gx = ((e.clientX - box.left) / box.width) * 100;
        const gy = ((e.clientY - box.top) / box.height) * 100;
        setGlowPos({ x: gx, y: gy });
    };

    const handleMouseEnter = () => {
        scaleS.set(1.035);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        rotX.set(0);
        rotY.set(0);
        scaleS.set(1);
        setIsHovered(false);
    };

    return (
        <motion.div
            ref={cardRef}
            className="game-card"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                outline: 'none',
                transformStyle: 'preserve-3d',
                transformPerspective: 1000,
                rotateX: rotX,
                rotateY: rotY,
                scale: scaleS,
            }}
            whileTap={{ scale: 0.96 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClick(e);
            }}
        >
            {/* Glow azul que sigue al mouse */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    zIndex: 4,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    background: isHovered
                        ? `radial-gradient(circle 80px at ${glowPos.x}% ${glowPos.y}%, rgba(80, 160, 255, 0.18), transparent 70%)`
                        : 'none',
                }}
            />

            <div
                className="card-image loaded"
                style={{
                    backgroundImage: bgStyle,
                    transform: 'translateZ(20px)'
                }}
            >
                {isUtility && <div className="utility-ribbon">Utilidad</div>}
            </div>

            <div className="card-content" style={{ transform: 'translateZ(10px)' }}>
                <h3 className="card-title">{game.title}</h3>
                <p className="card-desc">{game.description}</p>
                <div className="card-tags">
                    {game.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={getTagClass(tag)}>{tag}</span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
