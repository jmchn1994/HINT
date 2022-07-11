import { StreamStoreView } from './local-backed-storage';

export interface ActionRecord {
  t:number;
  ns:string;
  event:string;
  data?:any;
}

export class ActionLogger {
  private _store:StreamStoreView<ActionRecord>;
  private _namespace:string;
  private _timestamp:number|null = null;
  constructor(store:StreamStoreView<ActionRecord>, namespace:string) {
    this._store = store;
    this._namespace = namespace;
  }

  get started():boolean {
    return this._timestamp !== null;
  }

  set started(_:boolean) {
    throw new Error('Read-only value cannot be set');
  }

  start() {
    if (this._timestamp === null) {
      this._timestamp = Date.now();
      this._store.insert({
        t: 0,
        ns: this._namespace,
        event: 'start'
      });
    } else {
      throw new Error('Already started!')
    }
  }

  log(eventName:string, eventData?:any) {
    if (this._timestamp === null) {
      throw new Error('Attempted to log event before the start!');
    }
    this._store.insert({
      t: Date.now() - this._timestamp,
      ns: this._namespace,
      event: eventName,
      data: eventData
    });
  }

  conclude() {
    if (this._timestamp === null) {
      throw new Error('Cannot conclude logger that has not been started');
    } else {
      this.log('end');
      this._timestamp = null;
    }
  }
}
