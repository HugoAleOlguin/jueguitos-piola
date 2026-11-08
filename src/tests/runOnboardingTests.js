/**
 * Script ejecutor de pruebas ligeras para la logica de onboarding.
 * Ejecuta aserciones nativas con 'node:assert/strict' sin dependencias pesadas.
 */

import assert from 'node:assert/strict';
import { tests } from './onboardingLogic.test.js';

function runOnboardingSuite() {
  const startTime = Date.now();
  let passedCount = 0;
  let failedCount = 0;
  const failures = [];

  console.log('----------------------------------------------------');
  console.log('Ejecutando suite de pruebas: Onboarding Logic');
  console.log('----------------------------------------------------');

  for (let index = 0; index < tests.length; index++) {
    const testCase = tests[index];
    const number = index + 1;
    try {
      testCase.run(assert);
      passedCount++;
      console.log(`[PASS] ${number}. ${testCase.name}`);
    } catch (error) {
      failedCount++;
      console.error(`[FAIL] ${number}. ${testCase.name}`);
      console.error(`       Causa: ${error.message}`);
      failures.push({
        index: number,
        name: testCase.name,
        error
      });
    }
  }

  const duration = Date.now() - startTime;

  console.log('----------------------------------------------------');
  console.log('Resumen de ejecucion:');
  console.log(`- Pruebas exitosas: ${passedCount}`);
  console.log(`- Pruebas fallidas: ${failedCount}`);
  console.log(`- Total evaluadas:  ${tests.length}`);
  console.log(`- Tiempo total:     ${duration}ms`);
  console.log('----------------------------------------------------');

  if (failedCount > 0) {
    console.error('\nDetalles de aserciones fallidas:');
    failures.forEach((f) => {
      console.error(`\nPrueba ${f.index}: ${f.name}`);
      console.error(f.error.stack || f.error.message);
    });
    process.exit(1);
  } else {
    console.log('\nResultado: Todas las pruebas pasaron satisfactoriamente.');
    process.exit(0);
  }
}

runOnboardingSuite();
