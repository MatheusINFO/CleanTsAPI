import { Controller, HttpRequest, HttpResponse, LoadSurveys } from './load-surveys-protocols'
import { noContent, serverError, success } from '@/presentation/helpers/http/http-helper'

export class LoadSurveysController implements Controller {
  constructor (
    private readonly loadSurveys: LoadSurveys
  ) {}

  async handle (httpRequest: HttpRequest): Promise<HttpResponse> {
    try {
      const surveys = await this.loadSurveys.load(httpRequest.accountId)
      return surveys.length ? success(surveys) : noContent()
    } catch (error) {
      return serverError(error)
    }
  }
}
