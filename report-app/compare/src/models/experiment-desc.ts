interface ExperimentCondition {
  short: string;
  long: string;
  details: string;
}

interface Participants {
  total: number;
  selected?: number;
}

export interface ExperimentDesc {
  toolName:string;
  conditions:ExperimentCondition[];
  participants:Participants[];
  deployTime:string[];
  desc:string;
}
