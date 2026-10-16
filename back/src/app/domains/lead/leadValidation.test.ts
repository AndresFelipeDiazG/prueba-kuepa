import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeDocument, normalizeMobilePhone, validateLeadInput } from './leadValidation'

const validLead = {
  first_name: 'Ana',
  last_name: 'Pérez',
  email: 'ANA@EXAMPLE.COM',
  mobile_phone: '3001234567',
  document_type: 'cc',
  document: '123456789',
  responsible: '507f1f77bcf86cd799439011',
  origin: 'website',
  tags: [' Interesada ', 'Interesada'],
  interestProgram: '507f1f77bcf86cd799439012',
  stage: '507f1f77bcf86cd799439013',
}

test('validates and normalizes a lead', () => {
  const result = validateLeadInput(validLead)

  assert.deepEqual(result.errors, {})
  assert.equal(result.value?.email, 'ana@example.com')
  assert.equal(result.value?.mobile_phone, '3001234567')
  assert.equal(result.value?.document, '123456789')
  assert.deepEqual(result.value?.tags, ['Interesada'])
})

test('normalizes phone and document values', () => {
  assert.equal(normalizeMobilePhone(' 3001234567 '), '3001234567')
  assert.equal(normalizeDocument(' 123456 '), '123456')
})

test('validates malformed personal data', () => {
  const result = validateLeadInput({
    ...validLead,
    first_name: 'Ana123',
    email: 'correo-invalido',
    mobile_phone: '12ABC',
    document: 'a',
  })

  assert.equal(result.value, undefined)
  assert.equal(result.errors.first_name, 'El nombre solo puede contener letras y espacios')
  assert.equal(result.errors.email, 'El correo electrónico no es válido')
  assert.equal(result.errors.mobile_phone, 'El teléfono solo puede contener números')
  assert.equal(result.errors.document, 'El documento solo puede contener números')
})

test('rejects letters in phone and document values', () => {
  const result = validateLeadInput({
    ...validLead,
    mobile_phone: '3001234ABC',
    document: '12345ABC',
  })

  assert.equal(result.errors.mobile_phone, 'El teléfono solo puede contener números')
  assert.equal(result.errors.document, 'El documento solo puede contener números')
})

test('rejects phone and document values that exceed their limits', () => {
  const result = validateLeadInput({
    ...validLead,
    mobile_phone: '1234567890123456',
    document: '123456789012345678901',
  })

  assert.equal(result.errors.mobile_phone, 'El teléfono debe tener exactamente 10 dígitos')
  assert.equal(result.errors.document, 'El documento debe tener entre 4 y 20 dígitos')
})

test('returns field errors for an incomplete lead', () => {
  const result = validateLeadInput({})

  assert.equal(result.value, undefined)
  assert.equal(result.errors.first_name, 'El nombre es obligatorio')
  assert.equal(result.errors.email, 'El correo electrónico no es válido')
  assert.equal(result.errors.stage, 'La etapa es obligatoria')
})
