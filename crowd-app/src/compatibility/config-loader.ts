import { Session } from '../models/session';
import { TaskConfig,
  SearchTaskConfig,
  ComposeTaskConfig,
  CommitmentTaskConfig } from '../models/task-config';
import { SurveyConfig } from '../models/survey-config';
import { InterstitialConfig } from '../models/interstitial-config';
import { TrainingConfig } from '../models/training-config';

import { convertRawEmails } from '../models/email';
import { convertRawCommitments } from '../models/commitment';

const createDelayedPromise = <T>(item:any, delay:number):Promise<T> => {
  if (delay === 0) {
    return Promise.resolve(item);
  }
  return new Promise((resolve, _) => {
    setTimeout(() => {
      resolve(item);
    }, delay);
  });
}

export default class ConfigLoader {
  private loadSession(def:any, index:number):Session<any> {
    const type = 'type' in def ? def['type'] : '',
      name = 'name' in def ? def['name'] : ('session-' + index);
    if (type === 'task' && 'task' in def) {
      const perfMode = ('perfMode' in def ? def['perfMode'] : (
        def['isBaseline'] === 'true' ? 'baseline' : 'standard'));

      if (def['task'] === 'search') {
        return new Session<SearchTaskConfig>(name, type, {
          'type': def['task'],
          'systemName': 'Smart Search',
          'actions': def['actions'],
          'desc': def['desc'],
          'group': def['group'],
          'perfMode': perfMode,
          'isStable': 'isStable' in def ? def['isStable'] === 'true' : true,
          'promoted': def['promoted'],
          'index': def['index'],
          'messages': convertRawEmails(def['messages'])
        });
      } else if (def['task'] === 'compose') {
        return new Session<ComposeTaskConfig>(name, type, {
          'type': def['task'],
          'systemName': 'Compose Assistant',
          'desc': def['desc'],
          'group': def['group'],
          'perfMode': perfMode,
          'parent': def['parent']
        });
      } else if (def['task'] === 'commitment') {
        return new Session<CommitmentTaskConfig>(name, type, {
          'type': def['task'],
          'actions': def['actions'],
          'systemName': 'Event Detector',
          'desc': def['desc'],
          'group': def['group'],
          'perfMode': perfMode,
          'commitments': convertRawCommitments(def['commitments']),
          'messages': convertRawEmails(def['messages'])
        });
      }
    } else if (type === 'interstitial') {
      return new Session<InterstitialConfig>(name, type, {
        'title': def['title'],
        'desc': def['desc'],
        'group': 'group' in def ? def['group'] : ''
      });
    } else if (type === 'training') {
      return new Session<TrainingConfig>(name, type, {
        'for': def['for']
      });
    }
    return new Session(name, type);
  }

  private createSessionsFromDef(data:object[]):Session<any>[] {
    const sessions = data.map((def, i) => {
      if (typeof def !== 'object') {
        return null;
      }
      return this.loadSession(def, i);
    }).filter((session) => {
      // Gets rid of the nulls!
      return session !== null;
    }) as Session<any>[];
    // Create corresponding survey sessions
    const surveyed = sessions.reduce((acc, current) => {
      acc.push(current);
      if (current.type === 'task') {
        const currentConfig = current as Session<TaskConfig>;
        if (currentConfig.props.perfMode === 'baseline') {
          acc.push(new Session<SurveyConfig>('survey-' + current.name,
            'survey',
            {
              taskId: current.name,
              systemName: currentConfig.props.systemName,
              questionSet: ['d-task','q-confidence','q-effort']
            }));
        } else {
          acc.push(new Session<SurveyConfig>('survey-' + current.name,
            'survey',
            {
              taskId: current.name,
              systemName: currentConfig.props.systemName,
              questionSet: [
                'd-task', 'q-ot-change-same', 'q-ot-change-better',
                'q-confidence','q-effort','q-utility','d-history',
                'q-mentalmodel', 'q-trust'] // , 'q-stickiness'
            }));
        }
      }
      return acc;
    }, [] as Session<any>[]);
    return [new Session<any>('introduction', 'intro'),
      new Session<any>('consent', 'consent')].concat(surveyed).concat([
      new Session<any>('survey-exit', 'exit-survey')
    ]);
  }

  public async loadFromNetwork(url:string):Promise<Session<any>[]> {
    return fetch(url).then((resp) => {
      return resp.json();
    }).then((data) => {
      if (!('sessions' in data) || !Array.isArray(data['sessions'])) {
        throw new Error('Data illegal! Must be an array of sessions!');
      } else {
        return this.createSessionsFromDef(data['sessions']);
      }
    });
  }

  public async loadFromDOM(dom:HTMLElement|null):Promise<Session<any>[]> {
    if (dom === null) {
      return Promise.reject(new Error('DOM element not found'));
    }
    try {
      const data = JSON.parse(atob(dom.innerHTML.trim()));
      if (!('sessions' in data) || !Array.isArray(data['sessions'])) {
        throw new Error('Data illegal! Must be an array of sessions!');
      } else {
        return createDelayedPromise(this.createSessionsFromDef(data['sessions']), 0);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
