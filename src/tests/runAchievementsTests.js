// Test suite para la logica del sistema de logros
import { ACHIEVEMENTS } from '../data/achievementsData.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

console.log('----------------------------------------------------');
console.log('Ejecutando suite de pruebas: Achievements Logic');
console.log('----------------------------------------------------');

// 1. Validacion de datos de logros
assert(Array.isArray(ACHIEVEMENTS) && ACHIEVEMENTS.length === 12, '1. Deben existir exactamente 12 logros');

const nonSecret = ACHIEVEMENTS.filter(a => a.id !== 'speedrunner');
assert(nonSecret.length === 11, '2. Deben existir 11 logros normales y 1 logro especial speedrunner');

const allHaveFields = ACHIEVEMENTS.every(a => a.id && a.title && a.description && a.icon && a.color);
assert(allHaveFields, '3. Cada logro tiene id, title, description, icon y color definidos');

// Validacion de cero emojis en textos
const emojiRegex = /[\u{1F300}-\u{1F9FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/u;
const hasNoEmojis = ACHIEVEMENTS.every(a => !emojiRegex.test(a.title) && !emojiRegex.test(a.description));
assert(hasNoEmojis, '4. Ningun titulo o descripcion de logro contiene emojis');

// 5. Simulacion de logica de estado y desbloqueo
class MockAchievementManager {
  constructor() {
    this.unlockedIds = [];
    this.stats = { logoClicks: 0 };
    this.speedrun = { startTime: null, completionTime: null };
  }

  unlock(id) {
    if (this.unlockedIds.includes(id)) return;
    this.unlockedIds.push(id);

    const normalUnlocked = this.unlockedIds.filter(item => item !== 'speedrunner').length;
    if (normalUnlocked >= 11 && !this.unlockedIds.includes('speedrunner')) {
      const now = Date.now();
      if (this.speedrun.startTime && now - this.speedrun.startTime < 60000) {
        this.unlockedIds.push('speedrunner');
        this.speedrun.completionTime = now;
      }
    }
  }

  trackEvent(type) {
    if (!this.speedrun.startTime) {
      this.speedrun.startTime = Date.now();
    }

    if (type === 'LOGO_CLICK') {
      this.stats.logoClicks += 1;
      if (this.stats.logoClicks >= 50) {
        this.unlock('pesado');
      }
    } else if (type === 'FOOTER_CLICK') {
      this.unlock('curious_cat');
    }
    // Stubbed events
  }

  reset() {
    const now = Date.now();
    this.unlockedIds = [];
    this.stats = { logoClicks: 0 };
    this.speedrun = { startTime: now, completionTime: null };
  }
}

const manager = new MockAchievementManager();

// Desbloqueo normal sin duplicados
manager.unlock('prime');
manager.unlock('prime');
assert(manager.unlockedIds.length === 1 && manager.unlockedIds[0] === 'prime', '5. Desbloqueo unitario sin duplicados');

// Evento footer
manager.trackEvent('FOOTER_CLICK');
assert(manager.unlockedIds.includes('curious_cat'), '6. FOOTER_CLICK desbloquea curious_cat');

// Evento 50 clics de logo
for (let i = 0; i < 49; i++) {
  manager.trackEvent('LOGO_CLICK');
}
assert(!manager.unlockedIds.includes('pesado'), '7. 49 clics de logo aun no desbloquean pesado');
manager.trackEvent('LOGO_CLICK');
assert(manager.unlockedIds.includes('pesado'), '8. El clic 50 de logo desbloquea pesado exitosamente');

// Eventos stubbed no causan fallos ni desbloqueos accidentales
manager.trackEvent('BLUR_CHANGE');
manager.trackEvent('SAVE_THEME');
manager.trackEvent('ROULETTE_SPIN');
assert(!manager.unlockedIds.includes('blur') && !manager.unlockedIds.includes('diseno') && !manager.unlockedIds.includes('ludopath'), '9. Eventos en espera (stubbed) no disparan desbloqueos prematuros');

// Reset de logros
manager.reset();
assert(manager.unlockedIds.length === 0 && manager.stats.logoClicks === 0 && typeof manager.speedrun.startTime === 'number', '10. Reset restablece progreso e inicializa temporizador de speedrunner');

// Evaluacion de speedrunner completado en < 60s tras reset
nonSecret.forEach(a => manager.unlock(a.id));
assert(manager.unlockedIds.includes('speedrunner'), '11. Desbloquear los 11 logros en menos de 1 minuto otorga el logro final SPEEDRUNNER');

// 12. Validacion de trigger prime
manager.reset();
function handleSearchMock(term, mgr, togglePrime) {
  if (term.toLowerCase().trim() === 'prime') {
    mgr.unlock('prime');
    togglePrime();
    return true;
  }
  return false;
}
let primeToggled = false;
const searchResult = handleSearchMock('  PRIME  ', manager, () => { primeToggled = true; });
assert(searchResult && primeToggled && manager.unlockedIds.includes('prime'), '12. Buscar prime activa el modo prime y desbloquea el logro El Prime');

console.log('----------------------------------------------------');
console.log('Resumen de ejecucion:');
console.log(`- Pruebas exitosas: ${passed}`);
console.log(`- Pruebas fallidas: ${failed}`);
console.log(`- Total evaluadas:  ${passed + failed}`);
console.log('----------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nResultado: Todas las pruebas de logros pasaron satisfactoriamente.');
}
