import React from 'react';
import styled from 'styled-components';
import { PrimaryButton } from 'office-ui-fabric-react';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { ChoiceGroup,
  IChoiceGroupOption } from 'office-ui-fabric-react/lib/ChoiceGroup';

import { FINAL_BONUS } from '../const';
import { LocalBackedStorage } from '../store/local-backed-storage';
import { Page, PageBody, PageCard, PageFooter } from './common';

type FinalSurveyQuestionId = 'instructions-clarity' | 'task-clarity' | 'stickiness';
interface FinalSurveyQuestion {
  id: FinalSurveyQuestionId,
  text: string
}

interface Props {
  assignmentId?:string;
  submitTarget?:string;
  store:LocalBackedStorage;
  hasConsent:boolean;
  hasSystemComparison:boolean;
  systemName?:string;
  debug?:boolean;
}

interface State {
  feedback:string;
  explanation:string;
  liked:string;
  disliked:string;
  surveyAnswers:{[id in FinalSurveyQuestionId]:string};
  preference:string;
}

const ChoiceWrapper = styled.div`
  margin-bottom: 20px;
  &::after {
    content: "";
    clear: both;
    display: table;
  }
`;

const DEFAULT_SUBMIT_TARGET = 'https://www.mturk.com/mturk/externalSubmit';
const CHOICE_STYLE = {
  root: {
    'width': '14.28%',
    'float': 'left'
  }
};
const QUESTIONS:FinalSurveyQuestion[] = [
  {
    'id': 'instructions-clarity',
    'text': 'The instructions were clear and easy to understand throughout the HIT.'
  },
  {
    'id': 'task-clarity',
    'text': 'I understood when an email should be considered an event.'
  },
  {
    'id': 'stickiness',
    'text': 'I would use the $AI to help if I had to do more tasks in the future.'
  }
]
const PREF_CHOICES:IChoiceGroupOption[] = [
  { key: '1', text: 'Strongly Prefer Blue', styles: CHOICE_STYLE },
  { key: '2', text: 'Prefer Blue', styles: CHOICE_STYLE },
  { key: '3', text: 'Somewhat Prefer Blue', styles: CHOICE_STYLE },
  { key: '4', text: 'Indifferent', styles: CHOICE_STYLE },
  { key: '5', text: 'Somewhat Prefer Yellow', styles: CHOICE_STYLE },
  { key: '6', text: 'Prefer Yellow', styles: CHOICE_STYLE },
  { key: '7', text: 'Strongly Prefer Yellow', styles: CHOICE_STYLE },
];
const LIKERT_CHOICES:IChoiceGroupOption[] = [
  { key: '1', text: 'Strongly Disagree', styles: CHOICE_STYLE },
  { key: '2', text: 'Disagree', styles: CHOICE_STYLE },
  { key: '3', text: 'Somewhat Disagree', styles: CHOICE_STYLE },
  { key: '4', text: 'Neutral', styles: CHOICE_STYLE },
  { key: '5', text: 'Somewhat Agree', styles: CHOICE_STYLE },
  { key: '6', text: 'Agree', styles: CHOICE_STYLE },
  { key: '7', text: 'Strongly Agree', styles: CHOICE_STYLE },
]


export default class ExitSurvey extends React.Component<Props, State> {
  private _formRef:React.RefObject<HTMLFormElement>;
  constructor(props:Props) {
    super(props);
    this._formRef = React.createRef();
    this.state = {
      feedback: '',
      explanation: '',
      liked: '',
      disliked: '',
      surveyAnswers: {
        'instructions-clarity': '',
        'stickiness': '',
        'task-clarity': ''
      },
      preference: ''
    };
  }

  private replaceAI(source:string) {
    const {systemName} = this.props;
    return source.replace('$AI', systemName ? systemName : 'AI-assisted tool');
  }

  private validate():string|null {
    const { explanation, liked, disliked, surveyAnswers } = this.state;
    if (liked.trim().length < 2) {
      return 'Please tell us something you liked about the AI.';
    }
    if (disliked.trim().length < 2) {
      return 'Please tell us something you didn\'t like about the AI.';
    }
    if (explanation.length < 10 || explanation.split(' ').length < 3) {
      return 'Your explanation is too short. ' +
        'Please answer this question in a sentence.';
    }
    for (var key in surveyAnswers) {
      if (surveyAnswers[key as FinalSurveyQuestionId] === '') {
        return 'You did\'t answer one of the survey questions.'
      }
    }
    return null;
  }

  render() {
    const { hasConsent } = this.props;
    return <Page>
        <PageBody footer = { true }>
        { hasConsent ? this.renderExitSurvey() : this.renderNoConsentExit() }
        </PageBody>
        <PageFooter>
          { this.renderFooter() }
        </PageFooter>
      </Page>;
  }

  renderFooter() {
    const { store, hasConsent, debug } = this.props;
    if (!hasConsent) {
      return <PrimaryButton text = "Go back to the splash page"
        style = { {float: "right" } }
        onClick = { () => {
          store.destroy();
          window.location.reload();
        } } />;
    } else {
      const submitButton = <PrimaryButton text = "Submit HIT"
        style = { {float: "right" } }
        onClick = { () => {
          const validate = this.validate();
          if (validate === null) {
            if (this._formRef.current !== null) {
              this._formRef.current.submit();
            } else {
              alert('Someting went wrong! Please refresh this page.');
            }
          } else {
            alert('Error: ' + validate);
          }
        } } />;
      if (debug) {
        return <React.Fragment>
            { submitButton }
            <PrimaryButton text = "Clear Store and Reset"
              style = { { float: "right", marginRight: "20px" } }
              onClick = { () => {
                store.destroy();
                window.location.reload();
              } } />
          </React.Fragment>;
      } else {
        return submitButton;
      }
    }
  }

