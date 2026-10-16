// @import_dependencies

// @import_services

// @import_models
import { Lead, Campaign, Third, Adnetwork, Tracking, Message, Interaction } from "@app/models"
import { LeadStage, Program, User } from "@app/models"
import mongoose from 'mongoose'

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import moment from "moment";
import { validateLeadInput } from '@app/domains/lead/leadValidation'

// @import_types


class LeadService {
  
  
  constructor () {}

  public async create (_params) {
    try {
      const validation = validateLeadInput(_params)

      if (!validation.value) {
        return responseUtility.error('lead.invalid_data', null, {
          code: 400,
          errors: validation.errors,
        })
      }

      const leadData = validation.value
      const references = [leadData.responsible, leadData.interestProgram, leadData.stage]

      if (references.some(reference => !mongoose.isValidObjectId(reference))) {
        return responseUtility.error('lead.invalid_reference', null, { code: 400 })
      }

      const [responsible, program, stage] = await Promise.all([
        User.findOne({ _id: leadData.responsible, status: 'active' }).select('_id').lean(),
        Program.findOne({ _id: leadData.interestProgram }).select('_id').lean(),
        LeadStage.findOne({ _id: leadData.stage, status: 'active' }).select('_id').lean(),
      ])

      if (!responsible) return responseUtility.error('lead.responsible_not_found', null, { code: 404 })
      if (!program) return responseUtility.error('lead.program_not_found', null, { code: 404 })
      if (!stage) return responseUtility.error('lead.stage_not_found', null, { code: 404 })

      const lead = await Lead.create({
        ...leadData,
        full_name: `${leadData.first_name} ${leadData.last_name}`.trim(),
      })

      return responseUtility.success({ object: lead.toObject() })
    } catch (error) {
      console.log('Lead create error', error)
      return responseUtility.error('lead.create_error', null, { code: 500 })
    }
  }

  public async move (_params) {
    try {
      if (!mongoose.isValidObjectId(_params._id) || !mongoose.isValidObjectId(_params.stage)) {
        return responseUtility.error('lead.invalid_reference', null, { code: 400 })
      }

      const [lead, stage] = await Promise.all([
        Lead.findOne({ _id: _params._id, status: 'active' }),
        LeadStage.findOne({ _id: _params.stage, status: 'active' }).select('_id').lean(),
      ])

      if (!lead) return responseUtility.error('lead.not_found', null, { code: 404 })
      if (!stage) return responseUtility.error('lead.stage_not_found', null, { code: 404 })

      lead.stage = stage._id
      await lead.save()

      return responseUtility.success({ object: lead.toObject() })
    } catch (error) {
      console.log('Lead move error', error)
      return responseUtility.error('lead.move_error', null, { code: 500 })
    }
  }
  
