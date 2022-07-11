import { Email } from '../../models/email';

export type Span = { start:number; length:number }
export type Highlighter = (text:string) => Span[];

interface IndexRecord {
  documentId:number;
  count:number;
  size:number;
  cheatRelevance?:number;
};
export type SearchIndex = {[token:string]:IndexRecord[]};
export type AugmentedIndex = {[token:string]:string[]};

interface IndexConfig {
  indexMaxNgram:number; // Set to
  abbrevMaxNgram:number;
}
const DEFAULT_CONFIG:IndexConfig = {
  indexMaxNgram: 2,
  abbrevMaxNgram: 4
}
const ngramTokens = (tokens:string[],
  maxNGram:number = 2,
  callback:(t:string[], ngram:number)=>void) =>{
  for (var ngram = maxNGram; ngram >= 1; ngram--) {
    for (var i = 0; i <= tokens.length - ngram; i++) {
      callback(tokens.slice(i, i + ngram), ngram);
    }
  }
}

const buildIndex = (messages:Email[],
  indexConfig:IndexConfig = DEFAULT_CONFIG) => {

  const index:SearchIndex = {};
  messages.forEach((message, documentId) => {
    const { indexMaxNgram, abbrevMaxNgram } = indexConfig;
    const subjectFull = message.subject + ' ' + message.from.fullName;
    const subjectTokens = subjectFull.split(/[^a-zA-Z0-9-]+/)
      .filter((t) => t.trim().length > 0);
    const bodyTokens = message.body.map((p):string => {
      return p.map((span) => span.text).join(' ');
    }).join(' ').split(/[^a-zA-Z0-9-]+/).filter((t) => t.trim().length > 0);
    // Token size
    const tokenSize = subjectTokens.length * 2 + bodyTokens.length;
    // Small object to keep track of message index
    const messageIndex:{[k:string]:IndexRecord} = {};
    let guaranteeRecord = (key:string) => {
      if (!(key in index)) {
        index[key] = [];
      }
      if (!(key in messageIndex)) {
        // First time for this key in main index
        messageIndex[key] = {
          documentId: documentId,
          count: 0,
          size: tokenSize
        };
        index[key].push(messageIndex[key]);
      }
      return messageIndex[key];
    };
    let callback = (weight:number) => {
      return (t:string[]) => {
        if (t.length <= indexMaxNgram) {
          let key = t.join(' ').toLowerCase();
          let record = guaranteeRecord(key);
          record.count += weight;
        }
        if (t.length <= abbrevMaxNgram && t.length > 1) {
          if (t[0][0] === t[0][0].toUpperCase() &&
            t[t.length - 1][0] === t[t.length - 1][0].toUpperCase()) {
            // Abbreviations can only work with first-last both caps
            let abbrevKey = t.map((tok) => {
                return tok[0];
              }).join('').toLowerCase();
            let record = guaranteeRecord(abbrevKey);
            record.count += weight;
          }
        }
        if (t.length === 1 && t[0] === t[0].toUpperCase()) {
          let record = guaranteeRecord(t[0]);
          record.count += weight;
        }
      }
    };
    ngramTokens(subjectTokens,
      Math.max(indexMaxNgram, abbrevMaxNgram),
      callback(2));
    ngramTokens(bodyTokens,
      Math.max(indexMaxNgram, abbrevMaxNgram),
      callback(1));
  });
  return index;
}

export interface SearchEngine {
  search(query:string, quick?:boolean):{searched:boolean, results:number[]};
  createHighlighter(query:string):Highlighter;
  summarize(results:number[]):any;
}

class BaseHighlighter {

  protected normalizeQuery(query:string):string[] {
    return query.trim().split(/[^a-zA-Z0-9-]+/)
      .filter((token) => token.length > 0);
  }

