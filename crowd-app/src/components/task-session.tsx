import React from 'react';
import styled from 'styled-components';

import { Dialog,
  DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton } from 'office-ui-fabric-react';

import { LocalBackedStorage,
  MapStoreView } from '../store/local-backed-storage';
import { ActionLogger, ActionRecord } from '../store/action-logger';
import { TaskConfig } from '../models/task-config';

import TaskControls from './controls/task-controls';
import { Composer } from './ui/composer';
import { Inbox } from './ui/inbox';
import { TagStatus, ActionStatus } from './ui/inbox/mail-status';
import { SimpleSearchEngine,
  RegexSearchEngine,
  NullCommitmentEngine,
  SimpleCommitmentEngine,
  SearchEngineWrapper,
  CommitmentEngineWrapper } from './smart';
import { SearchEngine } from './smart/search-engine';
import { CommitmentEngine } from './smart/commitment-engine';
import { SearchTaskConfig,
  CommitmentTaskConfig,
  ComposeTaskConfig } from '../models/task-config';

interface Props {
  task:TaskConfig;
  taskId:string;
  store:LocalBackedStorage;
  debug?:boolean;
  onComplete?:() => void;
}

interface State {
  errorMessage?:string;
}

const InstructionsWrap = styled.div`
  background-color: #fff;
  padding: 5px 15px;

  & .instr-smaller {
    font-size: 14px;
  }
  & .instr-main {
    font-weight: 500;
  }
`;
const TaskBanner = styled.div<{color:'blue'|'yellow'}>`
  border-radius: 6px;
  padding: 0.3rem;
  margin: 10px 5px;
  border: 1px solid ${props => props.color === 'blue' ? '#b8daff' : '#ffeeba'};
  background-color: ${props => props.color === 'blue' ? '#cce5ff' : '#fff3cd'};
  color: ${props => props.color === 'blue' ? '#004085' : '#856404'}
`;

export default class TaskSession extends React.Component<Props, State> {
  private _logger:ActionLogger;
  private _taskState:MapStoreView;
  private _instConfig:MapStoreView;
  constructor(props:Props) {
    super(props);
    this._logger = new ActionLogger(
      props.store.guaranteeStream<ActionRecord>('action-log'), props.taskId);
    this._taskState = props.store.guaranteeMap('task-state-' + props.taskId);
    this._instConfig = props.store.guaranteeMap('config-' + props.taskId);
    this.state = {};
  }

  componentDidMount() {
    this._logger.start();
  }

  private dismissError() {
    this.setState({
      errorMessage: undefined
    });
  }

  private complete() {
    const { task, onComplete } = this.props;
    // Check if they are finished
    if (task.type === 'search') {
      const actions = this._taskState.get<ActionStatus[]>('actionStatus', []);
      const flagCount = actions.reduce((prev, curr) => {
          return curr.flagged ? prev + 1 : prev;
        }, 0);
      if (flagCount < 1) {
        this.log('exit-fail', { flagged: flagCount });
        this.setState({
          errorMessage: 'You should have flagged at least 1 email!'
        });
        return;
      }
    } else if (task.type === 'commitment') {
      const tags = this._taskState.get<TagStatus[]>('tagStatus', []);
      const eventCount = tags.reduce((prev, curr) => {
          return curr.event ? prev + 1 : prev;
        }, 0);
      if (eventCount < 1) {
        this.log('exit-fail', { events: eventCount });
        this.setState({
          errorMessage: 'You should have tagged at least 1 event!'
        });
        return;
      }
    }
    this._logger.conclude();
    if (onComplete) {
      onComplete();
    }
  }

  private log(eventName:string, eventData?:any) {
    this._logger.log(eventName, eventData);
  }

  render() {
    const { task } = this.props;
    const blueBanner = <TaskBanner color = {'blue'}>
        This is a task in the BLUE group.
      </TaskBanner>,
      yellowBanner = <TaskBanner color = {'yellow'}>
          This is a task in the YELLOW group.
        </TaskBanner>;
    const instructions = <InstructionsWrap>
        {task.desc.map((t, i) => {
          return <p key = { i } className= "instr-main" >{ t }</p>;
        })}
        <p className = "instr-smaller">
          Note: You will receive a bonus of up to $0.5 for tagging all the
          emails requested by the instructions (In the case of multiple emails
          $0.1 is deducted from this bonus for every email missing or extra.
          In the case of a single email, $0.5 is given based on whether the
          correct email was identified)
        </p>
      </InstructionsWrap>;
    const before = task.group === undefined ? undefined :
      (task.group === 'blue' ? blueBanner : yellowBanner);
    return <React.Fragment>
        <TaskControls
          completeButtonMode = 'inside'
          instructions = { instructions }
          sidebarAfter = { before }
          showControls
          onComplete = { () => {
            this.complete();
          } } >
          { this.renderMain() }
        </TaskControls>
        { this.renderError() }
      </React.Fragment>;
  }

