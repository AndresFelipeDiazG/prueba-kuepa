import { Program } from '@app/models'
import { responseUtility } from '@core/utilities/responseUtility'

class ProgramService {
  public async list () {
    try {
      const list = await Program.find({}).sort({ name: 1 }).lean()
      return responseUtility.success({ list })
    } catch (error) {
      console.error('Program list error', error)
      return responseUtility.error('program.list_error', null, { code: 500 })
    }
  }
}

export const programService = new ProgramService()
export { ProgramService }
