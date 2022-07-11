export type SessionType = 'intro' | 'consent' | 'exit-survey' | 'task' | 'survey' | 'interstitial' | 'training';

export class Session<T> {
  private _type:SessionType;
  private _name:string;
  private _props:T | null;

  constructor (name:string, type:SessionType = 'task', props:(T | null) = null) {
    this._type = type;
    this._name = name;
    this._props = props;
  }

  get type():SessionType {
    return this._type;
  }

  set type(_:SessionType) {
    throw new Error('Session type cannot be changed once constructed');
  }

  get name() {
    return this._name;
  }

  set name(_:string) {
    throw new Error('Session name cannot be changed once constructed');
  }

  get props():T {
    if (this._props === null) {
      throw new Error('Session properties not set but attempting read!');
    }
    return this._props;
  }

  set props(item:T) {
    this._props = item;
  }
}
