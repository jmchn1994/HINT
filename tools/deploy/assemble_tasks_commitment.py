import re
import os
import random
import json
import itertools
import math

from os.path import join, dirname, abspath, isdir, isfile

from constants import MAILDIR

PATTERNS = {
  'fixedacc': ((True, True, True, True), (False, False, False, False)),
  'between': ((True, True, False, False), (False, False, True, True))
}
PREAMBLE = """#? training
for: commitment
"""

SECTION_A = """
# {group_name}-inst

title: Traditional Tool

group: {group_name}

> In this group of tasks, you will be using a traditional email management tool.
> In each task session, you will be presented with a fictitious email inbox. Your task will be to identify (and tag) event commitments of the inbox owner.
> - An email is considered an event if contains a time and involves an active choice to attend. The time may be specific (2/15 10:00am) or vague (this weekend). \\n- Passive situations ("power outage 5-6pm") or deadlines alone are not considered events. \\n- If the same event involves multiple emails, you should tag all of them.
> There will be 5-15 event commitment emails to identify in each task.
> This section contains a total of {num_tasks} tasks.
"""

SECTION_B = """
# {group_name}-inst

title: AI-assisted Tool

group: {group_name}

> In this section, you will see the same interface again, but in addition there is also an AI feature that can detect some of the commitments. The AI feature may be imperfect, so you should still pay attention and correct errors when needed.
> As before, your task will be to find and tag all the event commitment in the inbox.
> This section contains a total of {num_tasks} tasks.
"""

INBOX_TEMPLATE = """
## {condition}-{id}
task: commitment

group: {group}

usePerf: {performance}

actions:
- tag-event

systemName: Event Detector

> {instructions}

messages:
- raw-list: {messages}

isBaseline: {baseline}

commitments:
- {gold}
"""

def generate_inbox(messages, metadata, group, condition, perf, id):
  gold = [f'{m} | pending | | ' for m in messages['gold']]
  return INBOX_TEMPLATE.format(
    group = group,
    condition = condition,
    id = id,
    performance = 'true' if perf else 'false',
    messages = ','.join(messages['distractors'] + messages['gold']),
    gold = '\n- '.join(gold),
    baseline = 'true' if condition == 'calibration' else 'false',
    instructions = '\n> '.join(metadata['inst']))

def create_output(inboxes, metadata, order, pattern, outfile):
  assert len(pattern) == len(order) - 2
  # Roll the group name order
  groups = ('yellow', 'blue') #if random.random() >= 0.5 else ('blue', 'yellow')
  with open(outfile, 'w') as f:
    f.write(PREAMBLE)
    f.write(SECTION_A.format(num_tasks = 2, group_name = groups[0]))
    for i, inbox in enumerate(order[:2]):
      f.write(generate_inbox(inboxes[inbox],
        metadata[inbox], groups[0], 'calibration', False, i))
    f.write(SECTION_B.format(num_tasks = len(order) -2, group_name = groups[1]))
    for i, inbox in enumerate(order[2:]):
      f.write(generate_inbox(inboxes[inbox],
        metadata[inbox], groups[1], 'experiment', pattern[i], i))

if __name__ == '__main__':
  import argparse
  parser = argparse.ArgumentParser(
    description='Build a bunch of descriptor md files.')
  parser.add_argument('configdir', action='store',
            help='Directory with inbox configurations')
  parser.add_argument('-s', '--seed', dest='seed', action='store',
            default=None, help = 'Seed for shuffle randomness')
  parser.add_argument('-n', dest='n', action='store',
            default=None, help = 'Number of permutations to keep (default all)')
  parser.add_argument('-p', dest='p', action='store',
            default=None, help = 'Length of permutations (default as many as inboxes)')
  parser.add_argument('-o', '--out', dest='outdir', action='store',
            help='Output directory.')
  parser.add_argument('-c', '--conditions', dest='conditions', action='store',
            choices = ('fixedacc', 'between'),
            default='fixedacc', help='Conditions (default fixedacc). ')
  args = parser.parse_args()

  random.seed(None if args.seed is None else int(args.seed))

  # Scan the input directory
  if not isdir(args.configdir):
    raise Error(f'{args.configdir}: not a directory');

  # Read the metadata
  print('Reading manifest')
  with open(join(args.configdir, 'manifest.json'), 'r') as f:
    metadata = json.load(f)

  inboxes = {}
  print('Reading inboxes')
  for item in os.listdir(args.configdir):
    path = join(args.configdir, item)
    if not isfile(path) or (not item.endswith('.txt')):
      print(f' - Skipping non-inbox: {item}')
      continue
    gold, distractor = [], []
    with open(path, 'r') as f:
      for line in f:
        line = line.strip()
        label, id = line.split(' ', 1)
        if label == 'gold':
          gold.append(id.strip())
        else:
          distractor.append(id.strip())
    inboxes[item] = {
      'gold': gold,
      'distractors': distractor
    }
    print(f' - Read inbox {item}: {len(distractor)}d + {len(gold)}g')
  print(f'Read: {len(inboxes)} inboxes')

  inbox_names = sorted(inboxes.keys())
  # Check that the inboxes are all in the manifest
  for inbox_name in inbox_names:
    if not inbox_name in metadata:
      raise Error(f'Inbox {inbox_name} not found in manifest!')

  res = None if args.n is None else int(args.n)
  # resoir sample the permutations
  configs, seen = [], 0
  for pm in itertools.permutations(inbox_names, None if args.p is None else int(args.p)):
    seen += 1
    if res is None or res < 1 or len(configs) < res:
      configs.append(pm)
    else:
      index = math.floor(random.random() * seen)
      if index < len(configs):
        configs[index] = pm
  # Generate the configs
  for i, config in enumerate(configs):
    filename = f'config-commitment-{i}.md'
    print(f'Writing file {filename}')
    pattern = PATTERNS[args.conditions][i % 2]
    create_output(inboxes, metadata, config, pattern,
      join(args.outdir, filename))


  # Print configs into metadata file
  for i, config in enumerate(configs):
    print(f'{i}\t{config}')
