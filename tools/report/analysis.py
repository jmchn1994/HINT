import csv, sys, base64, json

# Initialize environment for CSV reading
maxInt = sys.maxsize
while True:
  try:
    csv.field_size_limit(maxInt)
    break
  except OverflowError:
    maxInt = int(maxInt/10)
# -*- GLOBAL VARIABLES -*-
EXPERIMENTS = ['calibration-0',
  'calibration-1',
  'experiment-0',
  'experiment-1',
  'experiment-2',
  'experiment-3']

def readMturkCsv(filename):
  with open(filename, 'r') as f:
    reader = csv.reader(f)
    head = None
    for row in reader:
      if head is None:
        head = row
      else:
        if len(row) == 0:
          continue
        r = {}
        for i, field in enumerate(head):
          r[field] = row[i] if i < len(row) else None
        yield r

def lookup(messages, id):
  for i, m in enumerate(messages):
    if m['id'] == id:
      return i
  return None

def match(ref, cmp):
  prec = sum(1 if v in ref else 0 for v in cmp) / len(cmp)
  rec = sum(1 if v in cmp else 0 for v in ref) / len(ref)
  return prec, rec

def mismatched(ref, cmp):
  excl_cmp = sum(1 if not v in ref else 0 for v in cmp)
  excl_ref = sum(1 if not v in cmp else 0 for v in ref)
  return excl_cmp + excl_ref

def f1(summary):
  p, r = summary['precision'], summary['recall']
  return (2 * p * r / (p + r)) if p > 0 and r > 0 else 0

def buildActionLog(actionStream):
  experimentsLog = {}
  for item in actionStream:
    experimentId = item['ns']
    if not experimentId in experimentsLog:
      experimentsLog[experimentId] = {}
    summary = experimentsLog[experimentId]
    if item['event'] == 'end':
      summary['taskTime'] = item['t'] / 1000
    elif item['event'] == 'flag':
      summary['flag'] = 1 if not 'flag' in summary else summary['flag'] + 1
    elif item['event'] == 'tag-event':
      summary['tag'] = 1 if not 'tag' in summary else summary['tag'] + 1
    elif item['event'] == 'view-message':
      summary['view'] = 1 if not 'view' in summary else summary['view'] + 1
  return experimentsLog

def analyzeActionLog(actionStream, type = 'commitment'):
  if type == 'commitment':
    logs = {}
    tagged = set()
    for item in actionStream:
      expt = item['ns']
      if not expt in logs:
        logs[expt] = {
          'total': 0,
          'reverted': 0
        }
      if item['event'] == 'tag-event':
        logs[expt]['total'] += 1
        source = item['data']['source']
        if source == 'total' or source == 'reverted':
          raise Exception('Illegal source name!')
        if not source in logs[expt]:
          logs[expt][source] = 0
        logs[expt][source] += 1
      if item['event'] == 'tag-status-change':
        message = item['data']['message']
        if message in tagged:
          logs[expt]['reverted'] += 1
        else:
          tagged.add(message)
    return logs
  else:
    logs = {}
    lastItem = {}
    lastQueries = {}
    tagged = set()
    for item in actionStream:
      expt = item['ns']
      if not expt in logs:
        logs[expt] = {
          'queries': set(),
          'sessions': 0,
          'reverted': 0,
          'views': []
        }
      if item['event'] == 'search-init':
        query = item['data']['query']

        # Remove any 1-off substring queries
        if query[:-1] in logs[expt]['queries']:
          logs[expt]['queries'].remove(query[:-1])
        logs[expt]['queries'].add(query)

        if expt in lastItem:
          if lastItem[expt]['event'] == 'search-init' or lastItem[expt]['event'] == 'search-resp':
            lastQuery = lastItem[expt]['data']['query']
            if lastQuery == query[:-1]:
              logs[expt]['sessions'] += 0 # Part of same session
            else:
              logs[expt]['sessions'] += 1
              lastQueries[expt] = query
          else:
            # Something else
            logs[expt]['sessions'] += 1
            lastQueries[expt] = query
        else:
          # This is the first thing
          raise Exception('there should be events before search-init!')

      if item['event'] == 'view-message':
        message = item['data']['message']
        query = lastQueries[expt] if expt in lastQueries else ''
        logs[expt]['views'].append((query, message))

      if item['event'] == 'action-status-change':
        message = item['data']['message']
        if message in tagged:
          logs[expt]['reverted'] += 1
        else:
          tagged.add(message)

      lastItem[expt] = item
    return logs

def extractGold(config, type = 'commitment'):
  if type == 'commitment':
    gold = sorted([lookup(config['messages'], c)
      for c in config['commitments']])
  else:
    gold = sorted([lookup(config['messages'], c)
      for c in config['promoted']])
  return gold

