import React, { useState, useEffect } from 'react';
import { getAchievementsState } from '../services/achievements';
import { Trophy } from 'lucide-react';

export const AchievementsModal = ({ onClose }) => {
    const [state, setState] = useState(() => getAchievementsState());

    const handleResetProgress = () => {
        if (confirm('¿Seguro que deseas reiniciar todos tus logros y estadísticas? Esto no se puede deshacer.')) {
            localStorage.removeItem('jueguitos_achievements');
            setState(getAchievementsState());
        }
    };

    // Escuchar si se desbloquea algún logro mientras el modal está abierto para actualizar la vista
    useEffect(() => {
        const handleUnlock = () => {
            setState(getAchievementsState());
        };
        window.addEventListener('jueguitos_achievement_unlocked', handleUnlock);
        return () => window.removeEventListener('jueguitos_achievement_unlocked', handleUnlock);
    }, []);

    const { unlockedCount, totalCount, allAchievements, unlockedSet } = state;

    return (
        <div className="achievements-modal-overlay" style={{ display: 'flex' }} onClick={onClose} role="dialog" aria-modal="true">
            <div className="achievements-window" onClick={(e) => e.stopPropagation()}>
                <div className="achievements-header">
                    <h2 id="achTitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trophy size={20} />
                        Logros Desbloqueados <span id="achTitleCount">({unlockedCount}/{totalCount})</span>
                    </h2>
                    <button className="btn-close-ach" onClick={onClose}>×</button>
                </div>
                
                <div className="achievements-body">
                    <div className="achievements-grid-large" id="achievementsListLarge">
                        {allAchievements.map(ach => {
                            const isUnlocked = unlockedSet.has(ach.id);
                            
                            // Si es secreto y no está desbloqueado, no renderizar (o mostrar placeholder secreto)
                            if (ach.secret && !isUnlocked) return null;

                            return (
                                <div 
                                    key={ach.id} 
                                    className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'} ${ach.id === 'speedrunner' ? 'speedrunner' : ''}`}
                                >
                                    <div className={`ach-icon ${ach.id === 'speedrunner' ? 'ach-icon-large' : ''}`}>
                                        {isUnlocked ? ach.icon : '🔒'}
                                    </div>
                                    <div className="ach-info">
                                        <h4>{ach.title}</h4>
                                        <p>{isUnlocked ? ach.desc : 'Logro bloqueado. Sigue jugando para descubrirlo.'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="achievements-footer">
                    <button className="btn-ghost danger" onClick={handleResetProgress}>
                        Resetear Progreso
                    </button>
                </div>
            </div>
        </div>
    );
};
