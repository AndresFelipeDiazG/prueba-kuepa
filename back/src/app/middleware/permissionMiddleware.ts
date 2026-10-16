import { NextFunction, Request, Response } from 'express'
import { User } from '@app/models'
import { responseUtility } from '@core/utilities/responseUtility'
import { hasPermission } from './permissionRules'

export const requirePermission = (permission: string, app = 'kuepa') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params?.user_logged

      if (!userId) {
        return responseUtility.build(
          res,
          responseUtility.error('unauthorize', null, { code: 401 }),
        )
      }

      const user = await User.findOne({ _id: userId, status: 'active' })
        .select('homes')
        .populate({
          path: 'homes.roles',
          select: 'app permissions',
          populate: {
            path: 'permissions',
            select: 'app content',
          },
        })
        .lean()

      if (!user || !hasPermission(user.homes, permission, app)) {
        return responseUtility.build(
          res,
          responseUtility.error('forbidden', null, { code: 403 }),
        )
      }

      return next()
    } catch (error) {
      console.error('Permission middleware error', error)
      return responseUtility.build(
        res,
        responseUtility.error('permission.error', null, { code: 500 }),
      )
    }
  }
}
