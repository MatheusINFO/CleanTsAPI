import { LogMongoRepository } from './log'
import { MongoHelper } from '../helper/mongo-helper'

describe('Log Mongo Repository', () => {
  beforeEach(async () => {
    await MongoHelper.clean('errors')
  })

  beforeAll(async () => {
    await MongoHelper.connect(process.env.MONGO_URL)
  })

  afterAll(async () => {
    await MongoHelper.disconnect()
  })

  it('Should create an error log on success', async () => {
    const sut = new LogMongoRepository()
    await sut.logError('any_error')
    const count = await (await MongoHelper.getCollection('errors')).countDocuments()
    expect(count).toBe(1)
  })
})
