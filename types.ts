export interface GeneratePromptRequest {
  userConcept: string;
  imageBase64?: string; // Raw base64 string without data URI prefix
  imageMimeType?: string;
  style: string;
  aspectRatio: string;
}

export interface PromptResponse {
  generatedPrompt: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}