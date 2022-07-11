import React from 'react';
import styled from 'styled-components';

import { PrimaryButton,
  MessageBar,
  MessageBarType } from 'office-ui-fabric-react';

import { LocalBackedStorage, MapStoreView } from './store/local-backed-storage';
import { Session } from './models/session';

import Intro from './components/intro';
import Consent from './components/consent';
import Interstitial from './components/interstitial';
import TrainingSession from './components/training-session';
import ExitSurvey from './components/exit-survey';
import Survey from './components/survey';
import TaskSession from './components/task-session';
import TaskProgress from './components/task-progress';

interface Props {
  assignmentId?:string;
  hitId?:string;
  submitTarget?:string;
  workerId?:string;
  debug?:boolean;
  sessions:Promise<Session<any>[]>;
  store:LocalBackedStorage;
}

interface State {
  sessions?:Session<any>[];
  currentSession:number;
  hasConsent:boolean;
  showWarning:boolean;
  showDbg:boolean;
}

const TopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 39px;
  border-bottom: 1px solid #d0d0d0;
`;
const WarningBar = styled.div`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  height: 44px;
`;
const Body = styled.div<{showWarning?:boolean}>`
  position: absolute;
  top: ${props => props.showWarning ? '88' : '40'}px;
  left: 0;
  right: 0;
  bottom: 0;
`;
const ErrorBody = styled.div`
  text-align: center;
  font-size: 18px;
`;
const ErrorHeader = styled.h1`
  text-align: center;
  font-size: 36px;
`;
const ErrorRecovery = styled.div`
  font-size: 12px;
  margin-top: 100px;
  background-color: #eee;
  padding: 20px 30%;
  & a {
    color: #c00;
  }
  & > .pre {
    word-break: break-all;
    max-width: 100%;
    padding: 20px;
    font-family: monospace;
    border: 1px dashed #000;
  }
`;


const DebugBar = styled.div`
  position: fixed;
  top: 1%;
  left: 1%;
  background: #fff;
  opacity: 0.75;
  border: 1px solid #000;