def extractSummary (sessionsResp, expts, sessionsConfig, type = 'commitment'):
  taskConfig = {}
  for task in sessionsConfig:
    if task['type'] != 'task':
      continue
    taskConfig[task['name']] = task
  summary = {}

  # Build Action log
  actLog = buildActionLog(sessionsResp['action-log']['stream'])
  actAnalysis = analyzeActionLog(sessionsResp['action-log']['stream'], type)

  for exp in expts:
    db = sessionsResp['task-state-' + exp]['map']
    conf = sessionsResp['config-' + exp]['map']
    task = taskConfig[exp]
    if type == 'commitment':
      tagged = sorted([i
        for i, t in enumerate(db['tagStatus']) if t['event']])
    else:
      tagged = sorted([i
        for i, t in enumerate(db['actionStatus']) if t['flagged']])
    gold = extractGold(task, type)
    prec, rec = match(gold, tagged)
    read = sum(1 if r else 0 for r in db['readStatus'])
    summary[exp] = {
      'marked': tagged,
      'perf': conf['performance'],
      'read': read,
      'total': len(db['readStatus']),
      'precision': prec,
      'recall': rec,
      'error': mismatched(gold, tagged),
      'log': actLog[exp],
      'details': actAnalysis[exp]
    }
    if type == 'commitment':
      summary[exp]['uptake'] = (actAnalysis[exp]['ai'] if 'ai' in actAnalysis[exp] else 0) / actAnalysis[exp]['total']
      summary[exp]['corrections'] = actAnalysis[exp]['reverted']
    elif type == 'search':
      summary[exp]['uptake'] = (1 / actAnalysis[exp]['sessions']) if actAnalysis[exp]['sessions'] > 0 else 0
      summary[exp]['corrections'] = actAnalysis[exp]['reverted']
  summary[''] = {
    'perf-pattern': ','.join([str(summary[exp]['perf']) for exp in expts][2:])
  }
  return summary

def extractSurvey (sessionsResp):
  surveyLog = sessionsResp['surveys']['stream']
  surveyResponses = {}
  for item in surveyLog:
    expt = item['surveyId']
    surveyResponses[expt] = item['answers']
  return surveyResponses

def readWorkers(filename, type = 'commitment'):
  for worker in readMturkCsv(filename):
    sessionConfig = json.loads(base64.b64decode(worker["Input.CONFIG"]))
    id = worker['WorkerId']
    sessionResp = json.loads(worker["Answer.data"])
    finalQuestions = {
      'feedback': worker["Answer.q-feedback"],
      'explanation': worker["Answer.q-explanation"],
      'preference': worker["Answer.q-preference"],
      'understand': worker["Answer.q-understand"]
    }
    summary = extractSummary(sessionResp, EXPERIMENTS, sessionConfig, type)
    survey = extractSurvey(sessionResp)
    yield (id, sessionConfig, sessionResp, finalQuestions, summary, survey)

def filter(workers, task = 'commitment'):
  out = []
  for id, sc, sr, fq, s, sur in workers:
    if task == 'search':
      failed = 0
      for exp in EXPERIMENTS:
        p = s[exp]['precision']
        r = s[exp]['recall']
        if p < 1 or r < 1:
          failed += 1

      if failed == 6:
        continue
      else:
        out.append((id, sc, sr, fq, s, sur))
    elif task == 'commitment':
      failed = 0
      for exp in EXPERIMENTS:
        tagcount = len(s[exp]['marked'])
        if s[exp]['read'] < 5 or tagcount < 5 or tagcount > 15:
          failed +=1
      if failed == 6:
        continue
      else:
        out.append((id, sc, sr, fq, s, sur))

  return out

if __name__ == '__main__':

  def printPercentage(a):
    return round(a * 10000) / 100

  if len(sys.argv) < 2:
    print(f'Usage: {sys.argv[0]} [csvfile] [type=commitment]\n')
    print('   Loads Mturk csv and extracts json')
    print('   type - commitment or search')
    exit(1)

  taskType = sys.argv[2] if len(sys.argv) > 2 else 'commitment'
  if not taskType in ['commitment', 'search']:
    raise Exception(f'Unknown task type {taskType}')

  ids, summaries = [], []
  for workerRecord in readWorkers(sys.argv[1], taskType):
    (id, sessionConfig, sessionResp, finalQuestions, summary, survey) = workerRecord
    ids.append(id)
    summaries.append(summary)

  for exp in EXPERIMENTS:
    print(f'{exp}:')
    for wid, w in zip(ids, summaries):
      readRatio = w[exp]["read"] / w[exp]["total"]
      print(f' - Read: {printPercentage(readRatio)}%')
      print(f'  P: {printPercentage(w[exp]["precision"])}% |' +
        f' R: {printPercentage(w[exp]["recall"])}%')
