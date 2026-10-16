import { Request, Response } from 'express'
import { LeadStageService } from '@app/domains/leadStage/leadStageService'
import { responseUtility } from '@core/utilities/responseUtility'

class LeadStageController {
  private service = new LeadStageService()

  public list = async (req: Request, res: Response) => {
    const response = await this.service.list(req._data())
    return responseUtility.build(res, response)
  }

  public upsert = async (req: Request, res: Response) => {
    const response = await this.service.upsert(req._data())
    return responseUtility.build(res, response)
  }

  public archive = async (req: Request, res: Response) => {
    const response = await this.service.archive(req._data())
    return responseUtility.build(res, response)
  }
}

export const leadStageController = new LeadStageController()
export { LeadStageController }