`;


export default class App extends React.Component<Props, State> {
  private stateStore:MapStoreView;
  constructor(props:Props) {
    super(props);
    this.stateStore = props.store.guaranteeMap('app');

    // Only save if not saved before and not preview id
    if (this.stateStore.get('assignmentId', null) === null &&
      props.assignmentId !== 'ASSIGNMENT_ID_NOT_AVAILABLE') {
      this.stateStore.set('assignmentId', props.assignmentId);
    }

    props.sessions.then((sessions) => {
      this.setState({
        sessions: sessions
      });
    }).catch((_error) => {
      this.setState({
        sessions: []
      });
    });

    this.state = {
      currentSession: this.stateStore.get('currentSession', 0),
      hasConsent: this.stateStore.get('hasConsent', false),
      showWarning: true,
      showDbg: false
    };
  }

  private updateStore() {
    this.stateStore.set('currentSession', this.state.currentSession);
    this.stateStore.set('hasConsent', this.state.hasConsent);
  }

  public render() {
    const { store, debug } = this.props;
    const { currentSession, sessions } = this.state;

    // find the major sessions
    const totalMajor = sessions?.reduce((acc, val) => {
      return acc + ((val.type === 'intro' || val.type === 'consent' ||
        val.type === 'task' || val.type === 'exit-survey') ? 1 : 0);
    }, 0);
    const completedMajor = sessions?.reduce((acc, val, i) => {
      return acc + (((val.type === 'intro' || val.type === 'consent' ||
        val.type === 'task' || val.type === 'exit-survey')
          && i <= currentSession) ? 1 : 0);
    }, 0);
    return <div className="container">
      <TopBar>
        <TaskProgress current = { completedMajor }
          total = { totalMajor }/>
      </TopBar>
      { this.renderWarning() }
      <Body
        showWarning = { !store.persistenceEnabled() && this.state.showWarning }>
      { this.renderSession() }
      </Body>
      { debug ? this.renderDebug() : null }
    </div>;
  }

  renderDebug() {
    const { store } = this.props;
    return <DebugBar>
      <PrimaryButton
        style = { { margin: '20px' } }
        text = 'Reset & Reload'
        onClick = { () => {
          store.destroy();
          window.location.reload();
        } } />
    </DebugBar>;
  }

  renderWarning() {
    const { store } = this.props;
    if (!store.persistenceEnabled() && this.state.showWarning) {
      return <WarningBar>
        <MessageBar
          messageBarType={ MessageBarType.warning }
          onDismiss = { () => {
            this.setState({
              'showWarning': false
            });
          } }
          dismissButtonAriaLabel="Close">
          Your browser does not support local persistent storage.
          Refreshing this page will cause you to lose your progress on the HIT!
        </MessageBar>
      </WarningBar>;
    }
  }

  renderSession() {
    const { currentSession, hasConsent, sessions } = this.state;
    const { store, assignmentId, submitTarget, debug } = this.props;

    const idMatched = assignmentId !== undefined &&
      assignmentId === this.stateStore.get('assignmentId', assignmentId);

    if (sessions === undefined) {
      return this.renderError('Loading...',
        'The configuration data for this HIT is being loaded...');
    } else if (!idMatched) {
      if (assignmentId === undefined) {
        return this.renderError('Environment Error',
          'Could not read the assignment identifier from MTurk!');
      }
      return this.renderError('Detected previous session',
        <React.Fragment>
          Looks like you have already completed this HIT before as&nbsp;
          { this.stateStore.get('assignmentId', '???') }
          <br/>
          You should only complete this study once.
        </React.Fragment>,
        undefined, true);
    } else if (sessions.length <= currentSession) {
      return this.renderError('Current session exceeds total session count',
        'There is something wrong with the state of the application.',
        undefined, true);
    } else {
      const session = sessions[currentSession];
      if (session.type === 'intro') {
        return <Intro
          taskCount = { sessions.filter((s) => s.type === 'task').length }
          canAccept = { assignmentId !== 'ASSIGNMENT_ID_NOT_AVAILABLE' }
          onAccept = { () => {
          this.setState({
            'currentSession': currentSession + 1
          }, () => {
            this.updateStore();
          });
        } } />;
      } else if (session.type === 'consent') {
        return <Consent
            onAccept = { () => {
                // Move to the next session
                this.setState({
                  'hasConsent': true,
                  'currentSession': currentSession + 1
                }, () => {
                  this.updateStore();
                });
              } }
            onReject = { () => {
                // Move to the end
                this.setState({
                  'hasConsent': false,
                  'currentSession': sessions.length - 1
                }, () => {
                  this.updateStore();
                });
              } }
            taskCount = { sessions.filter((s) => s.type === 'task').length } />;
      } else if (session.type === 'interstitial') {
        return <Interstitial
          config = { session.props }
          onProgress = { () => {
            this.setState({
              'currentSession': currentSession + 1
            }, () => {
              this.updateStore();
            });
          } }/>
      } else if (session.type === 'training') {
        return <TrainingSession
          task = { sessions[currentSession].props }
          onComplete = { () => {
            this.setState({
              'currentSession': currentSession + 1
            }, () => {
              this.updateStore();
            });
          } }
        />
      } else if (session.type === 'task') {
        if (!hasConsent) {
          return this.renderError('Illegal application state',
            'Attempted to render a task without proper consent state.');
        }
        return <TaskSession
          debug = { debug }
          store = { store }
          taskId = { sessions[currentSession].name }
          task = { sessions[currentSession].props }
          onComplete={ () => {
            this.setState({
              'currentSession': currentSession + 1
            }, () => {
              this.updateStore();
            });
          } } />;
      } else if (session.type === 'survey') {
        if (!hasConsent) {
          return this.renderError('Illegal application state',
            'Attempted to render a task without proper consent state.');
        }
        return <Survey
          renderAsTable
          store = { store }
          config = { session.props }
          onComplete = { () => {
            this.setState({
              'currentSession': currentSession + 1
            }, () => {
              this.updateStore();
            });
          } }/>;
      } else if (session.type === 'exit-survey') {
        return <ExitSurvey
          assignmentId = { assignmentId }
          submitTarget = { submitTarget }
          debug = { debug }
          store = { store }
          hasSystemComparison = { false }
          hasConsent = { hasConsent }/>
      } else {
        return this.renderError('Unknown session type encountered',
          'There is something wrong with the configuration.',
          new Error('Unknown type: ' + session.type));
      }
    }
  }

  renderError(title:string, desc:string|JSX.Element,
    e?:Error, canRecover:boolean = false) {

    const { store } = this.props;
    const { showDbg } = this.state;
    const dbgDetails = <React.Fragment>
      <div className="pre">
        { btoa(JSON.stringify(store.serialize())) }
      </div>
      <p>
      And then click <a href="#reset-app" onClick = {
        (e) => {
          e.preventDefault();
          store.destroy();
          window.location.reload();
        }
      }>HERE</a> to&nbsp;
      <strong>reset</strong> the HIT.
      </p>
      <p>
      Be warned that this will reset your progress on the HIT!
      You may chose to report the problem to us through the final feedback
      form or via email/platform message. If so, please include the text above
      otherwise our ability to assist you may be limited.
      </p>
    </React.Fragment>;
    const recoverArea = <ErrorRecovery>
      <p>If you believe you are seeing this message in error, {
        !showDbg ?
          <a href="#show-recover"
            onClick = {
              () => { this.setState({showDbg: true})}}>click here</a> :
          'please save the text in the area below:'
      }</p>
      { showDbg ? dbgDetails : null }
    </ErrorRecovery>;
    return <ErrorBody>
      <ErrorHeader>{ title }</ErrorHeader>
      <p>{ desc }</p>
      { e ? <pre>{ e.stack }</pre> : null }
      { canRecover ? recoverArea : null }
    </ErrorBody>;
  }
}
