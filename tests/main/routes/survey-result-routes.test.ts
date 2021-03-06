import request from 'supertest'
import { Collection } from 'mongodb'
import { sign } from 'jsonwebtoken'
import app from '@/main/config/app'
import env from '@/main/config/env'
import { MongoHelper } from '@/infra/db/mongodb'

let accountCollection: Collection
let surveyCollection: Collection

const mockAccessToken = async (): Promise<string> => {
  const result = await accountCollection.insertOne({
    name: 'Matheus',
    email: 'matheus@gmail.com',
    password: '1234',
    passwordConfirmation: '1234'
  })
  const id = result.ops[0]._id
  const accessToken = sign({ id }, env.secret)
  await accountCollection.updateOne({
    _id: id
  }, {
    $set: {
      accessToken
    }
  })
  return accessToken
}

describe('Survey Routes', () => {
  beforeEach(async () => {
    accountCollection = await MongoHelper.getCollection('accounts')
    surveyCollection = await MongoHelper.getCollection('surveys')
    await MongoHelper.clean('surveys')
    await MongoHelper.clean('accounts')
  })

  beforeAll(async () => {
    await MongoHelper.connect(process.env.MONGO_URL)
  })

  afterAll(async () => {
    await MongoHelper.disconnect()
  })

  describe('PUT /surveys/:surveyId/results', () => {
    it('Should return 403 on save survey without accessToken', async () => {
      await request(app)
        .put('/api/surveys/any_id/results')
        .send({
          answer: 'any_answer'
        })
        .expect(403)
    })

    it('Should return 200 on save survey result with accessToken', async () => {
      const accessToken = await mockAccessToken()
      const result = await surveyCollection.insertOne({
        question: 'Question',
        answers: [{
          answer: 'Answer 1',
          image: 'http://image-name.com'
        }, {
          answer: 'Answer 2'
        }],
        date: new Date()
      })
      await request(app)
        .put(`/api/surveys/${result.ops[0]._id}/results`)
        .set('x-access-token', accessToken)
        .send({
          answer: 'Answer 1'
        })
        .expect(200)
    })
  })

  describe('GET /surveys/:surveyId/results', () => {
    it('Should return 403 on load survey without accessToken', async () => {
      await request(app)
        .get('/api/surveys/any_id/results')
        .expect(403)
    })

    it('Should return 200 on load survey result with accessToken', async () => {
      const accessToken = await mockAccessToken()
      const result = await surveyCollection.insertOne({
        question: 'Question',
        answers: [{
          answer: 'Answer 1',
          image: 'http://image-name.com'
        }, {
          answer: 'Answer 2'
        }],
        date: new Date()
      })
      await request(app)
        .get(`/api/surveys/${result.ops[0]._id}/results`)
        .set('x-access-token', accessToken)
        .expect(200)
    })
  })
})
