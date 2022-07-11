interface BackingStorage {
  setItem(key:string, value:string):void;
  getItem(key:string):string|null;
  removeItem(key:string):void;
}
interface Store {
  type:'map' | 'stream' | '_unknown';
}
interface MapStore extends Store {
  map:{[key:string]:any};
}
interface StreamStore<T> extends Store {
  stream:T[];
}
interface RecoveryStore extends Store {
  data:string;
}

class MemoryPersistence implements BackingStorage {
  private _storage:{[name:string]:string};
  constructor() {
    this._storage = {};
  }
  setItem(key:string, value:string) {
    this._storage[key] = value;
  }
  getItem(key:string):string|null {
    return key in this._storage ? this._storage[key] : null;
  }
  removeItem(key:string) {
    delete this._storage[key];
  }
}

class StoreView {
  private readonly storeName:string;
  private readonly backingStorage:BackingStorage;
  private _frozen:boolean;
  constructor (storeName:string, backingStorage:BackingStorage) {
    this.storeName = storeName;
    this.backingStorage = backingStorage;
    this._frozen = false;
  }

  protected reset(type:'map' | 'stream'):void {
    if (this._frozen) {
      throw new Error('Dataset frozen!');
    }
    if (type === 'map') {
      this.backingStorage.setItem(this.storeName, JSON.stringify({
        'type': 'map',
        'map': {}
      }));
    } else if (type === 'stream'){
      this.backingStorage.setItem(this.storeName, JSON.stringify({
        'type': 'stream',
        'stream': []
      }));
    }
  }

  protected read():Store {
    const record = this.backingStorage.getItem(this.storeName);
    if (record === null) {
      throw new Error('No record exists to read from!');
    }
    return JSON.parse(record) as Store;
  }

  protected write(store:Store):void {
    if (this._frozen) {
      throw new Error('Dataset frozen!');
    }
    this.backingStorage.setItem(this.storeName, JSON.stringify(store));
  }

  public freeze():void {
    this._frozen = true;
  }
}

export class MapStoreView extends StoreView {
  constructor(storeName:string, backingStorage:BackingStorage) {
    super(storeName, backingStorage);
    if (backingStorage.getItem(storeName) === null) {
      this.reset();
    }
  }

  private guaranteedRead():MapStore {
    try {
      const store:Store = this.read();
      if (store.type !== 'map') {
        throw new Error('Bad type for Store!');
      }
      return store as MapStore;
    } catch (e) {
      console.log(e);
      // There was an error reading, we will reset
      this.reset();
      return this.guaranteedRead();
    }
  }

  get<T>(key:string, defaultValue?:T):T {
    const store = this.guaranteedRead();
    if (key in store.map) {
      return store.map[key];
    } else {
      if (defaultValue === undefined) {
        throw new Error('Key does not exist and no default provided!');
      }
      return defaultValue;
    }
  }

  set(key:string, value:any):void {
    const store = this.guaranteedRead();
    store.map[key] = value;
    this.write(store);
  }

  remove(key:string):void {
    const store = this.guaranteedRead();
    delete store.map[key];
    this.write(store);
  }

  reset() {
    super.reset('map');
  }
}

export class StreamStoreView<T> extends StoreView {
  constructor(storeName:string, backingStorage:BackingStorage) {
    super(storeName, backingStorage);
    if (backingStorage.getItem(storeName) === null) {
      this.reset();
    }
  }

  private guaranteedRead():StreamStore<T> {
    try {
      const store:Store = this.read();
      if (store.type !== 'stream') {
        throw new Error('Bad type for Store!');
      }
      return store as StreamStore<T>;
    } catch (e) {
      console.log(e);
      // There was an error reading, we will reset
      this.reset();
      return this.guaranteedRead();
    }
  }

  insert(item:T) {
    const store = this.guaranteedRead();
    store.stream.push(item);
    this.write(store);
  }

  map(mapper:(item:T, index:number) => T) {
    const store = this.guaranteedRead();
    store.stream = store.stream.map(mapper);
    this.write(store);
  }
  reset() {
    super.reset('stream');
  }
}

export class LocalBackedStorage {
  private readonly _namespace:string;
  private readonly _persistence:BackingStorage;
  constructor(namespace:string = 'default-store', inMemory:boolean = false) {
    this._namespace = namespace;
    // Check if the local storage is available
    if (!inMemory && this.persistenceAvailable()) {
      this._persistence = localStorage;
    } else {
      this._persistence = new MemoryPersistence();
    }
  }

  private getDatasets():string[] {
    const trackKey = this._namespace + ':';
    let records = this._persistence.getItem(trackKey);
    let datasets = [];
    let names:{[name:string]:boolean}= {};
    if (records !== null) {
      records.split(';').forEach((name) => {
        names[name] = this._persistence.getItem(trackKey + name) !== null;
      });
    }
    for (var name in names) {
      datasets.push(name);
    }
    return datasets;
  }

  private rememberDataset(rawName:string):void {
    const trackKey = this._namespace + ':';
    const datasets = this.getDatasets();
    if (datasets.indexOf(rawName) < 0) {
      datasets.push(rawName)
    }
    this._persistence.setItem(trackKey, datasets.join(';'));
  }

  public persistenceAvailable():boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }

  public persistenceEnabled():boolean {
    return !(this._persistence instanceof MemoryPersistence);
  }

  public guaranteeMap(rawName:string):MapStoreView {
    if (rawName.length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.rememberDataset(rawName);
    const storeName = this._namespace + ':' + rawName;
    return new MapStoreView(storeName, this._persistence);
  }

  public guaranteeStream<T>(rawName:string):StreamStoreView<T> {
    if (rawName.length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.rememberDataset(rawName);
    const storeName = this._namespace + ':' + rawName;
    return new StreamStoreView<T>(storeName, this._persistence);
  }

  public destroy():void {
    this.getDatasets().forEach((name) => {
      this._persistence.removeItem(this._namespace + ':' + name);
    })
    this._persistence.removeItem(this._namespace + ':');
  }

  public serialize():{[name:string]:Store} {
    let datasets:{[name:string]:Store} = {};
    this.getDatasets().forEach((name:string) => {
      let dataset = this._persistence.getItem(this._namespace + ':' + name);
      if (dataset === null) {
        return;
      }
      try {
        datasets[name] = JSON.parse(dataset);
      } catch (e) {
        datasets[name] = {
          type: '_unknown',
          data: dataset
        } as RecoveryStore;
      }
    })
    return datasets;
  }
}
