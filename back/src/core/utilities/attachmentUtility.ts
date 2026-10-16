import { Progress, Upload } from "@aws-sdk/lib-storage"
import { S3Client } from "@aws-sdk/client-s3"
import config from 'config'
import { v4 as unique } from 'uuid'
import axios from "axios"


class AttachmentUtility {
  
  constructor () { }
  
  public upload = async (_params: {file?:File, base64?:string, type: 'jpeg'| 'csv' | 'json', content: 'image/jpeg' | 'text/csv'  | 'application/json', path?:string, progress?:(a:Progress)=>void}) =>{
    try{
      const target:any = { 
        Bucket: config.aws.s3.domain, 
        Key: `${config.mode}${_params.path ? _params.path : ''}/${unique()}.${_params.type}`, 
        Body: null,
        ACL: 'public-read',
        ContentType: _params.content
      }

      if(_params.base64){
        const _response = await  axios.get(`data:${_params.content};base64,${_params.base64}`)
        target.Body  = _response.data
      }

      if(_params.file){
        target.Body  = _params.file
      }
      
      const upload = new Upload({
        client: new S3Client({
          region:config.aws.s3.region, 
          credentials: {
            accessKeyId: config.aws.s3.public, 
            secretAccessKey: config.aws.s3.key
          },
        }),
        queueSize: 4, 
        leavePartsOnError: false,
        params: target,
      })
      
      if(_params.progress) {
        upload.on("httpUploadProgress", _params.progress);
      }
      

      const _response =  await upload.done()
      
      const response = {
        code: _response['$metadata'].httpStatusCode,
        path: _response.Location
      }
      return response
    } catch (error) {
      console.log('error', error)
    }
  }
}
export const attachmentUtility = new AttachmentUtility()