  renderForm() {
    const { assignmentId, submitTarget, store } = this.props;
    const { feedback, explanation, liked, disliked,
      preference, surveyAnswers } = this.state;
    if (assignmentId === undefined) {
      return null;
    }

    return <form style = { {'display': 'none'} }
      ref = { this._formRef }
      action = { submitTarget ?
        submitTarget + '/mturk/externalSubmit' :
        DEFAULT_SUBMIT_TARGET }
      method = 'POST'>
      <input type='hidden' name = 'assignmentId' value = { assignmentId } />
      <input type='hidden' name = 'data'
        value = { JSON.stringify(store.serialize()) } />
      <input type='hidden' name = 'q-feedback' value = { feedback } />
      <input type='hidden' name = 'q-explanation' value = { explanation } />
      <input type='hidden' name = 'q-liked' value = { liked } />
      <input type='hidden' name = 'q-disliked' value = { disliked } />
      <input type='hidden' name = 'q-survey' value = { JSON.stringify(surveyAnswers) } />
      <input type='hidden' name = 'q-preference' value = { preference } />
    </form>;
  }

  renderExitSurvey() {
    const { store, debug, hasSystemComparison } = this.props;
    return <PageCard>
      { this.renderForm() }
      <h2>Congrats! You've completed all the tasks!</h2>
      { debug ?
        <pre>{ JSON.stringify(store.serialize(), undefined, 2) }</pre> : null}
      <p>
        We have some final questions for you about your experiences with the
        tasks and the AI assistance.
        <br/>Note: There is a ${ FINAL_BONUS } final bonus for completing
        this last survey. This bonus will be given as long as you complete the
        survey so please make your best effort to answer the questions honestly.
      </p>
      <TextField
        label={"Tell us something you liked about the AI:" }
          multiline
        required
        placeholder = {'(Please try to be precise about what aspect of the '+
          'AI you liked. If you didn\'t like anything about the AI, you can ' +
          'write "Nothing".)'}
        autoAdjustHeight
        onChange = { (_e, text) => {
          this.setState({
            liked: text !== undefined ? text : ''
          });
        } } />
      <TextField
        label={"Tell us something you disliked about the AI:" }
        multiline
        required
        placeholder = {'(Please try to be precise about what aspect of the '+
          'AI you didn\'t like. If you didn\'t have anything you disliked ' +
          'about the AI write "Nothing".)'}
        autoAdjustHeight
        onChange = { (_e, text) => {
          this.setState({
            disliked: text !== undefined ? text : ''
          });
        } } />
      <TextField
        label={"From your experience, tell us whether you observed any " +
          "patterns in when the AI was or wasn't helpful: "}
        multiline
        required
          placeholder = {'(Please try to be precise about how you think the ' +
            'AI behaved. If you didn\'t feel like you observed any patterns, ' +
            'just answer "I didn\'t observe any patterns".)'}
        autoAdjustHeight
        onChange = { (_e, text) => {
          this.setState({
            explanation: text !== undefined ? text : ''
          });
        } } />
      <p>Please answer some questions about your experience on the tasks:</p>

      { this.renderLikertQuestions() }

      { hasSystemComparison ? this.renderSystemPreferenceComparison() : null }

      <TextField
        label={"(Optional) If you have any questions or comments about " +
          "this HIT, please leave them in the text area below:" }
        multiline
        autoAdjustHeight
        onChange = { (_e, text) => {
          this.setState({
            feedback: text !== undefined ? text : ''
          });
        } } />
      <p>Thank you again for participating in our research study!</p>
      <p>
        Once you're done, please click the "Submit HIT" button at the bottom of
        this page to submit this HIT.
      </p>
    </PageCard>;
  }

  private renderLikertQuestions(asTable:boolean = false) {
    const { surveyAnswers } = this.state;
    if (asTable) {
      return;
    } else {
      return <ChoiceWrapper>
        { QUESTIONS.map((q) => {
          return <ChoiceGroup
            label = { this.replaceAI(q.text) }
            options = { LIKERT_CHOICES }
            required
            onChange = {
              (_:any, option:IChoiceGroupOption | undefined) => {
                if (option) {
                  surveyAnswers[q.id] = option.key;
                  this.setState({
                    surveyAnswers: surveyAnswers
                  })
                }
              }
            }
            selectedKey = { surveyAnswers[q.id] === '' ?
              undefined : surveyAnswers[q.id] } />;
        })}
      </ChoiceWrapper>
    }
  }

  private renderSystemPreferenceComparison() {
    const { preference } = this.state;
    return <React.Fragment><p>
        During this HIT, you completed two groups of tasks (the blue group,
        and the yellow group). A different version of the system functionality
        was used for each group.
      </p>
      <ChoiceWrapper>
        <ChoiceGroup
            label = { 'Overall, which group\'s experience did you prefer?' }
            options = { PREF_CHOICES }
            required
            onChange = {
              (_:any, option:IChoiceGroupOption | undefined) => {
                if (option) {
                  this.setState({
                    preference: option.key
                  })
                }
              }
            }
            selectedKey = { preference === '' ? undefined : preference } />
      </ChoiceWrapper>
    </React.Fragment>;
  }

  renderNoConsentExit() {
    return <PageCard>
      <h2>Exit HIT</h2>
      <p>
        You have declined consent to participate in this HIT. Please use the
        Mechanical Turk interface to return this HIT.
      </p>
      <p>
        Thank you for your interest in our study!
      </p>
    </PageCard>;
  }
}
