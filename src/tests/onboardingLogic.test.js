/**
 * Modulo de logica y pruebas unitarias para el sistema de onboarding.
 * Valida contratos de pasos, logica de navegacion, deteccion de escritorio y persistencia.
 */

// Definicion del contrato de pasos por defecto
export const DEFAULT_ONBOARDING_STEPS = [
  {
    id: 'step-catalog',
    tag: 'Exploracion',
    title: 'Catalogo de Juegos',
    description: 'Explora nuestra coleccion de juegos con filtros avanzados por categoria y estado.',
    badge: 'Paso 1'
  },
  {
    id: 'step-chat',
    tag: 'Comunidad',
    title: 'Chat en Tiempo Real',
    description: 'Conectate e interactua con otros jugadores de la comunidad en tiempo real.',
    badge: 'Paso 2'
  },
  {
    id: 'step-profile',
    tag: 'Personalizacion',
    title: 'Ajustes y Perfil',
    description: 'Personaliza tu avatar, temas visuales y preferencias de audio.',
    badge: 'Paso 3'
  }
];

export const REQUIRED_STEP_FIELDS = ['id', 'tag', 'title', 'description', 'badge'];

/**
 * Valida que un objeto cumpla con la estructura requerida de un paso.
 * @param {object} step
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStepContract(step) {
  const errors = [];
  if (!step || typeof step !== 'object') {
    return { valid: false, errors: ['El paso debe ser un objeto valido'] };
  }

  for (const field of REQUIRED_STEP_FIELDS) {
    if (typeof step[field] !== 'string' || step[field].trim() === '') {
      errors.push(`Campo requerido ausente o invalido: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida la lista de pasos completa.
 * @param {Array} steps
 * @param {number} expectedLength
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStepsArray(steps, expectedLength = 3) {
  const errors = [];
  if (!Array.isArray(steps)) {
    return { valid: false, errors: ['La coleccion de pasos debe ser un arreglo'] };
  }

  if (steps.length !== expectedLength) {
    errors.push(`Longitud esperada: ${expectedLength}, obtenida: ${steps.length}`);
  }

  steps.forEach((step, index) => {
    const result = validateStepContract(step);
    if (!result.valid) {
      errors.push(`Error en el paso ${index}: ${result.errors.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Determina si el ancho de pantalla corresponde a un dispositivo de escritorio.
 * @param {number} width
 * @returns {boolean} true si width >= 1024, false en caso contrario
 */
export function isDesktopDevice(width) {
  if (typeof width !== 'number' || Number.isNaN(width)) {
    return false;
  }
  return width >= 1024;
}

/**
 * Calcula el siguiente indice de paso asegurando no exceder el maximo permitido.
 * @param {number} currentIndex
 * @param {number} totalSteps
 * @returns {number}
 */
export function getNextStepIndex(currentIndex, totalSteps = 3) {
  const maxIndex = Math.max(0, totalSteps - 1);
  const normalizedCurrent = Math.max(0, currentIndex);
  return Math.min(normalizedCurrent + 1, maxIndex);
}

/**
 * Calcula el indice de paso anterior asegurando no descender por debajo de 0.
 * @param {number} currentIndex
 * @returns {number}
 */
export function getPrevStepIndex(currentIndex) {
  return Math.max(0, currentIndex - 1);
}

/**
 * Genera un mock en memoria de Storage (similar a localStorage).
 * @returns {Storage}
 */
export function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    }
  };
}

export const ONBOARDING_STORAGE_KEY = 'jueguitos_onboarding_status';

/**
 * Guarda el estado del onboarding en el almacenamiento provisto.
 * @param {Storage} storage
 * @param {string} status
 * @param {string} [key]
 */
export function saveOnboardingStatus(storage, status, key = ONBOARDING_STORAGE_KEY) {
  if (!storage || typeof storage.setItem !== 'function') {
    throw new Error('Almacenamiento invalido');
  }
  storage.setItem(key, status);
}

/**
 * Obtiene el estado del onboarding desde el almacenamiento.
 * @param {Storage} storage
 * @param {string} [key]
 * @returns {string|null}
 */
