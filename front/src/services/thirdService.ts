import { get, post } from '../util/http'

const api = '/third'

export type ContactPayload = {
  _id?: string
  first_name: string
  last_name: string
  email: string
  number: string
  document_type: string
  document: string
  tags?: string[]
  incremental?: number
  mobile_phone?: string
  trackings?: Array<{ tracking?: string | { _id: string; name?: string; description?: string }; description?: string }>
  responsible?: string
  origin?: string
  interestProgram?: string
  lead_status?: 'active' | 'inactive'
  type: 'cli'
  status?: 'active' | 'crafting' | 'archived'
}

export const thirdService = {
  list: async (params: Record<string, string> = {}) => await get({ api: `${api}/`, options: { params } }),
  upsert: async (data: ContactPayload) => await post({ api: `${api}/upsert`, options: { data } }),
  get: async (_id: string) => await get({ api: `${api}/get/${_id}` }),
  addNote: async (data: { _id: string; text: string }) => await post({ api: `${api}/note`, options: { data } }),
  delete: async (_id: string) => await post({ api: `${api}/delete`, options: { data: { _id } } }),
}
