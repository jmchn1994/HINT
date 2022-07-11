import React from 'react';

import { TeachingBubble } from 'office-ui-fabric-react/lib/TeachingBubble';
import { PrimaryButton } from 'office-ui-fabric-react';
import { Dialog,
  DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';

import { LocalBackedStorage,
  MapStoreView } from '../store/local-backed-storage';
import { createEmail } from '../models/email';
import { Container } from './common';
import { TrainingConfig } from '../models/training-config';

import { RegexSearchEngine } from './smart';
import { Inbox } from './ui/inbox';
import { TagStatus, ActionStatus } from './ui/inbox/mail-status';
import TaskControls from './controls/task-controls';

interface StageConfig {
  id:string|null;
  text?:string|JSX.Element;
  headline?:string;
  awaitEvent?:string;
  instructions?:JSX.Element;
  autoNext?:boolean;
}

interface StagesConfig {
  commitment: StageConfig[];
  search: StageConfig[];
  compose: StageConfig[];
}

const INBOX = [
  createEmail('event-party',
    'John Doe <john.doe@example.com>',
    ['Jane Doe <jane.doe@example.com>'],
    'BBQ party this weekend',
    'Hey Jane, \n\n There\'s going to be a BBQ party Saturday noon at ' +
    'Darryl\'s place. I heard Mark is also back from school and he will be ' +
    'joining. Maybe we can ask him whether he has any tips for Tim.' +
    '\n\n Love, \n John ',
    [], [], false),
  createEmail('event-meeting',
    'Marketing Dept Listserv <marketing@fakecorp.com>',
    ['Jane Doe <jdoe0501@corp.fakecorp.com>'],
    'Marketing Strategy Meeting (Wed, 6/3)',
    'All,\n\nJust a reminder that we will be holding the marketing strategy ' +
    'meeting on 6/5 in CONF2010. This week\'s meeting items:\n\n' +
    '- Overview and retrospective of the XTR Project\n' +
    '- Identify new opportunities for extending Stage 2\n' +
    '- Define S2 KPIs/metrics\n\n' +
    'We\'ll also be welcoming a new member of the team: Kate Schultz. She ' +
    'will be joining us as the new budget manager for XTR S2.\n\n-M',
    [], [], false),
  createEmail('ad',
    'Rainforest Books <noreply@rainforest.com>',
    ['Jane Doe <jane.doe@example.com>'],
    'Shop Rainforest Prime Day - Thousands of books & movies up to 90% off!',
    '[Image]\n\nATTENTION ALL SHOPPERS,\n\n' +
    'The annual prime day for Rainforest Books is upon us! We have a ' +
    'full selection of books just in for summer! \n [Image] [Image]\n' +
    'There are discounts from 40-90% off for all categories! Plus this year ' +
    'we are opening up our subscription rental service! Starting through ' +
    'prime day, our members can now rent up to 3 books a week for an ' +
    'annual fee of only $5.99 (regular price $15.99). For an additional $1.99' +
    ' memebers can also rent 2 movies per week!\n[Image] [Image]\n\n' +
    'Hurry up and check out our deals! They won\'t last past this week!\n\n' +
    '[Image] \nRainforest Books Communications\n\n' +
    '<To unsubscribe from future mailings, click [here]>',
    [], [], false),
  createEmail('control',
    'Blogosphere <accounts-noreply@blogosphere.com>',
    ['Jane Doe <jane.doe@example.com>'],
    'Confirmation for Blogosphere Account Password Reset',
    'Hi Jane,\n\n' +
    'You recently requested to reset your account password on Blogosphere.com. ' +
    'Please click the link below or copy it into your browser to reset your ' +
    'password: \n\n <https://accounts.blogosphere.com/passwordReset?' +
    'acct=jdoe0501&token=px831n-77in39x-92918q-kl7gd1-00fdv5>\n\n' +
    'If you did not request for a password reset, please ignore this email. ' +
    'The link above is only valid for the next 30 minutes. \n\n' +
    '<Beware of account scams: Please do not share this link with anyone. ' +
    'Our customer service agents will never ask for this link from you.>\n\n' +
    'Thanks,\nBlogosphere Accounts Team',
    [], [], false),
];

const COMMITMENT_INSTRUCTIONS:JSX.Element = <React.Fragment>
    <p>
      Welcome to the tutorial. Here we will introduce you to the email
      application you will be using by walking you through an example task.
      This green area you are reading right now will also be where
      instructions for each task will be presented.
    </p>
    <p>
      Here is an example task:
    </p>
    <p>
      This is Jane's email inbox. Imagine that Jane is the CEO for a company
      that you work for and you are her assistant. Your job is to monitor
      Jane's inbox and tag all her emails with <strong>events</strong> in
      them so that she doesn't miss any.
    </p>
    <p>
      Below are some guidelines for which emails to tag as event emails:
    </p>
    <ul>
      <li>
        The email should include the <strong>time</strong> of the event.
        This can be a specific time (2/15 10:00am) or vague time (this
        weekend, tonight).
      </li>
      <li>
        A passive situation (e.g. "Notice: power outage 5-6pm") or a
        deadline (e.g. "please submit this form by Wed.") shouldn't be
        considered an event.
      </li>
      <li>
        You don't need to try to infer whether the inbox owner is attending the
        event or not. Event emails should be tagged even if you don't think the
        inbox owner has agreed to attend.
      </li>
      <li>
        The same event may involve multiple emails. If this is the case,
        you should tag <strong>all</strong> of them, as long as those emails
        individually also fit the criteria above. This means emails about
        "change of time" or cancelling events should also be tagged if they
        include the event details.
      </li>
    </ul>
  </React.Fragment>;

const Stages:StagesConfig = {
  commitment:[
    {
      "id": null,
      instructions: <React.Fragment>
          {COMMITMENT_INSTRUCTIONS}
          <p>
            Please click Next to continue:
          </p>
        </React.Fragment>
    },
    {
      id: "#training-inbox-message-list",
      awaitEvent: 'view-message',
      text: <React.Fragment>
        Inbox. The inbox shows a list of emails. You can click on these to see
        the contents of each email.
        <br/>
        Please select an email from this list to advance.
      </React.Fragment>,
      headline: "Inbox",
      instructions: <React.Fragment>
        {COMMITMENT_INSTRUCTIONS}
        <p>
          Click on one of the emails in the list on the left to advance.
        </p>
      </React.Fragment>
    },
    {
      id: "#inbox-preview-tag-button",
      text: <React.Fragment>
        Tagging button. Using this the button(s) here you can tag messages. <br/>
        Click outside this blue popup to advance.
      </React.Fragment>,
      headline: "Inbox Actions",
      instructions: <React.Fragment>
        {COMMITMENT_INSTRUCTIONS}}
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: "#inbox-preview-body",
      text: <React.Fragment>
        Email Preview. Once you select an email, you can see the contents of
        the email here.<br/>
        Click outside this blue popup to advance.
      </React.Fragment>,
      headline: "Email Preview",
      instructions: <React.Fragment>
        {COMMITMENT_INSTRUCTIONS}
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: "#controls-done-button",
      text: "After you have completed the task, click this button to move " +
        "onto the next task. ",
      headline: "Submit",
      instructions: <React.Fragment>
        {COMMITMENT_INSTRUCTIONS}
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: null,
      instructions: <React.Fragment>
        {COMMITMENT_INSTRUCTIONS}
        <p>
          Once you're done, press the "I'm done" button above the inbox.
        </p>
      </React.Fragment>,
      autoNext: true
    }
  ],
  search: [
    {
      "id": null,
      instructions: <React.Fragment>
        <p>
          Welcome to the tutorial. Here we will go over some basics on using the
          interface.
        </p>
        <p>
          This area you are reading right now will be where the instructions
          for each task is presented.
        </p>
        <p>
          Please click Next to continue:
        </p>
      </React.Fragment>
    },
    {
      id: "#training-inbox-message-list",
      text: <React.Fragment>
        The inbox shows a list of emails.
        <br/>
        (Click outside this area & popup to advance.)
      </React.Fragment>,
      headline: "Inbox",
      instructions: <React.Fragment>
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: "#top-bar-btn-flag",
      text: <React.Fragment>
        This is an action button.<br/>
        You can make changes to the inbox like tagging events
        deleting messages etc. using these buttons. <br/>
        The available buttons may change depending on the task.
      </React.Fragment>,
      headline: "Inbox Actions",
      instructions: <React.Fragment>
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: "#training-inbox-search",
      text: <React.Fragment>
        This is the inbox search bar. You can use the search bar to find email
        messages.
      </React.Fragment>,
      headline: "Search Bar",
      instructions: <React.Fragment>
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: "#training-inbox-preview",
      text: "Once you select an email, you will be able to see a preview of " +
        "its contents over here. Try selecting an email from the list.",
      headline: "Email Preview",
      instructions: <React.Fragment>
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: "#controls-done-button",
      text: "After you have completed the task, click this button to move " +
        "onto the next task. ",
      headline: "Submit",
      instructions: <React.Fragment>
        <p>Click outside the notification to advance</p>
      </React.Fragment>,
      autoNext: true
    },
    {
      id: null,
      instructions: <React.Fragment>
        <p>Here is an example of a task:</p>
        <p>This is Jane's inbox.</p>
        <p>
          Tag all of her emails related to events using the interface.
        </p>
        <p>
          Once you're done, press the "I'm done" button above the inbox.
        </p>
      </React.Fragment>,
      autoNext: true
    }
  ],
  compose: []
}

