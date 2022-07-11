import analysis
import json
import pandas as pd
import scipy.stats as ss
import numpy as np

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def pivotAndAggregate(df, values, index):
  renameMap = {}
  if isinstance(values, list):
    for name in values:
      renameMap[name] = name + '_err'
  else:
    renameMap[values] = values + '_err'
  df_p = df.pivot_table(values=values, aggfunc='mean', index=index)
  df_pe = df.pivot_table(values=values,
    aggfunc=ss.sem, index=index).rename(columns=renameMap)
  return df_p.join(df_pe).reset_index()

def extract_overview(workers):
  PREFERENCES = [
    ('Strongly prefer No-AI', 'rgb(128,24,43)', 1),
    ('Prefer No-AI', 'rgb(214,96,77)', 2),
    ('Somewhat prefer No-AI', 'rgb(244,165,130)', 3),
    ('Indifferent', 'rgb(247,247,247)', 4),
    ('Somewhat prefer With-AI', 'rgb(146,197,222)', 5),
    ('Prefer With-AI', 'rgb(67,147,195)', 6),
    ('Strongly prefer With-AI', 'rgb(33,102,172)', 7)
  ]
  overview = [
    (id, e, analysis.f1(s[e]), s[e]['read'] / s[e]['total'])
    for e in analysis.EXPERIMENTS for id, cfg, rsp, q, s, sr in workers
  ]
  df_ov = pd.DataFrame(overview, columns=('id', 'exp', 'f1', 'read'))
  df_ov_agg = pivotAndAggregate(df_ov,
    values=['f1', 'read'], index=['exp'])
  offline_f1 = {
    'x': [2,3,4,5],
    'y': [0, 0, 1, 1],
    'type': 'markers-only',
    'marker': 'x',
    'name': 'Offline'
  }

  with_ai_f1 = {
    'x': [],
    'y': [],
    'error_y': [],
    'name': 'With-AI'
  }
  no_ai_f1 = {
    'x': [],
    'y': [],
    'error_y': [],
    'name': 'No-AI'
  }
  with_ai_effort = {
    'x': [],
    'y': [],
    'error_y': [],
    'name': 'With-AI'
  }
  no_ai_effort = {
    'x': [],
    'y': [],
    'error_y': [],
    'name': 'No-AI'
  }
  for index, row in df_ov_agg.iterrows():
    exp_index = analysis.EXPERIMENTS.index(row['exp'])
    if exp_index < 2:
      no_ai_f1['x'].append(exp_index)
      no_ai_f1['y'].append(row['f1'])
      no_ai_f1['error_y'].append(row['f1_err'])
      no_ai_effort['x'].append(exp_index)
      no_ai_effort['y'].append(row['read'])
      no_ai_effort['error_y'].append(row['read_err'])
    else:
      with_ai_f1['x'].append(exp_index)
      with_ai_f1['y'].append(row['f1'])
      with_ai_f1['error_y'].append(row['f1_err'])
      with_ai_effort['x'].append(exp_index)
      with_ai_effort['y'].append(row['read'])
      with_ai_effort['error_y'].append(row['read_err'])

  ratios, prefs = {}, []
  for id, cfg, rsp, fq, s, sr in workers:
    pref = int(fq['preference'])
    prefs.append(pref)
    if not pref in ratios:
      ratios[pref] = 0
    ratios[pref] += 1

  avg_f1 = {
    'No-AI': sum(no_ai_f1['y']) / 2,
    'With-AI': sum(with_ai_f1['y']) / 4
  }
  avg_effort = {
    'No-AI': sum(no_ai_effort['y']) / 2,
    'With-AI': sum(with_ai_effort['y']) / 4
  }
  delta_f1 = avg_f1['With-AI'] / avg_f1['No-AI'] - 1;
  delta_effort = avg_effort['With-AI'] / avg_effort['No-AI'] - 1;
  avg_pref = sum([v*ratios[v] for v in ratios]) / len(workers)
  med_pref = np.median(np.array(prefs))

  # Do sign test
  neg, pos = sum(1 for p in prefs if p < 4), sum(1 for p in prefs if p > 4)
  p = ss.binom(neg + pos, 0.5)
  cp = 0
  for k in range(0, min(neg, pos) + 1):
    cp += p.pmf(k)
  if cp < 0.05:
    sign_test = 'The preferences are statistically significant ' + \
      f'(sign test, p = {round(cp*100)/100}) towards ' + \
      ('With-AI' if pos > neg else 'No-AI');
  else:
    sign_test = 'The preferences are not statistically significant ' + \
      f'(sign test, p = {round(cp*100)/100}) towards With-AI or No-AI.';

  pref = avg_pref - 4
  pref_text = ('slight' if abs(pref) < 1 else '') + \
    ' preference toward ' + ('No-AI' if pref < 0 else 'With-AI');
  # Find median
  med_text = None
  for t,c,v in PREFERENCES:
    if round(abs(v - med_pref)) < 1:
      med_text = t

  return {
    'f1': {
      'findings': [
        'Observed a ' +
        f'{abs(round(delta_f1*10000)/100)}%' +
        f' {"increase" if delta_f1>0 else "reduction"} ' +
        'in average F-1 score for the With-AI group'
      ],
      'series': [
        with_ai_f1,
        no_ai_f1,
        offline_f1
      ]
    },
    'effort': {
      'findings': [
        'Observed a ' +
        f'{abs(round(delta_effort*10000)/100)}%' +
        f' {"increase" if delta_effort>0 else "reduction"} ' +
        'in average effort (as measured by % emails read) for the With-AI group​'
      ],
      'series': [
        with_ai_effort,
        no_ai_effort
      ]
    },
    'preference': {
      'findings': [
        sign_test,
        f'Average preference Likert score of {round(avg_pref * 100)/100}' +
        ' (on 1-7 scale), ' +
        f'{pref_text}. ' +
        f'Median score {med_pref} (on 1-7 scale), ' +
        f'{med_text}.​'
      ],
      'series': [
        {
          'x': [ratios[val] / len(workers)],
          'y': ['Pref.'],
          'orientation': 'h',
          'name': pref_name,
          'color': color
        }
        for pref_name, color, val in PREFERENCES
      ]
    }
  }

