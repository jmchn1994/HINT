export interface SmartComposeAPI {
  getSuggestion(text:string):Promise<string[]>;
}

export class DefaultSmartComposeAPI implements SmartComposeAPI {
  getSuggestion(_text:string) {
    return Promise.resolve([]);
  }
}
