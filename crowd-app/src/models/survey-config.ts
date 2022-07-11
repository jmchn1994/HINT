export type QuestionType = 'free-form' | 'likert' | 'desc';
export type LikertAnswer = '1' | '2' | '3' | '4' | '5' | '6' | '7';

export interface SurveyConfig {
  taskId:string;
  systemName:string;
  questionSet:string[];
}

export interface QuestionConfig {
  likertOne?:string;
  likertTwo?:string;
  likertThree?:string;
  likertFour?:string;
  likertFive?:string;
  likertSix?:string;
  likertSeven?:string;
  description?:string;
}

export interface SurveyQuestion {
  id:string;
  type:QuestionType;
  prompt:string;
  config:QuestionConfig;
}

export interface QuestionAnswer {
  id:string;
  type:QuestionType;
  answer:LikertAnswer | string;
}
const likertScaleSize:number = 7;

const FivePoint = {
  'likertOne': 'Strongly Disagree',
  'likertTwo': 'Disagree',
  'likertThree': 'Neutral',
  'likertFour': 'Agree',
  'likertFive': 'Strongly Agree'
};
const SevenPoint = {
  'likertOne': 'Strongly Disagree',
  'likertTwo': 'Disagree',
  'likertThree': 'Somewhat Disagree',
  'likertFour': 'Neutral',
  'likertFive': 'Somewhat Agree',
  'likertSix': 'Agree',
  'likertSeven': 'Strongly Agree'
}
/*const Custom = {
  'likertOne': 'Much Worse',
  'likertTwo': 'Worse',
  'likertThree': 'A Little Worse',
  'likertFour': 'The Same',
  'likertFive': 'A Little Better',
  'likertSix': 'Better',
  'likertSeven': 'Much Better'
}*/

export const BuiltInQuestions:{[name:string]:SurveyQuestion} = {
  'q-confidence': {
    'id': 'confidence',
    'prompt': 'I am confident that I tagged all the emails correctly in the last task.',
    //'I am confident that I completed the last task correctly.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  'q-effort': {
    'id': 'effort',
    'prompt': 'Tagging the emails in the last task took me a lot of effort.',
    //'Completing the last task took me a lot of effort.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  /** Items below are not shared! **/
  'q-utility': {
    'id': 'utility',
    'prompt': 'The $AI helped me tag the emails correctly in the last task.',
    //'During the last task, the $AI was useful.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  'q-mentalmodel': {
    'id': 'mentalmodel',
    'prompt': 'Based on all the tasks so far, I understand when the $AI will suggest correct emails to tag and when it will likely make mistakes.',
    //'Based on all the tasks so far, I understand when the $AI will work well and when it will likely make mistakes.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  'q-trust': {
    'id': 'trust',
    'prompt': 'Based on all the tasks so far, I trust the $AI to help me.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  'q-stickiness': {
    'id': 'stickiness',
    'prompt': 'Based on all the tasks so far, I would use the $AI again.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  'q-ot-change-same': {
    'id': 'change-same',
    'prompt': 'The $AI in the last task was the same as that in the earlier tasks.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  'q-ot-change-better': {
    'id': 'change-better',
    'prompt': 'The $AI was more helpful in the last task than in the earlier tasks.',
    'type': 'likert',
    'config': likertScaleSize === 5 ? FivePoint : SevenPoint
  },
  /** Below are filler type items **/
  'd-task': {
    'id': 'task-prompt',
    'prompt': 'Please mark your agreement with the statements below about the task you just completed:',
    'type': 'desc',
    'config': {}
  },
  'd-history': {
    'id': 'history-prompt',
    'prompt': 'Please mark your agreement with the statements below about your experience so far:',
    'type': 'desc',
    'config': {}
  }
}
