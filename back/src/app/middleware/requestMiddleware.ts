import { Request, Response, NextFunction } from 'express'


export const request= () => {
  return (req:Request, res: Response, next: NextFunction) => {
    res.type('json') 
    req._data = () => ({...req.params, ...req.query, ...req.body})
    next()
  }
}