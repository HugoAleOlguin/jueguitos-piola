import React from 'react';
// placeholder
import { motion } from 'framer-motion';
import { GameCard } from './GameCard';

const gridVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
};

export const GamesGrid = ({ games, onOpenGame }) => {
    if (games.length === 0) {
        return (
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="no-results"
                style={{ 
                    textAlign: 'center', 
                    padding: '100px 40px', 
                    color: '#888888', 
                    fontFamily: 'var(--font-main)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '2px' 
                }}
            >
                No se encontraron juegos.
            </motion.p>
        );
    }

    return (
        <div className="games-grid-container">
            <motion.section 
                variants={gridVariants}
                initial="hidden"
                animate="visible"
                className="games-grid" 
                id="gamesGrid" 
                aria-label="Catálogo de juegos"
            >
                {games.map((game) => (
                    <GameCard 
                        key={game.id} 
                        game={game} 
                        onOpen={onOpenGame} 
                    />
                ))}
            </motion.section>
        </div>
    );
};