interface RefAnswers {
  commitment: TagStatus[];
  search: ActionStatus[];
  compose: any;
}

const refAnswers:RefAnswers = {
  commitment: [
    {'event': true},
    {'event': true},
    {'event': false},
    {'event': false}
  ],
  search: [
    {flagged: true, deleted: false, archived: false},
    {flagged: true, deleted: false, archived: false},
    {flagged: false, deleted: false, archived: false},
    {flagged: false, deleted: false, archived: false}
  ],
  compose: []
}
interface Props {
  task:TrainingConfig;
  onComplete?:() => void;
}

interface State {
  stage:number;
  errorMessage?:string;
}

export default class TrainingSession extends React.Component<Props, State> {
  private _store:MapStoreView;
  constructor(props:Props) {
    super(props);
    const storage = new LocalBackedStorage('training', true);
    this._store = storage.guaranteeMap('default');
    this.state = {
      stage: 0
    };
  }

  private nextStage() {
    const { stage } = this.state;
    const { task } = this.props;
    this.setState({
      stage: Math.min(stage + 1, Stages[task.for].length - 1)
    })
  }

  private checkAndProgress() {
    const { task, onComplete } = this.props;
    let passedCheck = false, errorEmail:number|null = null;
    if (task.for === 'commitment') {
      const tags = this._store.get<TagStatus[]>('tagStatus', []);
      passedCheck = refAnswers[task.for].every((ts, i) => {
          const passed = i < tags.length && ts.event === tags[i].event;
          if (!passed) {
            errorEmail = i;
          }
          return passed;
        });
    } else if (task.for === 'search') {
      const flags = this._store.get<ActionStatus[]>('actionStatus', []);
      passedCheck = refAnswers[task.for].every((as, i) => {
          const passed = i < flags.length && as.flagged === flags[i].flagged;
          if (!passed) {
            errorEmail = i;
          }
          return passed;
        });
    } else {
      // Nothing to do here
    }
    if (passedCheck) {
      if (onComplete) {
        onComplete();
      }
    } else {
      if (errorEmail === null) {
        this.setState({
          errorMessage: 'Unknown error happened'
        });
      } else {
        const email = INBOX[errorEmail];
        const correctAnswer = task.for === 'commitment' ?
          refAnswers.commitment[errorEmail].event :
          refAnswers.search[errorEmail].flagged;
        this.setState({
          errorMessage: 'The email "' + email.subject + '" should ' +
            ( correctAnswer ? '' : 'not ') +
            'be tagged as an event.'
        });
      }
    }
  }

