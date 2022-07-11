import os
import quopri
import re
import json
import random
import math

from dateutil.parser import parse
from os.path import join, dirname, abspath, isdir, isfile

from constants import MAILDIR

def cleanName(name):
  name = re.sub(r'\s*<.+?>$', '', name)
  name = re.sub(r'"(.+?)".*?$', r'\1', name)
  return name

def extractPeople(headers, field = 'to'):
  if field in headers:
    people = zip(headers[field].split(','), headers[f'x-{field}'].split(','))
    return [
      {
        'fullName': cleanName(person[1]),
        'email': person[0]
      } for person in people
    ]
  return []

def parseEmail(id, headers, body, read = True, limitPeople = None):
  toField = extractPeople(headers, 'to')
  ccField = extractPeople(headers, 'cc')
  bccField = extractPeople(headers, 'bcc')

  if not limitPeople is None:
    toField = toField[:limitPeople]
    ccField = ccField[:limitPeople]
    bccField = bccField[:limitPeople]

  # Construct the body
  paragraphs, currentP = [], None
  for line in body:
    if currentP is None:
      currentP = []
    if len(line.strip()) == 0:
      if len(currentP) > 0:
        # Push the current paragraph in
        paragraphs.append(currentP)
        currentP = None
    else:
      currentP.append({
        'id': f's-{len(currentP)}',
        't': line.strip() + '\n'
      })
  if not currentP is None and len(currentP) > 0:
    paragraphs.append(currentP)
    currentP = None

  email = {
    'id': id,
    'subject': headers['subject'] if 'subject' in headers else '(No subject)',
    'from': {
      'fullName': cleanName(headers['x-from']),
      'email': headers['from']
    },
    'to': toField,
    'cc': ccField,
    'bcc': bccField,
    'time': headers['date'],
    'read': read,
    'body': paragraphs
  }
  return email

def readEmail(filename):
  with open(filename, 'r') as f:
    headers = {}
    lastHeader = None
    body = None
    inferredEncoding = None
    try:
      for line in f:
        line = line.strip()
        if len(line) == 0 and body is None:
          body = []
          # Infer encoding
          if not 'content-type' in headers:
            inferredEncoding = 'utf-8'
          else:
            bits = [p.lower().strip()
              for p in headers['content-type'].split(';', 1)]
            encodings = [enc
              for enc in bits if enc.startswith('charset=')]
            if len(encodings) > 0:
              inferredEncoding = encodings[0][8:].strip()
            else:
              inferredEncoding = 'utf-8'
        if body is None:
          # is a header
          if ':' in line:
            key, value = line.split(':', 1)
            headers[key.lower()] = value.strip();
            lastHeader = key.lower()
          else:
            headers[lastHeader] += ' ' + line;
        else:
          # is a body line
          try:
            body.append(quopri.decodestring(line).decode(inferredEncoding))
          except Exception as e:
            pass
    except UnicodeDecodeError as e:
      print(e)
      print(filename)
    return headers, body

def findMail(path, rangeMin = None, rangeMax = None):
  # Sanity check that the directories exist
  targetdir = join(MAILDIR, path)
  if isfile(targetdir):
    return ['']

  if not isdir(targetdir):
    raise Exception(f'Cannot find directory {targetdir}!')

  mail = sorted([mail
      for mail in os.listdir(targetdir) if isfile(join(targetdir, mail))],
    key=lambda n: int(n[:-1]))
  if not rangeMin is None:
    if not rangeMax is None:
      mail = mail[rangeMin:rangeMax]
    else:
      mail = mail[rangeMin:]
  else:
    if not rangeMax is None:
      mail = mail[:rangeMax]

  return mail

def _applyParams(mail, params):
  params = set(params)
  if 'some-unread' in params:
    if random.random() > 0.8:
      mail['read'] = False
  if 'all-unread' in params:
    mail['read'] = False
  return mail

def buildMessages(cfgStr):
  src, params = [t.strip() for t in cfgStr.split(':', 1)]
  if src == 'raw-list':
    for p in params.split(','):
      id = p.strip()
      if len(id) == 0:
        continue

      path = join(MAILDIR, id)
      try:
        headers, body = readEmail(path)
        mail = parseEmail(id, headers, body, limitPeople = 5)
        mail['read'] = False
        yield mail
      except Exception:
        continue
  else:
    rangeMin, rangeMax = None, None
    if '@' in src:
      src, constraints = [t.strip() for t in src.split('@', 1)]
      if '~' in constraints:
        rMin, rMax = [x.strip() for x in constraints.split('~', 1)]
        rangeMin = int(rMin) if len(rMin) != 0 else None
        rangeMax = int(rMax) if len(rMax) != 0 else None
    mailFiles = findMail(src, rangeMin, rangeMax)
    for mailFile in mailFiles:
      path = join(MAILDIR, src, mailFile)
      headers, body = readEmail(path)
      mail = parseEmail(src + '/' + mailFile, headers, body, limitPeople = 5)
      # Apply params
      mail = _applyParams(mail, [p.strip() for p in params.split(';') if len(p.strip()) > 0])
      yield mail

def buildIndex(cfgStr, prevIndex):
  kw, messages = [t.strip() for t in cfgStr.split('|', 1)]
  if not kw in prevIndex:
    prevIndex[kw] = [m.strip() for m in messages.split(';') if len(m.strip()) > 0]
  return prevIndex

def tagCommitments(cfgStr, prevCommitments):
  id, status, name, time  = [t.strip() for t in cfgStr.split('|')]
  prevCommitments[id] = {
    'name': name,
    'status': status,
    'time': time
  }
  return prevCommitments

