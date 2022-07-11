export interface QualQuestion {
  title: string;
  text: string;
  type: 'likert' | 'freeform' | 'continuous';
}

export const replaceNames = (s:string, name:string):string =>{
  return s.replace(new RegExp("\\$AI", 'g'), name);
}
