import React from 'react';
import styled from 'styled-components';

import { PrimaryButton } from 'office-ui-fabric-react';
import { Slider } from 'office-ui-fabric-react/lib/Slider';
import { ChoiceGroup,
  IChoiceGroupOption } from 'office-ui-fabric-react/lib/ChoiceGroup';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { LocalBackedStorage,
  StreamStoreView } from '../store/local-backed-storage';
import { Page, PageBody, PageCard } from './common';
import { SurveyConfig,
  SurveyQuestion,
  QuestionAnswer,
  BuiltInQuestions } from '../models/survey-config';

const QuestionWrap  = styled.div<{error?:boolean}>`
  margin-bottom: 30px;
  border: ${props => props.error ? '1px solid #f00' : '1px solid transparent'};
  &::after {
    content: "";
    clear: both;
    display: table;
  }
`;
const LikertTable = styled.table`
  width:100%;
  border-spacing: 0;
  margin: 10px 0;
  & thead {
    background-color: #f5f5f5;
  }
  & tr > td, & tr > th {
    padding: 10px;
  }
`;
const QuestionWrapRow = styled.tr<{even?:boolean,error?:boolean}>`
  background-color: ${props => props.error ? '#fff1f1' :
    (props.even ? '#f1f1f1': '#fff')};
  border: 1px solid ${props => props.error ? '#f00' : 'transparent'};
  font-size: 18px;
`;
const QuestionWrapCell = styled.td`
  text-align: center;
`;

const CHOICE_STYLE = {
  root: {
    'width': '14.28%',
    'float': 'left'
  }
};
const LIKERT_LEVELS:number[] = [1, 2, 3, 4, 5, 6, 7];
const makeLikert = (q:SurveyQuestion):IChoiceGroupOption[] => {
    return [
      { key: '1', styles: CHOICE_STYLE, text: '1' +
        (q.config.likertOne ? ': ' + q.config.likertOne : '') },
      { key: '2', styles: CHOICE_STYLE, text: '2' +
        (q.config.likertTwo ? ': ' + q.config.likertTwo : '') },
      { key: '3', styles: CHOICE_STYLE, text: '3' +
        (q.config.likertThree ? ': ' + q.config.likertThree : '') },
      { key: '4', styles: CHOICE_STYLE, text: '4' +
        (q.config.likertFour ? ': ' + q.config.likertFour : '') },
      { key: '5', styles: CHOICE_STYLE, text: '5' +
        (q.config.likertFive ? ': ' + q.config.likertFive : '')},
      { key: '6', styles: CHOICE_STYLE, text: '6' +
        (q.config.likertSix ? ': ' + q.config.likertSix : '')},
      { key: '7', styles: CHOICE_STYLE, text: '7' +
        (q.config.likertSeven ? ': ' + q.config.likertSeven : '')}
    ];
  };

const mode:'radio'|'slider' = 'radio';

interface SurveyResult {
  surveyId: string;
  answers: {[questionId:string]:string};
};

interface Props {
  store:LocalBackedStorage;
  config:SurveyConfig;
  onComplete:()=>void;
  renderAsTable?:boolean;
}

interface State {
  questionAnswer:(QuestionAnswer | null)[];
  indicateUnanswered:boolean;
}

export default class Survey extends React.Component<Props, State> {
  private questions:SurveyQuestion[];
  private stateStore:StreamStoreView<SurveyResult>;
  constructor(props:Props) {
    super(props);
    this.stateStore = props.store.guaranteeStream<SurveyResult>('surveys');
    this.questions = props.config.questionSet.map((qId) => {
      return BuiltInQuestions[qId];
    });
    this.state = {
      questionAnswer: this.questions.map((q) => q.type !== 'desc' ? null : {
          id: q.id,
          type: 'desc',
          answer: ''
        }),
      indicateUnanswered: false
    };
  };

  private nameReplace(text:string) {
    const { config } = this.props;
    return text.replace('$AI', 'AI-based ' + config.systemName.toLowerCase());
  }

  private checkComplete() {
    return this.state.questionAnswer.length === this.questions.length
      && this.state.questionAnswer.every((ans) => ans !== null);
  }

  render() {
    const { config, onComplete, renderAsTable } = this.props;
    return <Page>
      <PageBody>
        <PageCard>
          <h2>Survey</h2>
          { this.renderQuestionsGroup(renderAsTable) }
          <PrimaryButton text = "Submit Survey"
            style = { {float: "right" } }
            onClick = { () => {
              if (this.checkComplete()) {
                let answers:{[questionId:string]:string} = {};
                this.state.questionAnswer.forEach((ans) => {
                  if (ans && ans.type !== 'desc') {
                    answers[ans.id] = ans.answer;
                  }
                });
                this.stateStore.insert({
                  surveyId: config.taskId,
                  answers: answers
                });
                onComplete();
              } else {
                this.setState({
                  indicateUnanswered: true
                });
              }
            }  } />
        </PageCard>
      </PageBody>
    </Page>;
  }

