import assert from 'node:assert/strict'
import test from 'node:test'
import { validateLeadInput } from './leadValidation'

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
  assert.deepEqual(result.value?.tags, ['Interesada'])
})

test('returns field errors for an incomplete lead', () => {
  const result = validateLeadInput({})

  assert.equal(result.value, undefined)
  assert.equal(result.errors.first_name, 'El nombre es obligatorio')
  assert.equal(result.errors.email, 'El correo electrónico no es válido')
  assert.equal(result.errors.stage, 'La etapa es obligatoria')
})
