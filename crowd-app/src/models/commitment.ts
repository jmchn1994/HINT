export type CommitmentStatus = 'pending' | 'accepted' | 'rejected' | 'conflict';

export interface Commitment {
  name: string;
  status: CommitmentStatus;
  flagged?: boolean;
  time?: Date;
}
export type CommitmentMap = {[id:string]:Commitment};

interface RawCommitment {
  name: string;
  status: CommitmentStatus;
  time: string;
}
type RawCommitmentMap = {[id:string]:RawCommitment}

export const convertRawCommitments = (src:RawCommitmentMap):CommitmentMap => {
  const map:CommitmentMap = {};
  for (let key in src) {
    map[key] = {
      name: src[key].name,
      status: src[key].status,
      time: src[key].time !== '' ? new Date(src[key].time) : undefined
    }
  }
  return map;
};