  createHighlighter(query:string):Highlighter {
    const normalized = this.normalizeQuery(query);

    return (text:string) => {
      const spans:Span[] = [];
      normalized.forEach((token) => {
        const literalToken = token.replace(/[.*+?^$}{()|[\]\\]/g, '\\$&');
        if (text.toLowerCase().indexOf(token.toLowerCase()) >= 0) {
          let matches = text.matchAll(new RegExp(literalToken, 'gi'));
          let match = matches.next();
          while (!match.done) {
            if (match.value.index !== undefined) {
              spans.push({
                'start': match.value.index,
                'length': match.value[0].length
              })
            }
            match = matches.next();
          }
        }
      });
      // Reorganize spans
      return spans.sort((a, b) => {
        return a.start < b.start ? -1 : (a.start > b.start ? 1 :
          (a.length < b.length ? 1 : (a.length > b.length ? -1 : 0)));
      }).filter((s, i, arr) => {
        for (var j = i - 1; j >= 0; j--) {
          if (arr[j].start + arr[j].length > s.start) {
            // Overlap
            return false;
          }
        }
        return true;
      });
    }
  }
}

export class SearchEngineWrapper implements SearchEngine {
  private _searchEngine:SearchEngine;
  private _elevated:number[];
  private _reversed:boolean;
  private _stable:boolean;
  private _variance:number;
  constructor(rootSe:SearchEngine, elevated:number[],
    reversed:boolean = false, stable:boolean = true, variance:number = 3) {

    this._searchEngine = rootSe;
    this._elevated = elevated;
    this._reversed = reversed;
    this._stable = stable;
    this._variance = variance;
  }

  createHighlighter(query:string) {
    return this._searchEngine.createHighlighter(query);
  }

  private _prng(seed:number, max:number):number {
    const h = Math.sin(seed * 7919) * 10000;
    const r = (h - Math.floor(h));
    for (var i = 0; i < max; i++) {
      let c = 1 - 1/Math.pow(3, i + 1);
      if (r < c) {
        return i;
      }
    }
    return max;
  }

  private _elevate(results:number[], fixedSeed:number):number[] {
    const elevated = results.filter((i) => this._elevated.indexOf(i) >= 0),
      others = results.filter((i) => this._elevated.indexOf(i) < 0);
    if (elevated.length === 0 ){
      return results; // No record, so drop
    }
    if (this._stable) {
      // This is stable, use standard high/low interpretation
      const noise = this._prng(fixedSeed, this._variance);
      const listPos = elevated.reduce(
        (acc, itm) => Math.min(results.indexOf(itm), acc),
        results.length);
      const injectIndex = Math.min(listPos, noise);
      if (this._reversed) {
        return others.slice(0, others.length - injectIndex)
          .concat(elevated)
          .concat(others.slice(others.length  - injectIndex,
            others.length));
      } else {
        return others.slice(0, injectIndex)
          .concat(elevated)
          .concat(others.slice(injectIndex, others.length));
      }
    } else {
      // Unstable mode, high perf = consistent-mid, low = inconsistent
      const targetPosition = this._reversed ?
        (Math.random() > 0.5 ?
          this._prng(fixedSeed, this._variance) :
          (results.length - this._prng(fixedSeed, this._variance))) :
        (3 + this._prng(fixedSeed, 2));
      return others.slice(0, targetPosition)
        .concat(elevated)
        .concat(others.slice(targetPosition, others.length));
    }
  }

  search(query:string, quick:boolean) {
    const results = this._searchEngine.search(query, quick);
    if (results.searched) {
      return {
        searched: results.searched,
        results: this._elevate(results.results, query.trim().length)
      }
    } else {
      return results;
    }
  }

  summarize(results:number[]) {
    return {
      refIndex: this._elevated.map((e) => results.indexOf(e))
    };
  }
}

export class RegexSearchEngine extends BaseHighlighter implements SearchEngine {
  private readonly _messages:Email[];
  constructor(messages:Email[]) {
    super();
    this._messages = messages;
  }

  search(query:string) {
    const tokens = this.normalizeQuery(query)
      .map((tok) => tok.toLowerCase())
      .map((tok) => tok.replace(/[.*+?^$}{()|[\]\\]/g, '\\$&'));
    if (tokens.length === 0) {
      return {
        searched: false,
        results: this._messages.map((_, i) => i)
      };
    }
    const regex = (new RegExp('(' + tokens.join('|') + ')', 'ig'));
    const results = this._messages.map((m, i) => {
      if (regex.exec(m.subject) !== null) {
        return i;
      }
      if (m.body.some((p) => p.some((s) => regex.exec(s.text) !== null))) {
        return i;
      }
      return null;
    }).filter((thing) => thing !== null) as number[];
    return {
      searched: true,
      results: results
    }
  }

