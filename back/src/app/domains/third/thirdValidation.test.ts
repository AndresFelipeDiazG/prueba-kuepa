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

test('validates and normalizes the new contact fields', () => {
  const result = validateContactInput({
    ...validContact,
    birthdate: ' 1995-04-18 ',
    city: ' Medellín ',
    department: 'Antioquia',
    educationLevel: 'undergraduate',
  })

  assert.deepEqual(result.errors, {})
  assert.equal(result.value?.birthdate, '1995-04-18')
  assert.equal(result.value?.city, 'Medellín')
  assert.equal(result.value?.department, 'Antioquia')
  assert.equal(result.value?.educationLevel, 'undergraduate')
})

test('rejects a future or malformed birthdate', () => {
  const future = validateContactInput({ ...validContact, birthdate: '3000-01-01' })
  const malformed = validateContactInput({ ...validContact, birthdate: '18/04/1995' })

  assert.equal(future.errors.birthdate, 'La fecha de nacimiento no puede ser futura')
  assert.equal(malformed.errors.birthdate, 'La fecha de nacimiento no es válida')
})

test('rejects a department or education level outside the catalog', () => {
  const result = validateContactInput({ ...validContact, department: 'Narnia', educationLevel: 'phd' })

  assert.equal(result.errors.department, 'Selecciona un departamento válido')
  assert.equal(result.errors.educationLevel, 'Selecciona un nivel de escolaridad válido')
})

test('rejects a city longer than eighty characters', () => {
  const result = validateContactInput({ ...validContact, city: 'M'.repeat(81) })

  assert.equal(result.errors.city, 'La ciudad no puede superar 80 caracteres')
})
