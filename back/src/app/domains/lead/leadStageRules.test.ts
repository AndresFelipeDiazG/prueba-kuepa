import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canArchiveStage,
  createStageKey,
  isValidStageColor,
  isValidStageOrder,
  normalizeStageName,
  normalizeTags,
  validateStageName,
} from './leadStageRules'

test('normalizes stage names without changing their readable format', () => {
  assert.equal(normalizeStageName('  En   seguimiento  '), 'En seguimiento')
})

test('creates a stable key from a stage name', () => {
  assert.equal(createStageKey('  En seguimiento  '), 'en-seguimiento')
  assert.equal(createStageKey('Calificación'), 'calificacion')
})

test('validates stage names', () => {
  assert.equal(validateStageName(''), 'El nombre de la etapa es obligatorio')
  assert.equal(validateStageName('A'), 'El nombre de la etapa debe tener al menos 2 caracteres')
  assert.equal(validateStageName('Nueva fase'), null)
})

test('does not allow archiving the only active stage', () => {
  assert.equal(canArchiveStage(1), false)
  assert.equal(canArchiveStage(2), true)
})

test('validates stage color and order', () => {
  assert.equal(isValidStageColor('#2563eb'), true)
  assert.equal(isValidStageColor('blue'), false)
  assert.equal(isValidStageOrder(1), true)
  assert.equal(isValidStageOrder(0), false)
  assert.equal(isValidStageOrder('1'), false)
})

test('normalizes and deduplicates tags', () => {
  assert.deepEqual(normalizeTags([' Urgente ', 'Becas', 'Urgente', '', null]), ['Urgente', 'Becas'])
  assert.deepEqual(normalizeTags('Urgente'), [])
})
