import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateContactInput } from './thirdValidation'

const validContact = {
  first_name: 'Ana',
  last_name: 'Gómez',
  email: 'ana@example.com',
  number: '3001234567',
  document_type: 'cc',
  document: '1234567890',
}

test('validates and normalizes a contact', () => {
  const result = validateContactInput({ ...validContact, first_name: ' Ana ', number: ' 3001234567 ' })

  assert.deepEqual(result.errors, {})
  assert.equal(result.value?.first_name, 'Ana')
  assert.equal(result.value?.number, '3001234567')
})

test('requires an exact ten-digit phone number', () => {
  const result = validateContactInput({ ...validContact, number: '3001234' })

  assert.equal(result.errors.number, 'El teléfono debe tener exactamente 10 dígitos')
})

test('rejects letters in document and phone values', () => {
  const result = validateContactInput({ ...validContact, number: '3001234ABC', document: '12ABC' })

  assert.equal(result.errors.number, 'El teléfono solo puede contener números')
  assert.equal(result.errors.document, 'El documento solo puede contener números')
})
