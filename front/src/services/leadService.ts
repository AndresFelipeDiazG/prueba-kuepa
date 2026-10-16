import { get, post } from "../util/http"
const api = '/lead'
export const leadService = {
  api,
  list: async (params: Record<string, string> = {}) => {
    return await get({api, options: { params }})
  },
  get: async({_id}:{_id:string}) =>{
    return await get({api: `${api}/get/${_id}`})
  },
  create: async (data: Record<string, unknown>) => {
    return await post({api: `${api}/create`, options: {data}})
  },
  move: async (data: {_id: string, stage: string}) => {
    return await post({api: `${api}/move`, options: {data}})
  },
  stages: async (includeArchived = false) => {
    return await get({
      api: '/lead-stage/',
      options: { params: includeArchived ? { include_archived: 'true' } : {} },
    })
  },
  saveStage: async (data: Record<string, unknown>) => {
    return await post({api: '/lead-stage/upsert', options: {data}})
  },
  archiveStage: async (_id: string) => {
    return await post({api: '/lead-stage/archive', options: {data: {_id}}})
  },
  programs: async () => {
    return await get({api: '/program/'})
  },
  assignees: async () => {
    return await get({api: '/user/assignees'})
  },
}

