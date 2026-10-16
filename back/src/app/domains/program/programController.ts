import { Request, Response } from 'express'
import { ProgramService } from '@app/domains/program/programService'
import { responseUtility } from '@core/utilities/responseUtility'

class ProgramController {
  private service = new ProgramService()

  public list = async (_req: Request, res: Response) => {
    const response = await this.service.list()
    return responseUtility.build(res, response)
  }
}

export const programController = new ProgramController()
export { ProgramController }
