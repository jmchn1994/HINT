import { QualQuestion } from './qual-question';
import { OverviewDetails } from './overview-details';
import { QuantMetric } from './quant-metric';

export const OVERVIEW:OverviewDetails[] = [
  {
    'name': 'performance'
  },
  {
    'name': 'preference'
  }
];

export const QUAL_QUESTIONS:QualQuestion[] = [
  {
    'title': 'confidence',
    'text': 'I am confident that I completed the last task correctly.',
    'type': 'likert'
  },
  {
    'title': 'effort',
    'text': 'Completing the task took me a lot of effort.',
    'type': 'likert'
  },
  {
    'title': 'mental model',
    'text': 'Based on my experience so far, I understand in what situations the $AI system will perform well.',
    'type': 'likert'
  },
  {
    'title': 'stickiness',
    'text': 'Based on my experience so far, I would use the $AI system again.',
    'type': 'likert'
  },
  {
    'title': 'trust',
    'text': 'Based on my experience so far, the $AI system can be trusted.',
    'type': 'likert'
  },
  {
    'title': 'utility',
    'text': 'During the last task, the $AI system was useful.',
    'type': 'likert'
  },
];

export const QUANT_METRICS:QuantMetric[] = [
  {
    'title': 'work time',
    'desc': 'Time taken (s) from session start to complete'
  },
  {
    'title': 'opened',
    'desc': 'Number times any message was viewed'
  },
  {
    'title': 'corrections',
    'desc': 'Ratio (%) of tagging actions that change a previously tagged item'
  },
  {
    'title': 'uptake',
    'desc': 'Inverse of # queries initiated before a message was tagged|Percent of AI suggestions accepted'
  },
];