  public async upsert (_params) {
    try{ 
      if (_params.first_name || _params.last_name || _params.document_type || _params.interestProgram || _params.stage) {
        return await this.create(_params)
      }

      if(_params.user){
        const third = await Third.findOne({user: _params.user}).lean()
        if(!third) return responseUtility.error('third.not_found1');
        _params.adviser = third._id
      }
      
      if(_params.third){
        const third = await Third.findOne({_id: _params.third}).lean()
        if(!third) return responseUtility.error('third.not_found2');
        _params.adviser = third._id
      }
      
      let last_tracking = _params?.trackings?.[_params?.trackings?.length - 1]
      if(last_tracking?.new){
        const tracking = await Tracking.findOne({_id: last_tracking.tracking}).lean()
        if(tracking?.target_status){
          _params.status = tracking.target_status
        }
        if(!last_tracking.has_next_date && _params.status !== 'sold'){
          _params.status = 'dropped'
        }
      }
      
      if(_params._id){
        const exists = await Lead.findOne({_id: _params._id}).lean()
        if(!exists) return responseUtility.error('lead.not_found');
        
        const lead = await Lead.findOneAndUpdate({_id: _params._id}, {$set: _params}, {new:true, lean:true})
        
        
        return responseUtility.success({
          object: lead
        })
      } else {
        const create = await Lead.create(_params)
        const lead = create.toObject()
        
        
        return responseUtility.success({
          object: lead
        })
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async adviserInfo (_params){
    try{
      const third = await Third.findOne({user: _params.user}).lean()
      if(!third) return responseUtility.error('third.not_found',null, {code: 404});
      
      const where_campaigns = {
        status: 'active',
      }
      let select_campaigns = 'name users.$'
      if(_params.campaign){
        where_campaigns['_id'] = _params.campaign
        select_campaigns = 'name users'
      } else {
        where_campaigns['users.third'] = third._id
      }
      
      const campaigns = await Campaign.find(where_campaigns)
      .select(select_campaigns)
      .sort({created_at:1})
      .lean()
      
      const _adnetworks = {}
      campaigns.forEach(_c=>{
        _c.users.forEach(_u=>{
          _u.adnetworks.forEach(_a=>{
            _adnetworks[_a] = _c._id
          })
        })
      })
      
      const [ adnetworks, leads, trackings] = await Promise.all([
        Adnetwork.find({
          status: 'active',
          _id: { $in: Object.keys(_adnetworks) }
        })
        .lean(),
        Lead.find({
          campaign: { $in: campaigns.map((_c:any)=>{return _c._id}) },
          status: {$in:['active', 'grading']},
          contact:  _params.contact
        })
        .lean(),
        Tracking.find({
          status: 'active'
        })
      ])
      
      return responseUtility.success({
        campaigns,
        leads, 
        adnetworks,
        parser: _adnetworks,
        trackings
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async external (_params) {
    try{
      
      const create_interaction = {
        target: 'human',
        number: _params.number,
        last_inbound: moment().toISOString(),
        source: 'machine',
        type: 'form',
        status: 'ended',
        messages:[],
        _ref:{
          lead: null,
          adviser: null,
          contact: null
        }
      }
      
      let third
      if(_params.contact){
        third = await Third.findOne({_id: _params.contact}).lean()
      } else {
        third = await Third.findOne({number: _params.number,  type: 'cli'}).lean()
      }
      if(third){
        if(_params.content){
          const message_created = await Message.create({
            sender: third._id,
            inbound: true,
            content: _params.content,
            number: _params.number,
            type: 'form',
            source: 'web',
          })
          create_interaction.messages.push(message_created._id)
        }
        const lead = _params.not_found ?? await Lead.findOne({ contact: third._id, status: {$in:['active', 'grading']}}).lean()
        if(lead){
          const tracking = await Tracking.findOne({ 'defaults.again': true}).lean()
          await Lead.updateOne({_id: lead._id}, {
            $push: {
              trackings: {
                ...(lead.trackings?.[lead.trackings.length -1] || {}),
                tracking: tracking._id,
                interest: 4,
                created_at: moment().toISOString(),
              }
            }
          })
          
          create_interaction._ref.lead = lead._id
          create_interaction._ref.adviser = third._id
          create_interaction._ref.contact = lead.contact
          
          await Interaction.create(create_interaction)
          
          return responseUtility.success({
            object: lead
          })
        } else {
          const adnetwork = await Adnetwork.findOne({'defaults.organic': true}).lean()
          const campaign = await Campaign.findOne({status: 'active', 'users.adnetworks': adnetwork._id})
          .select('users.$')
          .lean()
          
          return await this.upsert({
            third: campaign.users[0].third, 
            contact: third._id, 
            adnetwork: adnetwork._id, 
            campaign: campaign._id
          })
        }
      } else {
        const create = await Third.create({
          email: _params.email,
          first_name: _params.first_name,
          last_name: _params.last_name,
          number: _params.number,
          status: 'active',
          location:{
            type: 'Point',
            coordinates: [0, 0]
          },
          type: 'cli',
        })
        const third = create.toObject()
        const adnetwork = await Adnetwork.findOne({'defaults.organic': true}).lean()
        const campaign = await Campaign.findOne({status: 'active', 'users.adnetworks': adnetwork._id})
        .select('users.$')
        .lean()

        //TODO: Balance
        if(_params.content){
          const message_created = await Message.create({
            sender: third._id,
            inbound: true,
            content: _params.content,
            number: _params.number,
            type: 'form',
            source: 'web',
          })
          create_interaction.messages.push(message_created._id)
        }
        
        const lead_created = await this.upsert({
          third: campaign.users[0].third, 
          contact: third._id, 
          adnetwork: adnetwork._id, 
          campaign: campaign._id
        })
        
        create_interaction._ref.lead = lead_created.object._id
        create_interaction._ref.adviser = third._id
        create_interaction._ref.contact = lead_created.object.contact
        if(!_params.ignore_interaction){
          await Interaction.create(create_interaction)
        }
        return lead_created
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async list (_params) {
    try{
      const where:any = {}

      where.status = _params.status === 'inactive' ? 'inactive' : 'active'

      if (_params.stage && mongoose.isValidObjectId(_params.stage)) {
        where.stage = _params.stage
      }
      
      let third
      
      if(_params.user){
        third = await Third.findOne({user: _params.user}).lean()
        if(third) where.adviser = third._id.toString()
      }
      
      
      let leads = await Lead.find(where)
      .sort({created_at:-1})
      .populate({
        path: 'contact',
        select: 'first_name last_name document number',
        options: { lean:true }
      })
      .populate({
        path: 'responsible',
        select: '_id username profile',
        options: { lean:true },
      })
      .populate({
        path: 'interestProgram',
        select: '_id name description',
        options: { lean:true },
      })
      .populate({
        path: 'stage',
        select: '_id name key color order status',
        options: { lean:true },
      })
      .limit(100)
      .lean()
      
      leads = leads.map(_l=>{
        _l.full_name = `${_l.contact?.first_name} ${_l.contact?.last_name}`.trim()
        return _l
      })
      
      return responseUtility.success({
        list:leads
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async test (_params) {
    try{
      
    } catch (error) {
      console.log('error', error)
    }
  }
  

  
  public async get (_params:{_id:string}) {
    try{
      const lead = await Lead.findOne({_id: _params._id})
      .populate({
        path: 'contact',
        select: 'first_name last_name incremental document number',
        options: { lean:true }
      })
      .lean()
      
      if(!lead) return responseUtility.error('lead.not_found');
      const interactions = await Interaction.find({'_ref.lead': _params._id})
      .populate({
        path: 'messages',
        select: 'inbound from to content created_at',
        options: { lean:true }
      })
      .sort({crated_at:-1})
      .lean()
      return responseUtility.success({
        lead,
        interactions
      })
      
    } catch (error) {
      console.log('error', error)
    }
  }
}



export const leadService = new LeadService()
export { LeadService }
