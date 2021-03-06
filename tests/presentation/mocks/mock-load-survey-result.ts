import { mockSaveSurveyResultModel } from '@/../tests/domain/mocks'
import { LoadSurveyResult } from '@/domain/usecases/load-survey-result'

export class LoadSurveyResultSpy implements LoadSurveyResult {
  surveyResultModel = mockSaveSurveyResultModel()
  surveyId: string
  accountId: string

  async load (surveyId: string, accountId: string): Promise<LoadSurveyResult.Result> {
    this.surveyId = surveyId
    this.accountId = accountId
    return this.surveyResultModel
  }
}
