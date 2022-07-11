import { Email } from './email';
import { CommitmentMap } from './commitment';

import { InboxAction } from '../components/ui/inbox';
import { AugmentedIndex } from '../components/smart/search-engine';

export type TaskType = 'search' | 'compose' | 'commitment';

export interface TaskConfig {
  type:TaskType;
  desc:string[];
  systemName:string;
  perfMode?:string;
  group?:'blue'|'yellow';
}

interface InboxTaskConfig extends TaskConfig {
  messages:Email[];
  actions:InboxAction[];
}

export interface SearchTaskConfig extends InboxTaskConfig {
  systemName:'Smart Search';
  index?:AugmentedIndex;
  promoted?:string[];
  isStable:boolean;
}

export interface ComposeTaskConfig extends TaskConfig {
  systemName:'Compose Assistant';
  parent:Email;
}

export interface CommitmentTaskConfig extends InboxTaskConfig {
  systemName:'Event Detector';
  commitments?:CommitmentMap;
}