  summarize(_results:number[]) {
    return;
  }
}

export class SimpleSearchEngine extends BaseHighlighter implements SearchEngine {
  private readonly _messages:Email[];
  private readonly _index:SearchIndex;
  private readonly _sort:boolean;

  constructor(messages:Email[], sort:boolean = true, index?:AugmentedIndex) {
    super();
    this._messages = messages;
    this._index = buildIndex(this._messages);
    this._sort = sort;
    // augment the index
    if (index) {
      for (let keyword in index) {
        index[keyword].forEach((id) => {
          if (!(keyword in this._index)) {
            this._index[keyword] = [];
          }
          // find the document
          let docId:number|null = null;
          for (let i = 0; i < this._messages.length; i++) {
            if (this._messages[i].id === id) {
              docId = i;
              break;
            }
          }
          if (docId === null) {
            return; // Do nothing
          }
          this._index[keyword].push({
            documentId: docId,
            count: 1,
            size: 1,
            cheatRelevance: 1
          });
        });
      }
    }
  }

  private scores(terms:string[],
    partial:boolean = false):{[documentId:number]:number} {

    let standardKey = terms.join(' ');
    let scores:{[documentId:number]:number} = {};
    if (standardKey in this._index) {
      // Found exact textual match
      this._index[standardKey].forEach((r) => {
        if (!(r.documentId in scores)) {
          scores[r.documentId] = 0;
        }
        scores[r.documentId] += (r.count / r.size) *
          Math.log(this._messages.length / this._index[standardKey].length);
        if (r.cheatRelevance) {
          scores[r.documentId] += r.cheatRelevance;
        }
      });
    } else if (standardKey.toLowerCase() in this._index) {
      // Found generic textual match
      this._index[standardKey.toLowerCase()].forEach((r) => {
        if (!(r.documentId in scores)) {
          scores[r.documentId] = 0;
        }
        scores[r.documentId] += (r.count / r.size) *
          Math.log(this._messages.length /
            this._index[standardKey.toLowerCase()].length);
        if (r.cheatRelevance) {
          scores[r.documentId] += r.cheatRelevance;
        }
      });
    } else if (partial && standardKey.length < 10){
      // Try to find a partial prefix match
      let normalizedKey = standardKey.toLowerCase();
      for (var key in this._index) {
        if (key.toLowerCase().startsWith(normalizedKey)) {
          this._index[key].forEach(((k) => {
            return (r:IndexRecord) => {
              if (!(r.documentId in scores)) {
                scores[r.documentId] = 0;
              }
              scores[r.documentId] += (r.count / r.size) *
                Math.log(this._messages.length /
                  this._index[k].length);
              if (r.cheatRelevance) {
                scores[r.documentId] += r.cheatRelevance;
              }
            };
          })(key));
        }
      }
    }
    return scores;
  }

  search(query:string, quick:boolean = false) {
    const normalized = this.normalizeQuery(query);
    if (normalized.length === 0) {
      return {
        'searched': false,
        'results': this._messages.map((_, i) => i)
      };
    } else {
      let scores:{[documentId:number]:number} = {};
      ngramTokens(normalized, 2, (tokens, grams) => {
        let partialScores = this.scores(tokens, !quick);
        for (var dId in partialScores) {
          if (!(dId in scores)) {
            scores[dId] = 0;
          }
          scores[dId] += partialScores[dId] * Math.pow(3, grams - 1);
        }
      });
      // Sort
      let results = [];
      for (var dId in scores) {
        results.push(parseInt(dId));
      }
      return {
        'searched': true,
        'results': !this._sort ? results : results.sort((a, b) => {
          return scores[a] > scores[b] ? -1 :
            (scores[a] < scores[b] ? 1 : 0);
        })
      }
    }
  }

  summarize(_results:[]) {
    return;
  }
}
