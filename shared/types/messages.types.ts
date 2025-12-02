
import { AnalysisResult } from './design-system.types';

export enum MessageType {
  START_ANALYSIS = 'START_ANALYSIS',
  ANALYSIS_PROGRESS = 'ANALYSIS_PROGRESS',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',

  COPY_TO_CLIPBOARD = 'COPY_TO_CLIPBOARD',

  EXPORT_JSON = 'EXPORT_JSON',

  GET_HISTORY = 'GET_HISTORY',
  SAVE_TO_HISTORY = 'SAVE_TO_HISTORY',
  CLEAR_HISTORY = 'CLEAR_HISTORY',
}


export interface StartAnalysisMessage {
  type: MessageType.START_ANALYSIS;
}

export interface AnalysisProgressMessage {
  type: MessageType.ANALYSIS_PROGRESS;
  progress: number; // 0-100
  stage: string;
}

export interface AnalysisCompleteMessage {
  type: MessageType.ANALYSIS_COMPLETE;
  result: AnalysisResult;
}

export interface AnalysisErrorMessage {
  type: MessageType.ANALYSIS_ERROR;
  error: string;
}

export interface CopyToClipboardMessage {
  type: MessageType.COPY_TO_CLIPBOARD;
  text: string;
}

export interface ExportJsonMessage {
  type: MessageType.EXPORT_JSON;
  data: AnalysisResult;
}

export interface GetHistoryMessage {
  type: MessageType.GET_HISTORY;
}

export interface SaveToHistoryMessage {
  type: MessageType.SAVE_TO_HISTORY;
  result: AnalysisResult;
}

export interface ClearHistoryMessage {
  type: MessageType.CLEAR_HISTORY;
}

export type Message =
  | StartAnalysisMessage
  | AnalysisProgressMessage
  | AnalysisCompleteMessage
  | AnalysisErrorMessage
  | CopyToClipboardMessage
  | ExportJsonMessage
  | GetHistoryMessage
  | SaveToHistoryMessage
  | ClearHistoryMessage;


export interface SuccessResponse {
  success: true;
  data?: any;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type MessageResponse = SuccessResponse | ErrorResponse;
