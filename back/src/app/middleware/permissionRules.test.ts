import assert from 'node:assert/strict'
import test from 'node:test'
import { hasPermission } from './permissionRules'

test('allows a permission assigned to a role in the requested app', () => {
  const homes = [{
    app: 'kuepa',
    roles: [{ permissions: [{ content: 'crm:lead-stages:manage' }] }],
  }]

  assert.equal(hasPermission(homes, 'crm:lead-stages:manage'), true)
})

test('rejects a permission from another app', () => {
  const homes = [{
    app: 'other-app',
    roles: [{ permissions: [{ content: 'crm:lead-stages:manage' }] }],
  }]

  assert.equal(hasPermission(homes, 'crm:lead-stages:manage'), false)
})

test('rejects users without the requested permission', () => {
  const homes = [{
    app: 'kuepa',
    roles: [{ permissions: [{ content: 'crm:leads:read' }] }],
  }]

  assert.equal(hasPermission(homes, 'crm:lead-stages:manage'), false)
})

test('allows a permission assigned directly to a home', () => {
  const homes = [{
    app: 'kuepa',
    permissions: [{ content: 'crm:lead-stages:manage' }],
  }]

  assert.equal(hasPermission(homes, 'crm:lead-stages:manage'), true)
})