def buildFromConfig(filename):
  """
  Parses a config file that's loosely reminiscent of a markdown file.
  """
  taskSpec = []
  with open(filename, 'r') as f:
    currentSession, lastKey = None, None
    for line in f:
      line = line.strip()
      if len(line) == 0:
        lastKey = None
        continue

      if line.startswith('##'):
        if not currentSession is None:
          taskSpec.append(currentSession)
        currentSession = {
          'type': 'task',
          'name': line[2:].strip()
        }
      elif line.startswith('#?'):
        if not currentSession is None:
          taskSpec.append(currentSession)
        currentSession = {
          'type': 'training',
          'name': line[2:].strip()
        }
      elif line.startswith('#'):
        if not currentSession is None:
          taskSpec.append(currentSession)
        currentSession = {
          'type': 'interstitial',
          'name': line[1:].strip()
        }
      elif line.startswith('>'):
        text = line[1:].strip()
        text = re.sub(r'\\n', '\n', text)
        if not 'desc' in currentSession:
          currentSession['desc'] = [text]
        else:
          currentSession['desc'].append(text)
      elif line.startswith('-'):
        if lastKey is None:
          raise Exception('Format error, key lost!')
        if key == 'messages':
          for message in buildMessages(line[1:].strip()):
            currentSession[key].append(message)
        elif key == 'promoted':
          currentSession[key].append(line[1:].strip())
        elif key == 'actions':
          currentSession[key].append(line[1:].strip())
        elif key == 'commitments':
          currentSession[key] = tagCommitments(
            line[1:].strip(), currentSession[key])
        elif key == 'index':
          currentSession[key] = buildIndex(
            line[1:].strip(), currentSession[key])
      elif lastKey is None:
        kvpair = line.split(':', 1)
        if len(kvpair) == 2:
          key, value = kvpair
          key, value = key.strip(), value.strip()
          if key == 'messages':
            currentSession[key] = []
          elif key == 'promoted':
            currentSession[key] = []
          elif key == 'commitments':
            currentSession[key] = {}
          elif key == 'index':
            currentSession[key] = {}
          elif key == 'actions':
            currentSession[key] = []
          else:
            currentSession[key] = value
          lastKey = key
      else:
        assert lastKey in currentSession
        currentSession[lastKey] += '\r\n' + value.strip()
  if not currentSession is None:
    taskSpec.append(currentSession)
  for spec in taskSpec:
    if 'messages' in spec:
      spec['messages'] = sorted(spec['messages'],
        key=lambda m: parse(m['time']),
        reverse=True)
  # Post processing
  return {'sessions': taskSpec}

if __name__ == '__main__':
  import argparse
  from base64 import b64encode
  parser = argparse.ArgumentParser(description='Build a task descriptor json file.')
  parser.add_argument('config', action='store',
            help='Configuration file or directory to read')
  parser.add_argument('-o', '--out', dest='outfile', action='store',
            default = None, help='Output file. Defaults to STDOUT')
  parser.add_argument('-b', '--base64', dest='b64encode', action='store_true',
            default = False, help='Base64 encode output')
  parser.add_argument('-c', '--csv', dest='csv', action='store_true',
            default = False, help='Assemble into CSV file')
  parser.add_argument('-g', '--group', dest='groups', action='store',
            type=int, default=1, help='How many groups? (Default 1)' )
  args = parser.parse_args()

  if isdir(args.config):
    specs = [(fn, buildFromConfig(join(args.config, fn)))
      for fn in os.listdir(args.config) if isfile(join(args.config, fn))]
    print(f'Read {len(specs)} inputs')
    if args.csv:
      groupsize = math.floor(len(specs) / args.groups)
      assert groupsize * args.groups == len(specs)
      if groupsize < len(specs):
        print(f' - Generating {args.groups} file(s) with {groupsize} records each')
        for i in range(0, args.groups):
          outsrc = args.outfile.split('.')
          outfile = '.'.join(['.'.join(outsrc[:-1]) + f'-{i}'] + outsrc[-1:])
          with open(outfile, 'w') as f:
            f.write('CONFIG\n')
            for fn, spec in specs[i * groupsize: (i + 1) * groupsize]:
              specSerialized = json.dumps(spec)
              encoded = b64encode(specSerialized.encode('utf-8')).decode('utf-8')
              f.write(f'{encoded}\n')
      else:
        with open(args.outfile, 'w') as f:
          f.write('CONFIG\n')
          for fn, spec in specs:
            specSerialized = json.dumps(spec)
            encoded = b64encode(specSerialized.encode('utf-8')).decode('utf-8')
            f.write(f'{encoded}\n')
    else:
      # Not csv out? Let's create things in place
      if not isdir(args.outfile):
        raise Error('Output must be directory unless csv specified')
      for fn, spec in specs:
        specSerialized = json.dumps(spec)
        with open(join(args.outfile, '.'.join(fn.split('.')[:-1]) + '.json'), 'w') as f:
          if args.b64encode:
            encoded = b64encode(specSerialized.encode('utf-8')).decode('utf-8')
            f.write(encoded)
          else:
            f.write(specSerialized)
  elif isfile(args.config):
    spec = buildFromConfig(args.config)
    specSerialized = json.dumps(spec)
    if args.b64encode:
      specSerialized = b64encode(specSerialized.encode('utf-8')).decode('utf-8')
    if args.outfile is None:
      print(spec)
    else:
      with open(args.outfile, 'w') as f:
        if args.csv:
          f.write('CONFIG\n')
        f.write(specSerialized)
