import { TokFlowApi } from '../../preload/index'

declare global {
  interface Window {
    tokflow?: TokFlowApi
  }
}