  renderError() {
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

  renderMain() {
    const { task, debug } = this.props;
    if (task.type === 'search') {
      // Search Task configuration
      const searchTask = task as SearchTaskConfig;
      let engine:SearchEngine = searchTask.perfMode === 'baseline' ?
        new RegexSearchEngine(searchTask.messages) :
        new SimpleSearchEngine(searchTask.messages, true, searchTask.index);
      const reversed:boolean = searchTask.perfMode !== 'full';
      this._instConfig.set('stable', searchTask.isStable);
      this._instConfig.set('performance', searchTask.perfMode);
      if (searchTask.perfMode !== 'baseline') {
        if (searchTask.promoted !== undefined) {
          const promoteList = searchTask.promoted;
          const promotedIds:number[] = searchTask.messages.map((m, i) => {
            return promoteList.indexOf(m.id) >= 0 ? i : null;
          }).filter((t) => t !== null) as number[];
          engine = new SearchEngineWrapper(engine, promotedIds,
            reversed, searchTask.isStable);
        } else {
          engine = new SearchEngineWrapper(engine, []);
        }
      }
      return <Inbox
        showToolbar = { false }
        debug = { debug }
        store = { this._taskState }
        actions = { searchTask.actions }
        refTime = { searchTask.messages[0].time }
        searchProvider = { engine }
        onEvent = { this.log.bind(this) }
        messages = { searchTask.messages } />
    } else if (task.type === 'commitment') {
      const commitmentTask = task as CommitmentTaskConfig;
      let messages = commitmentTask.messages;
      let engine:CommitmentEngine = commitmentTask.perfMode === 'baseline' ?
        new NullCommitmentEngine() :
        new SimpleCommitmentEngine(commitmentTask.commitments);

      this._instConfig.set('performance', commitmentTask.perfMode);

      if ((typeof commitmentTask.perfMode === 'string') &&
        commitmentTask.perfMode !== 'baseline') {

        const oldList = this._instConfig.get<string[]|null>(
          'commitment-list', null);
        const wrappedEngine = new CommitmentEngineWrapper(engine);
        if (oldList === null) {
          // Train the list
          console.log('Training list');
          if (commitmentTask.perfMode.startsWith('stable')) {
            const newList = wrappedEngine.train(commitmentTask.messages, 0.8, 0.8);
            this._instConfig.set('commitment-list', newList.map((m) => m.id));
          } else if (commitmentTask.perfMode.startsWith('variable-high')) {

            const newList = wrappedEngine.train(commitmentTask.messages, 1, 1);
            this._instConfig.set('commitment-list', newList.map((m) => m.id));
          } else if (commitmentTask.perfMode.startsWith('variable-low')) {

            const newList = wrappedEngine.train(commitmentTask.messages, 0.6, 0.6);
            this._instConfig.set('commitment-list', newList.map((m) => m.id));
          }
        } else {
          // Recover the list
          console.log('Recovering list');
          const recovered = commitmentTask.messages.filter(
            (e) => oldList.indexOf(e.id) >= 0);
          wrappedEngine.recover(recovered);
        }
        engine = wrappedEngine;

        // Modify the messages if hinting is enabled
        if (commitmentTask.perfMode.endsWith('-hinted')) {
          messages = messages.map((m) => {
            if (engine.extract(m) !== undefined) {
              m.subject = 'Save the date: ' + m.subject;
            }
            return m;
          });
        }

      }

      return <Inbox
        showToolbar = { false }
        debug = { debug }
        store = { this._taskState }
        actions = { commitmentTask.actions }
        refTime = { commitmentTask.messages[0].time }
        commitmentProvider = { engine }
        onEvent = { this.log.bind(this) }
        messages = { commitmentTask.messages } />
    } else if (task.type === 'compose') {
      const message = (task as ComposeTaskConfig).parent;
      return <Composer
        store = { this._taskState }
        onEvent = { this.log.bind(this) }
        message = { message }/>
    } else {
      return <div>Task type not found!</div>;
    }
  }
}
