export type TokenType = 'span' | 'link' | 'date' | 'mention';

export interface Address {
  fullName: string;
  email: string;
}

export interface Token {
  id: string;
  type: TokenType;
  text: string;
}
export type Paragraph = Token[];


interface SimplifiedToken {
  id:string;
  p?:TokenType;
  t:string;
}
interface RawEmail {
  id: string;
  from: Address;
  to: Address[];
  cc: Address[];
  bcc: Address[];
  time: string;
  subject: string;
  body: SimplifiedToken[][];
  read: boolean;
}


export interface Email {
  id: string;
  from: Address;
  to: Address[];
  cc: Address[];
  bcc: Address[];
  time: Date;
  subject: string;
  body: Paragraph[];
  read: boolean;
}

export const getInitials = (address:Address):string => {
  const nameParts = address.fullName.trim().replace(/@.+?$/, '')
    .replace(/\(.+?\)/g, '')
    .split(/[^a-zA-Z0-9]/)
    .filter((part) => { return part.trim().length > 0; });
  if (nameParts.length === 0) {
    return address.fullName.length > 0 ?
      address.fullName[0].toUpperCase() : '';
  } else if (nameParts.length < 2) {
    return nameParts[0].substring(0, 1).toUpperCase();
  } else {
    return nameParts[0].substring(0, 1).toUpperCase() +
      nameParts[nameParts.length - 1].substring(0, 1).toUpperCase();
  }
}

export const createAddress = (address:string):Address => {
  const result = (new RegExp('(.+?)\\s*<(.+)>\\s*', 'g')).exec(address);
  if (result === null) {
    throw new Error('Address ' + address + ' cannot be parsed!');
  }
  return {
    'fullName': result[1].trim(),
    'email': result[2].trim()
  }
}

export const createEmail = (id:string,
  sender:string,
  recipients:string[],
  subject:string,
  body:string,
  cc:string[] = [],
  bcc:string[] = [],
  read:boolean = false):Email => {

  const paragraphs = body.split('\n\n');
  return {
    id: id,
    from: createAddress(sender),
    to: recipients.map(createAddress),
    cc: cc.map(createAddress),
    bcc: bcc.map(createAddress),
    time: (new Date()),
    subject: subject,
    read: read,
    body: paragraphs.map((text, i) => {
      return [{
          id: 'p-' + i,
          type: 'span',
          text: text
        }];
    })
  };
}

export const convertRawEmails = (emails:RawEmail[]):Email[] => {
  return emails.map((email) => {
    return {
      id: email.id,
      from: email.from,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      time: new Date(email.time),
      subject: email.subject,
      read: email.read,
      body: email.body.map((p) => {
        return p.map((st) => {
            return {
            'type': st.p ? st.p : 'span',
            'id': st.id,
            'text': st.t
          }
        });
      })
    };
  })
}