  private dismissError() {
    this.setState({
      errorMessage: undefined
    });
  }

  handleEvent(eventName:string, _?:any) {
    const { task } = this.props;
    const { stage } = this.state;
    const stageSpec = Stages[task.for][stage];
    if (stageSpec && stageSpec.awaitEvent) {
      if (eventName === stageSpec.awaitEvent) {
        // Advance
        this.nextStage();
      }
    }
  }

  render() {
    const { task } = this.props;
    const { stage, errorMessage } = this.state;
    const stageSpec = Stages[task.for];
    if (stageSpec === undefined) {
      return <Container>
        { this.renderError('Unrecognized task type. Bad HIT config.') }
      </Container>;
    }
    if (stage >= stageSpec.length) {
      return <Container>
        { this.renderError('Inconsistent state! Please refresh tutorial.') }
      </Container>;
    }
    const stageDef = stageSpec[stage];
    return <Container>
      <TaskControls
        showControls
        suppressFooter
        completeButtonMode = 'inside'
        instructionsHead = { 'Tutorial' }
        disabled = { stage < stageSpec.length - 1 }
        instructions = { <React.Fragment>
            { stageDef.instructions }
            { this.renderInstructionsNext(stageDef) }
          </React.Fragment> }
        onComplete = { () => {
          this.checkAndProgress();
        } }>
          <Inbox
            style = { stage === 0 ? { opacity: 0.2 } : undefined }
            id = "training-inbox"
            store = { this._store }
            messages = { INBOX }
            onEvent = { this.handleEvent.bind(this) }
            searchProvider = { task.for === 'search' ?
              new RegexSearchEngine(INBOX) : undefined }
            actions = { task.for === 'commitment' ?
              ['tag-event'] : ['flag'] }/>
        </TaskControls>
        { stageDef.id !== null ?
          <TeachingBubble
            target = { stageDef.id }
            onDismiss = { () => {
              if (stageDef.autoNext) {
                this.nextStage();
              }
            } }
            headline = { stageDef.headline }
            closeButtonAriaLabel="Close">
            { stageDef.text }
          </TeachingBubble> : null
        }
        { errorMessage ? this.renderErrorDialog() : null }
      </Container>;
  }

  private renderInstructionsNext(stageDef:StageConfig) {
    if (stageDef.autoNext || stageDef.awaitEvent) {
      return null;
    } else {
      return <PrimaryButton text="Next" onClick = {
        () => {
          this.nextStage();
        }
      }/>;
    }
  }

  private renderErrorDialog() {
    const { errorMessage } = this.state;
    return <Dialog
        hidden = { errorMessage === undefined }
        onDismiss = { this.dismissError.bind(this) }
        dialogContentProps = {{
          type: DialogType.normal,
          title: 'Notice',
          closeButtonAriaLabel: 'Close',
          subText: errorMessage,
        }}>
      <DialogFooter>
        <PrimaryButton text='OK'
          onClick = { this.dismissError.bind(this) }/>
      </DialogFooter>
    </Dialog>;
  }

  private renderError(message:string) {
    return <div>{ message }</div>
  }

}
