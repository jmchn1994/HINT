import { Email } from '../../models/email';
import { Commitment, CommitmentMap } from '../../models/commitment';

type CommitmentIndex = {index:number,commitment:Commitment};

const shuffle = <T>(arr:T[]):T[] => {
  for (let i = arr.length - 1; i > 0;i--) {
    const j = Math.floor(Math.random() * i)
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr;
};

export interface CommitmentEngine {
  extract(e:Email):Commitment|undefined;
  findPriority(emails:Email[], now:Date):CommitmentIndex|undefined;
}

export class CommitmentEngineWrapper implements CommitmentEngine {
  private _parent:CommitmentEngine;
  private _maskMap:CommitmentMap;
  constructor(parent:CommitmentEngine) {

    this._parent = parent;
    this._maskMap = {};
  }

  recover(emails:Email[]) {
    emails.forEach((m) => {
      const commitment = this._parent.extract(m);
      this._maskMap[m.id] = commitment !== undefined ? commitment : {
        'name': m.subject,
        'status': 'pending',
        'flagged': true
      };
    })
  }

  train(emails:Email[],
    precTarget:number = 1,
    recallTarget:number = 1):Email[] {

    const positive = shuffle(emails.filter(
        (e) => this._parent.extract(e) !== undefined)),
      negative = shuffle(emails.filter(
        (e) => this._parent.extract(e) === undefined));
    const pos = Math.round(recallTarget * positive.length),
      neg = pos * (1 - precTarget)/precTarget;
    const constructedList = [];
    // sample from positives
    for (let i = 0; i < pos; i++) {
      constructedList.push(positive[i]);
    }
    // sample from negatives
    for (let i = 0; i < neg; i++) {
      constructedList.push(negative[i]);
    }
    // Build the masked map
    this.recover(constructedList);
    return constructedList;
  }

  extract(e:Email) {
    return this._maskMap[e.id];
  }

  findPriority(_emails:Email[], _now:Date) {
    return undefined;
  }
}

export class NullCommitmentEngine implements CommitmentEngine {
  extract() { return undefined; }
  findPriority() { return undefined; }
}

export class KeywordCommitmentEngine implements CommitmentEngine {
  private _regex:RegExp;

  constructor() {
    this._regex = (new RegExp('meet|event|chat', 'ig'));
  }

  extract(e:Email) {
    const commitment = {
      'name': e.subject,
      'status': 'pending'
    } as Commitment;
    if (this._regex.exec(e.subject) !== null) {
      return commitment;
    }
    return e.body.some((p) => {
        return p.some((tok) => this._regex.exec(tok.text) !== null);
      }) ? commitment : undefined;
  }

  findPriority(_emails:Email[]) {
    return undefined;
  }
}

export class SimpleCommitmentEngine implements CommitmentEngine {
  private _commitments:CommitmentMap;
  constructor(commitments?:CommitmentMap) {
    this._commitments = commitments === undefined ? {} : commitments;
  }

  extract(e:Email) {
    if ( e.id in this._commitments ) {
      const commitment = this._commitments[e.id];
      if (commitment !== undefined && commitment.name === '') {
        commitment.name = e.subject;
      }
      return commitment;
    }
  }

  findPriority(_emails:Email[]) {
    return undefined;
  }
}