export function getOnboardingStatus(storage, key = ONBOARDING_STORAGE_KEY) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }
  return storage.getItem(key);
}

/**
 * Reinicia el estado del onboarding en el almacenamiento.
 * @param {Storage} storage
 * @param {string} [key]
 */
export function resetOnboardingStatus(storage, key = ONBOARDING_STORAGE_KEY) {
  if (!storage || typeof storage.removeItem !== 'function') {
    throw new Error('Almacenamiento invalido');
  }
  storage.removeItem(key);
}

/**
 * Conjunto de pruebas unitarias con aserciones nativas.
 */
export const tests = [
  {
    name: 'Validacion del contrato de los 3 pasos (longitud y campos requeridos)',
    run(assert) {
      // 1. Longitud exacta de 3 pasos
      assert.strictEqual(DEFAULT_ONBOARDING_STEPS.length, 3, 'Deben existir exactamente 3 pasos definidos');

      // 2. Validacion de la coleccion completa
      const arrayValidation = validateStepsArray(DEFAULT_ONBOARDING_STEPS, 3);
      assert.strictEqual(arrayValidation.valid, true, `La coleccion no cumple el contrato: ${arrayValidation.errors.join('; ')}`);

      // 3. Verificacion de cada paso individual
      DEFAULT_ONBOARDING_STEPS.forEach((step, index) => {
        REQUIRED_STEP_FIELDS.forEach((field) => {
          assert.ok(
            typeof step[field] === 'string' && step[field].trim().length > 0,
            `El paso en indice ${index} debe tener el campo '${field}' con texto no vacio`
          );
        });
      });

      // 4. Caso negativo: campo faltante
      const incompleteStep = {
        id: 'step-incompleto',
        tag: 'Prueba',
        title: 'Titulo',
        description: 'Descripcion sin badge'
      };
      const incompleteValidation = validateStepContract(incompleteStep);
      assert.strictEqual(incompleteValidation.valid, false, 'Un paso sin campo requerido debe ser invalido');
      assert.ok(
        incompleteValidation.errors.some((err) => err.includes('badge')),
        'El error debe reportar la falta del campo badge'
      );

      // 5. Caso negativo: campo vacio
      const emptyFieldStep = {
        id: 'step-vacio',
        tag: '   ',
        title: 'Titulo',
        description: 'Descripcion',
        badge: 'Paso X'
      };
      assert.strictEqual(validateStepContract(emptyFieldStep).valid, false, 'Un paso con campo en blanco debe ser invalido');

      // 6. Caso negativo: coleccion con cantidad incorrecta de pasos
      const partialList = DEFAULT_ONBOARDING_STEPS.slice(0, 2);
      const partialValidation = validateStepsArray(partialList, 3);
      assert.strictEqual(partialValidation.valid, false, 'Una lista con 2 pasos debe fallar la validacion de 3 pasos');
    }
  },
  {
    name: 'Transicion hacia adelante dentro de limites 0 a 2 sin desbordar',
    run(assert) {
      const totalSteps = 3;

      // De 0 a 1
      assert.strictEqual(getNextStepIndex(0, totalSteps), 1, 'Avanzar desde 0 debe resultar en 1');

      // De 1 a 2
      assert.strictEqual(getNextStepIndex(1, totalSteps), 2, 'Avanzar desde 1 debe resultar en 2');

      // De 2 a 2 (limite superior no desborda)
      assert.strictEqual(getNextStepIndex(2, totalSteps), 2, 'Avanzar desde 2 debe mantenerse en 2');

      // Indice superior fuera de rango debe quedar acotado a 2
      assert.strictEqual(getNextStepIndex(5, totalSteps), 2, 'Un indice 5 debe acotarse al limite superior 2');

      // Indice negativo normalizado antes de avanzar
      assert.strictEqual(getNextStepIndex(-1, totalSteps), 1, 'Un indice negativo normalizado a 0 avanza a 1');
    }
  },
  {
    name: 'Retroceso de pasos sin permitir indice menor a cero',
    run(assert) {
      // De 2 a 1
      assert.strictEqual(getPrevStepIndex(2), 1, 'Retroceder desde 2 debe resultar en 1');

      // De 1 a 0
      assert.strictEqual(getPrevStepIndex(1), 0, 'Retroceder desde 1 debe resultar en 0');

      // De 0 a 0 (limite inferior no desciende de cero)
      assert.strictEqual(getPrevStepIndex(0), 0, 'Retroceder desde 0 debe mantenerse en 0');

      // Indices negativos se acotan a 0
      assert.strictEqual(getPrevStepIndex(-1), 0, 'Retroceder desde un numero negativo debe acotarse a 0');
      assert.strictEqual(getPrevStepIndex(-10), 0, 'Retroceder desde -10 debe mantenerse en 0');
    }
  },
  {
    name: 'Regla de dispositivo de escritorio (width >= 1024)',
    run(assert) {
      // Casos verdaderos: escritorio
      assert.strictEqual(isDesktopDevice(1024), true, 'Ancho 1024 (limite exacto) debe ser escritorio');
      assert.strictEqual(isDesktopDevice(1280), true, 'Ancho 1280 debe ser escritorio');
      assert.strictEqual(isDesktopDevice(1440), true, 'Ancho 1440 debe ser escritorio');
      assert.strictEqual(isDesktopDevice(1920), true, 'Ancho 1920 (Full HD) debe ser escritorio');
      assert.strictEqual(isDesktopDevice(2560), true, 'Ancho 2560 (2K) debe ser escritorio');

      // Casos falsos: dispositivos moviles y tabletas
      assert.strictEqual(isDesktopDevice(1023), false, 'Ancho 1023 (inmediato inferior) no debe ser escritorio');
      assert.strictEqual(isDesktopDevice(768), false, 'Ancho 768 (tableta) no debe ser escritorio');
      assert.strictEqual(isDesktopDevice(480), false, 'Ancho 480 (movil apaisado) no debe ser escritorio');
      assert.strictEqual(isDesktopDevice(375), false, 'Ancho 375 (movil estandar) no debe ser escritorio');
      assert.strictEqual(isDesktopDevice(0), false, 'Ancho 0 no debe ser escritorio');

      // Casos especiales y tipos invalidos
      assert.strictEqual(isDesktopDevice(-1024), false, 'Anchos negativos no deben ser escritorio');
      assert.strictEqual(isDesktopDevice(NaN), false, 'NaN debe devolver false');
      assert.strictEqual(isDesktopDevice(null), false, 'null debe devolver false');
      assert.strictEqual(isDesktopDevice(undefined), false, 'undefined debe devolver false');
      assert.strictEqual(isDesktopDevice('1024'), false, 'Strings numericos deben devolver false');
    }
  },
  {
    name: 'Persistencia de estado en almacenamiento local simulado (guardado y reinicio)',
    run(assert) {
      const storage = createMockStorage();

      // Estado inicial vacio
      assert.strictEqual(getOnboardingStatus(storage), null, 'El estado inicial debe ser nulo');

      // Guardar valor 'completed'
      saveOnboardingStatus(storage, 'completed');
      assert.strictEqual(getOnboardingStatus(storage), 'completed', 'El valor guardado debe ser completed');

      // Sobrescribir valor
      saveOnboardingStatus(storage, 'dismissed');
      assert.strictEqual(getOnboardingStatus(storage), 'dismissed', 'El valor debe actualizarse a dismissed');

      // Reiniciar estado
      resetOnboardingStatus(storage);
      assert.strictEqual(getOnboardingStatus(storage), null, 'Despues de reiniciar el estado debe ser nulo');

      // Uso de clave personalizada
      const customKey = 'custom_onboarding_key';
      saveOnboardingStatus(storage, 'completed', customKey);
      assert.strictEqual(getOnboardingStatus(storage, customKey), 'completed', 'Debe persistir con clave personalizada');
      resetOnboardingStatus(storage, customKey);
      assert.strictEqual(getOnboardingStatus(storage, customKey), null, 'Debe reiniciar con clave personalizada');
    }
  }
];
