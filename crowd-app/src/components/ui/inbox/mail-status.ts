import { CommitmentStatus } from '../../../models/commitment';

export interface TagStatus {
  event:boolean;
}
export interface ActionStatus {
  deleted:boolean;
  archived:boolean;
  flagged:boolean;
}

export interface SmartStatus {
  commitmentStatus?:CommitmentStatus;
}