def extract_feedback(workers):
  sorted_workers = sorted([
    (int(fq['preference']), fq['explanation'])
    for _, _, _, fq, _, _ in workers])
  return [
    {'p': pref, 't': text} for pref, text in sorted_workers
  ]

def extract_qual(workers):
  HEADERS = [
    ('confidence', 0),
    ('effort', 0),
    ('mental model', 2),
    ('stickiness', 2),
    ('trust', 2),
    ('utility', 2),
  ]
  GROUPS = [
    ('3 - Somewhat Disagree', 'rgb(244,165,130)', 3),
    ('2 - Disagree', 'rgb(214,96,77)', 2),
    ('1 - Strongly Disagree', 'rgb(128,24,43)', 1),
    ('4 - Neutral', 'rgb(247,247,247)', 4),
    ('5 - Somewhat Agree', 'rgb(146,197,222)', 5),
    ('6 - Agree', 'rgb(67,147,195)', 6),
    ('7 - Strongly Agree', 'rgb(33,102,172)', 7)
  ]
  surveys = [(id, e, q, int(sr[e][q]) if q in sr[e] else None)
               for q in [h.replace(' ', '') for h, _ in HEADERS]
               for e in analysis.EXPERIMENTS
               for id, _, _, _, s, sr in workers]
  df_survey = pd.DataFrame(surveys, columns=('id', 'exp', 'question', 'answer'))
  df_survey_agg = pivotAndAggregate(df_survey, 'answer', ['exp', 'question'])
  line_named = {}
  for header, _ in HEADERS:
    question = header.replace(' ', '')
    with_ai, no_ai = {
      'x': [], 'y': [],'error_y': [], 'name': 'With-AI'}, {
      'x': [], 'y': [],'error_y': [], 'name': 'No-AI'}
    for i, row in df_survey_agg[df_survey_agg['question'] == question].iterrows():
      exp_idx = analysis.EXPERIMENTS.index(row['exp'])
      if exp_idx >= 2:
        with_ai['x'].append(exp_idx)
        with_ai['y'].append(row['answer'])
        with_ai['error_y'].append(row['answer_err'])
      else:
        no_ai['x'].append(exp_idx)
        no_ai['y'].append(row['answer'])
        no_ai['error_y'].append(row['answer_err'])

    raw_with_ai, raw_no_ai = [], []
    for i, row in df_survey[df_survey['question'] == question].iterrows():
      exp_idx = analysis.EXPERIMENTS.index(row['exp'])
      if exp_idx >= 2:
        raw_with_ai.append((exp_idx, row['answer']))
      else:
        raw_no_ai.append((exp_idx, row['answer']))

    with_ai['raw'] = '|'.join([f'{x[0]},{x[1]}' for x in raw_with_ai])
    no_ai['raw'] = '|'.join([f'{x[0]},{x[1]}' for x in raw_no_ai])

    if len(no_ai['x']) == 0:
      line_named[header] = [with_ai]
    else:
      line_named[header] = [with_ai, no_ai]

  bar_named = {}
  for header, r_start in HEADERS:
    question = header.replace(' ', '')
    data = []
    # Aggregate the x, ys
    grouped = {}
    for v in range(1, 8):
      grouped[v] = {}
    for _, exp, q, ans in surveys:
      if question != q:
        continue
      exp_idx = analysis.EXPERIMENTS.index(exp)
      if not ans in grouped:
        grouped[ans] = {}
      if not exp_idx in grouped[ans]:
        grouped[ans][exp_idx] = 0
      grouped[ans][exp_idx] += 1
    for name, color, value in GROUPS:
      x, y = [
          (grouped[value][exp_idx] / len(workers) * (-1 if value < 4 else 1))
          if exp_idx in grouped[value] else 0
          for exp_idx in range(2, 6)
        ], [
          exp_idx for exp_idx in range(2, 6)
        ]
      data.append({
        'x': x,
        'y': y,
        'orientation': 'h',
        'name': name,
        'color': color
      })
    bar_named[header] = data

  return {
    'line': line_named,
    'bar': bar_named
  }

