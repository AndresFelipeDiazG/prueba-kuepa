
import { persistentAtom } from '@nanostores/persistent'
import moment from 'moment'
import { atom } from 'nanostores'
import { nanoid } from 'nanoid'

const user = persistentAtom(`kuepa:1.0:context:user`,null, {
  encode: JSON.stringify,
  decode: JSON.parse,
}) 

const token = persistentAtom(`kuepa:1.0:context:token`,null, {
  encode: JSON.stringify,
  decode: JSON.parse,
}) 

const access = persistentAtom(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:context:access`,null, {
  encode: JSON.stringify,
  decode: JSON.parse,
}) 

const theme = persistentAtom(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:theme`,null, {
  encode: JSON.stringify,
  decode: JSON.parse,
}) 

const attendance = persistentAtom(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:attendance`,null, {
  encode: JSON.stringify,
  decode: JSON.parse,
}) 

const app = persistentAtom(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:app`,{
  sidebar: true,
  accent: 'zinc',
  favorites:[]
}, {
  encode: JSON.stringify,
  decode: JSON.parse,
}) 

const toggleFavorites = (module) =>{
  let aux = app.get().favorites || []
  if(aux.length > 4){
    aux = aux.slice(0, 4)
  }
  aux = aux.filter((item)=>item.name !== module.name)
  aux.unshift(module)
  app.set({
    ...app.get(),
    favorites: aux
  })
}

const unToggleRecent =async ({module, object}) => {
  const _recent = await localStorage.getItem(`kuepa:1.0:${user.get()?._id || 'no-user'}:crud:recent:${module}`) 
    let recent = []
    if(_recent){
      recent = JSON.parse(_recent)
    }
    recent = recent.filter((item)=>item._id !== object._id)
    localStorage.setItem(`kuepa:1.0:${user.get()?._id || 'no-user'}:crud:recent:${module}`, JSON.stringify(recent))
}

const toggleRecent =async ({module, object}) => {
  const _recent = await localStorage.getItem(`kuepa:1.0:${user.get()?._id || 'no-user'}:crud:recent:${module}`) 
    let recent = []
    if(_recent){
      recent = JSON.parse(_recent)
    }
    if(recent.length >= 4){
      recent.pop()
      recent = recent.slice(0, 3)
    }
    recent = recent.filter((item)=>item._id !== object._id)
    recent.unshift(object)
    localStorage.setItem(`kuepa:1.0:${user.get()?._id || 'no-user'}:crud:recent:${module}`, JSON.stringify(recent))
}

const booking = persistentAtom(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:booking`,{
  sidebar: true,
  accent: 'zinc'
}, {
  encode: JSON.stringify,
  decode: JSON.parse,
}) 

const device = persistentAtom(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:device`,null, {
  encode: JSON.stringify,
  decode: JSON.parse,
})

if(device.get() === null || !device.get()._recover || moment.utc(device.get()._recover).isBefore(moment.utc())){
  device.set({
    _set: moment.utc().toISOString(),
    device:  device.get()?.device || nanoid(),
    _recover: moment.utc().add(7,'days').toISOString()
  })
}

const set:any = access.set
access.set = (params?:any) => {
  if(params !== null){
    return set(params)
  }
}

const can = (what:string) =>{
  return true
  return access?.get()?.can?.includes('all') || access?.get()?.can?.includes(what) 
}

const loading = atom(false) 

export { token, user, loading,access, can, theme, app, attendance, device, booking, toggleFavorites, toggleRecent, unToggleRecent }