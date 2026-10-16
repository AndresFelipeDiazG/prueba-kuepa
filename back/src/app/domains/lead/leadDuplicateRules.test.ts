import assert from 'node:assert/strict'
import test from 'node:test'
import { getDuplicateLeadErrors } from './leadDuplicateRules'

const candidate = {
  mobile_phone: '3001234567',
  document_type: 'cc',
  document: '123456789',
}

test('detects a duplicated phone number', () => {
  assert.deepEqual(
    getDuplicateLeadErrors({ mobile_phone: candidate.mobile_phone }, candidate),
    { mobile_phone: 'Ya existe un lead con este teléfono' },
  )
})

test('detects a duplicated document of the same type', () => {
  assert.deepEqual(
    getDuplicateLeadErrors({ document_type: 'cc', document: candidate.document }, candidate),
    { document: 'Ya existe un lead con este documento' },
  )
})

test('allows a document number reused with another document type', () => {
  assert.deepEqual(
    getDuplicateLeadErrors({ document_type: 'ti', document: candidate.document }, candidate),
    {},
  )
})
