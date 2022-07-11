"""mailtools
Tools for reading enron emails
"""
import quopri
import re
from email.utils import parsedate
import time

def clean_name(name):
  name = re.sub(r'\s*<.+?>$', '', name)
  name = re.sub(r'"(.+?)".*?$', r'\1', name)
  return name

def extract_people(headers, field = 'to'):
  people = []
  if field in headers and f'x-{field}' in headers:
    records = zip(headers[field].split(','),
      headers[f'x-{field}'].split(','))
    for person in records:
      people.append({
        'fullName': clean_name(personp[1]),
        'email': person[0]
      })
  return people

def load_email(id, file):
  headers, body = {}, []
  headers_completed, last_header = False, None
  for line in file:
    if len(line.strip()) == 0:
      headers_completed = True
      continue
    if headers_completed:
      body.append(line)
    else:
      if ':' in line:
        key, value = [x.strip() for x in line.split(':', 1)]
        if not key in headers:
          headers[key.lower()] = value
        else:
          headers[key.lower()] += ' ' + value
        last_header = key.lower()
      else:
        headers[last_header] += ' ' + line.strip()

  # Deal with body
  encoding = 'utf-8'
  if 'content-type' in headers:
    parts = [part.lower().strip()
      for part in headers['content-type'].split(';', 1)]
    encodings = [enc
      for enc in parts if enc.startswith('charset=')]
    if len(encodings) > 0:
      encoding = encodings[0][8:].strip()

  # Quopri the body
  if 'content-transfer-encoding' in headers and \
    headers['content-transfer-encoding'] == 'quoted-printable':

    try:
      body = [quopri.decodestring(l).decode(encoding) for l in body]
    except Exception as e:
      print(id)
      print(e)

  return Email(id, headers, body)

class Email:
  def __init__(self, id, headers, body):
    self.id = id
    self._headers = headers
    self._body = body
    self.read = False

  def getId(self):
    return self.id

  def getPeopleField(self, field = 'to'):
    return extract_people(self._headers, field)

  def getSubject(self):
    return headers['subject'] if 'subject' in headers else '(No subject)'

  def getFrom(self):
    return {
      'fullName': clean_name(self._headers['x-from']),
      'email': self._headers['from']
    }

  def getDate(self):
    return parsedate(self._headers['date'])

  def getBody(self):
    paragraphs, current = [], None
    for line in self._body:
      if current is None:
        current = []
      if len(line.strip()) == 0:
        if len(current) > 0:
          # Push the current paragraph in
          paragraphs.append(current)
          current = None
      else:
        current.append({
          'id': f's-{len(current)}',
          't': line.strip() + '\n'
        })
    if not current is None and len(current) > 0:
      paragraphs.append(current)
    return paragraphs

  def getRawBody(self):
    return ''.join(self._body)

  def toPOJO(self):
    return {
      'id': self.id,
      'subject': self.getSubect(),
      'to': self.getPeopleField('to'),
      'cc': self.getPeopleField('cc'),
      'bcc': self.getPeopleField('bcc'),
      'time': self._headers['date'],
      'read': self.read,
      'body': self.getBody()
    }