def extract_quant(workers):
  HEADERS = [
    ('work time', 'Task Work Time (s)', 'time'),
    ('opened', 'Items opened (count)', 'view'),
    ('corrections', 'Corrective Label Actions (%)', 'corrections'),
    ('uptake', 'Uptake Metric (1/#queries)', 'uptake')
  ]
  qual = [
    (id, e,
      s[e]['log']['taskTime'], s[e]['log']['view'],
      s[e]['uptake'], s[e]['corrections'])
    for e in analysis.EXPERIMENTS
    for id, cfg, rsp, q, s, sr in workers
  ]
  df_qual = pd.DataFrame(qual,
    columns=('id', 'exp', 'time', 'view', 'uptake', 'corrections'))
  df_qual_agg =pivotAndAggregate(df_qual,
    values=['time', 'view', 'uptake', 'corrections'],
    index=['exp'])
  quant_data = {}
  for name, desc, id in HEADERS:
    with_ai = {'x': [], 'y': [], 'error_y': [], 'name': 'With-AI'}
    no_ai = {'x': [], 'y': [], 'error_y': [], 'name': 'No-AI'}
    for i, row in df_qual_agg.iterrows():
      exp_idx = analysis.EXPERIMENTS.index(row['exp'])
      if exp_idx < 2:
        no_ai['y'].append(row[id])
        no_ai['error_y'].append(row[id + '_err'])
        no_ai['x'].append(exp_idx)
      else:
        with_ai['y'].append(row[id])
        with_ai['error_y'].append(row[id + '_err'])
        with_ai['x'].append(exp_idx)
    raw_with_ai, raw_no_ai = [], []
    for i, row in df_qual.iterrows():
      exp_idx = analysis.EXPERIMENTS.index(row['exp'])
      if exp_idx < 2:
        raw_no_ai.append((exp_idx, row[id]))
      else:
        raw_with_ai.append((exp_idx, row[id]))
    with_ai['raw'] = '|'.join([f'{x[0]},{x[1]}' for x in raw_with_ai])
    no_ai['raw'] = '|'.join([f'{x[0]},{x[1]}' for x in raw_no_ai])
    quant_data[name] = {
      'name': desc,
      'series': [
        with_ai,
        no_ai
      ]
    }
  return quant_data

if __name__ == '__main__':
  import sys, os
  if len(sys.argv) < 3:
    eprint(f'Usage: {sys.argv[0]} - [mturkdir] [task] [pattern]')
    eprint('    [mturkdir] directory containing mturk responses')
    eprint('    [task] Task group')
    eprint('    [pattern] Condition')
    exit(1)

  sourcedir = sys.argv[1].strip()
  task = sys.argv[2].strip()
  pattern = sys.argv[3].strip()

  if not os.path.isdir(sourcedir):
    raise Error(f'Path {sourcedir} is not a directory!')

  if not task in ['commitment', 'search']:
    raise Error(f'Task type {task} not supported!')

  raw_workers = []
  for csvfile in os.listdir(sourcedir):
    if not csvfile.lower().endswith('.csv'):
      continue
    eprint(f'Loading file {csvfile}')
    for w in analysis.readWorkers(os.path.join(sourcedir, csvfile), task):
      raw_workers.append(w)

  workers = analysis.filter(raw_workers, task)
  workers = [(id, sConfig, sResp, fq, summary, survey)
    for id, sConfig, sResp, fq, summary, survey in workers
    if summary['']['perf-pattern'] == pattern]
  eprint(f'Total of {len(workers)} workers loaded!')

  # Generate overview
  overview = extract_overview(workers)
  # Generate feedback
  user_feedback = extract_feedback(workers)
  # Generate qual stuff
  qual = extract_qual(workers)
  # Generate quant stuff
  quant = extract_quant(workers)

  print(json.dumps({
    'overview': overview,
    'feedback': user_feedback,
    'qual': qual,
    'quant': quant
  }, indent=2))