  private setAnswer(questionId:number, answer:QuestionAnswer | null) {
    let answers = this.state.questionAnswer.slice(0);
    answers[questionId] = answer;
    this.setState({
      questionAnswer: answers
    });
  }

  private renderQuestionsGroup(asTable:boolean = false) {
    if (asTable) {
      return <LikertTable>
        <thead>
          <tr>
            <th style = {{'width': '44%'}}>Question</th>
            <th style = {{'width': '8%'}}>Strongly Disagree</th>
            <th style = {{'width': '8%'}}>Disagree</th>
            <th style = {{'width': '8%'}}>Somewhat Disagree</th>
            <th style = {{'width': '8%'}}>Neutral</th>
            <th style = {{'width': '8%'}}>Somewhat Agree</th>
            <th style = {{'width': '8%'}}>Agree</th>
            <th style = {{'width': '8%'}}>Strongly Agree</th>
          </tr>
        </thead>
        <tbody>
          { this.renderQuestions(true) }
        </tbody>
      </LikertTable>
    } else {
      return this.renderQuestions(false)
    }
  }

  private renderLikertTableRow(question:SurveyQuestion) {
    const index = this.questions.indexOf(question);
    return LIKERT_LEVELS.map((level) => {
      return <QuestionWrapCell key = {'c-index-' + level}>
        <input key = { 'choice-' + level }
          type = 'radio'
          name = { 'choice-' + question.id }
          style = {{
            'width': '1.5em',
            'height': '1.5em'
          }}
          className = 'ms-ChoiceField-input'
          value = { level }
          onChange = { (event) => {
              this.setAnswer(index, {
                  id: question.id,
                  type: question.type,
                  answer: event.target.value
                });
            }
          }
          checked = {
            this.state.questionAnswer[index]?.answer === ('' + level)
          }/>
         </QuestionWrapCell>;
    });
  }

  private renderQuestions(asTable:boolean = false) {
    const { indicateUnanswered, questionAnswer } = this.state;
    const questions = asTable ? this.questions.filter((q) => {
        return q.type === 'likert';
      }) : this.questions;
    return questions.map((q, _i) => {
      const i = this.questions.indexOf(q);
      if (q.type === 'likert') {
        if (mode === 'radio') {
          if (asTable) {
            return <QuestionWrapRow
              key = { 'wrap-' + q.id }
              even = { _i % 2 === 0 }
              error = { indicateUnanswered && questionAnswer[i] === null } >
                <td>{ this.nameReplace(q.prompt) }</td>
                { this.renderLikertTableRow(q) }
              </QuestionWrapRow>;
          } else {
            return <QuestionWrap
              key = { 'wrap-' + q.id }
              error = { indicateUnanswered && questionAnswer[i] === null } >
              <ChoiceGroup key = { 'q-' + q.id }
                label = { this.nameReplace(q.prompt) }
                options = { makeLikert(q) }
                required = { true }
                styles = { {
                  label: {
                    fontSize: '18px'
                  }
                } }
                onChange = { ((idx) => {
                  return (_:any, option:IChoiceGroupOption | undefined) => {
                    this.setAnswer(idx, option ? {
                        id: this.questions[idx].id,
                        type: q.type,
                        answer: option.key
                      } : null);
                  };
                })(i) }
                selectedKey = { this.state.questionAnswer[i]?.answer } />
              </QuestionWrap>;
          }
        } else {
          return <QuestionWrap
            key = { 'wrap-' + q.id }
            style = { {border:
              indicateUnanswered && questionAnswer[i] === null ?
                '1px solid #f00' : undefined} }>
              <Slider
                key = { 'q-' + q.id }
                label= { this.nameReplace(q.prompt) }
                min={-2} max={2} step={1} defaultValue={0}
                showValue
                originFromZero />
            </QuestionWrap>;
        }
      } else if (q.type === 'free-form') {
        return <QuestionWrap
          key = { 'wrap-' + q.id }
          style = { {border:
            indicateUnanswered && questionAnswer[i] === null ?
              '1px solid #f00' : undefined} }>
            <TextField key = { 'q-' + q.id }
              label = { this.nameReplace(q.prompt) }
              onChange = { ((idx) => {
                return (_:any, text:string | undefined) => {
                  this.setAnswer(idx, text ? {
                    id: this.questions[idx].id,
                    type: q.type,
                    answer: text} : null);
                };
              })(i)} />
        </QuestionWrap>;
      } else if (q.type === 'desc') {
        if (!asTable) {
          return <QuestionWrap key = { 'wrap-' + q.id }>
              { q.prompt }
            </QuestionWrap>;
        } else {
          return null;
        }
      } else {
        return <QuestionWrap key = { 'wrap-' + q.id }>
            Unknown question type
          </QuestionWrap>;
      }
    });
  }
}
