import { Collection, ObjectId } from 'mongodb'
import { MongoHelper, SurveyResultMongoRepository } from '@/infra/db/mongodb'
import { SurveyModel } from '@/domain/models/survey'

let surveyCollection: Collection
let accountCollection: Collection
let surveyResultCollection: Collection

const mockAccountId = async (): Promise<string> => {
  const result = await accountCollection.insertOne({
    name: 'any_name',
    email: 'any_email@mail.com',
    password: 'any_password',
    confirmPassword: 'any_password'
  })
  return result.ops[0]._id
}

const makeSurvey = async (): Promise<SurveyModel> => {
  const result = await surveyCollection.insertOne({
    question: 'any_question',
    answers: [{
      image: 'any_image',
      answer: 'any_answer_1'
    },
    {
      answer: 'any_answer_2'
    },
    {
      answer: 'any_answer_3'
    }],
    date: new Date()
  })
  return MongoHelper.mapper(result.ops[0])
}

const makeSut = (): SurveyResultMongoRepository => {
  return new SurveyResultMongoRepository()
}

describe('Account Mongo Repository', () => {
  beforeEach(async () => {
    surveyCollection = await MongoHelper.getCollection('surveys')
    await MongoHelper.clean('surveys')
    accountCollection = await MongoHelper.getCollection('accounts')
    await MongoHelper.clean('accounts')
    surveyResultCollection = await MongoHelper.getCollection('surveyResults')
    await MongoHelper.clean('surveyResults')
  })

  beforeAll(async () => {
    await MongoHelper.connect(process.env.MONGO_URL)
  })

  afterAll(async () => {
    await MongoHelper.disconnect()
  })

  describe('SAVE()', () => {
    it('Should add a survey result if its new', async () => {
      const sut = makeSut()
      const survey = await makeSurvey()
      const account = await mockAccountId()
      await sut.save({
        surveyId: survey.id,
        accountId: account,
        answer: survey.answers[0].answer,
        date: new Date()
      })
      const surveyResult = await surveyResultCollection.findOne({
        surveyId: survey.id,
        accountId: account
      })
      expect(surveyResult).toBeTruthy()
    })

    it('Should update a survey result if its not new', async () => {
      const sut = makeSut()
      const survey = await makeSurvey()
      const account = await mockAccountId()
      await surveyResultCollection.insertOne({
        surveyId: new ObjectId(survey.id),
        accountId: new ObjectId(account),
        answer: survey.answers[0].answer,
        date: new Date()
      })
      await sut.save({
        surveyId: survey.id,
        accountId: account,
        answer: survey.answers[1].answer,
        date: new Date()
      })
      const surveyResult = await surveyResultCollection.find({
        surveyId: survey.id,
        accountId: account
      }).toArray()
      expect(surveyResult).toBeTruthy()
      expect(surveyResult.length).toBe(1)
    })
  })

  describe('LOAD BY SURVEY ID()', () => {
    it('Should load a survey result', async () => {
      const sut = makeSut()
      const survey = await makeSurvey()
      const account = await mockAccountId()
      const account2 = await mockAccountId()
      await surveyResultCollection.insertMany([{
        surveyId: new ObjectId(survey.id),
        accountId: new ObjectId(account),
        answer: survey.answers[0].answer,
        date: new Date()
      },{
        surveyId: new ObjectId(survey.id),
        accountId: new ObjectId(account),
        answer: survey.answers[0].answer,
        date: new Date()
      },{
        surveyId: new ObjectId(survey.id),
        accountId: new ObjectId(account2),
        answer: survey.answers[1].answer,
        date: new Date()
      },{
        surveyId: new ObjectId(survey.id),
        accountId: new ObjectId(account2),
        answer: survey.answers[2].answer,
        date: new Date()
      }])
      const surveyResult = await sut.loadBySurveyId(survey.id, account)
      expect(surveyResult).toBeTruthy()
      expect(surveyResult.surveyId).toEqual(survey.id)
      expect(surveyResult.answers[0].count).toBe(2)
      expect(surveyResult.answers[0].percent).toBe(50)
      expect(surveyResult.answers[0].isCurrentAccountAnswer).toBe(true)
      expect(surveyResult.answers[1].count).toBe(1)
      expect(surveyResult.answers[1].percent).toBe(25)
      expect(surveyResult.answers[1].isCurrentAccountAnswer).toBe(false)
      expect(surveyResult.answers[2].count).toBe(1)
      expect(surveyResult.answers[2].percent).toBe(25)
      expect(surveyResult.answers[2].isCurrentAccountAnswer).toBe(false)
    })
  })
})
