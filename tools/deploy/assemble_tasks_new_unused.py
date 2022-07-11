import os
from os.path import join, dirname, abspath
import tools.mailtools
from tools import mailtools, MDConfig, MDSection
import datetime

from constants import MAILDIR

"""
Load a mailbox and generate the new task definitions
"""
def load_mail(user):
  # Sanity check that the directories exist
  inboxdir = os.path.join(MAILDIR, user, 'inbox')
  if not os.path.isdir(inboxdir):
    raise Exception(f'Cannot find directory {inboxdir}!')
  emails = []
  for mail in os.listdir(inboxdir):
    mailfile = os.path.join(inboxdir, mail)
    if not os.path.isfile(mailfile):
      continue
    id = '/'.join([user, 'inbox', mail])
    message = None
    with open(mailfile, 'r') as f:
      try:
        message = mailtools.load_email(id, f)
      except Exception as e:
        print(f'[Err] Read {id} failed with: {e}')
        continue
    emails.append(message)
  return emails

def find_canonical_week(y, m, d):
  """
  Find the "canonical ISO week" notation
  """
  dt = datetime.date(y, m, d)
  y, w, d = dt.isocalendar()
  return (y, w, d)

def week_to_day(y, w, d):
  if hasattr(datetime.date, 'fromisocalendar'):
    return datetime.date.fromisocalendar(y, w, d)
  else:
    return datetime.datetime.strptime(f'{y} {w} {d}', '%G %V %u').date()

def bin_emails_by_week(mails):
  bins = {}
  for message in mails:
    yc, mc, dc = message.getDate()[:3]
    y, w, d = find_canonical_week(yc, mc, dc)
    weekbin = (y, w)#f'{y}-W{w:02}'
    if not weekbin in bins:
      bins[weekbin] = []
    bins[weekbin].append(message)

  # Fill in any missing week-bins
  last_bin = None
  for b in sorted(bins.keys(), reverse = True):
    if last_bin is None:
      last_bin = b
      continue
    else:
      yl, wl = last_bin
      y, w = b
      if y != yl:
        last_bin = b
        continue
      else:
        for i in range(w + 1, wl):
          if not (y, i) in bins:
            bins[(y, i)] = []
      last_bin = b
  return bins

def regroup_bins(bins, groupsize = 2, threshold = 35, omit = 0):
  sorted_weeks = sorted(binned.keys(), reverse=True)
  new_bins, new_bin_indexes = {}, {}
  for i in range(int((len(sorted_weeks) - omit) / groupsize)):
    chunk = sorted_weeks[(omit + i * groupsize):(omit + (i + 1) * groupsize)]
    name = chunk[-1]
    contents = [m for w in chunk for m in bins[w]]
    new_bins[name] = contents
    new_bin_indexes[name] = chunk

  # Filter the new bins
  new_sorted_indexs = sorted(new_bins.keys(), reverse = True)
  cur_run, max_run, cur_idx, best_idx = 0, 0, 0, 0
  for i, id in enumerate(new_sorted_indexs):
    if len(new_bins[id]) >= threshold:
      cur_run += 1
      if cur_run > max_run:
        max_run = cur_run
        best_idx = cur_idx
    else:
      cur_run = 0
      cur_idx = i
  filtered_bins, filtered_indexes = {}, {}
  for name in new_sorted_indexs[best_idx:(best_idx + max_run)]:
    filtered_bins[name] = new_bins[name]
    filtered_indexes[name] = new_bin_indexes[name]
  return filtered_bins, filtered_indexes

if __name__ == '__main__':
  import argparse
  from base64 import b64encode
  parser = argparse.ArgumentParser(description='Build a mailbox descriptor file.')
  parser.add_argument('user', action='store',
            help='User to extract mailbox')
  parser.add_argument('-o', '--out', dest='outfile', action='store',
            default = None, help='Output file. Defaults to STDOUT')
  parser.add_argument('-n', '--name', dest='name', action='store',
            default = 'an employee', help='Specify the name of the user' )
  args = parser.parse_args()

  # Read the mails
  mails = load_mail(args.user)
  binned = bin_emails_by_week(mails)
  regrouped_bins, regrouped_indexes = regroup_bins(binned)

  document = MDConfig()
  document.addSection(MDSection('tut-0', 'tutorial').set('for', 'commitment'))
  for i, name in enumerate(sorted(regrouped_bins.keys(), reverse=True)[:8][::-1]):
    bin = regrouped_bins[name]
    chunks = regrouped_indexes[name]
    first_day = week_to_day(chunks[-1][0], chunks[-1][1], 1)
    last_day = week_to_day(chunks[0][0], chunks[0][1], 7)

    if i > 0:
      midinter = MDSection(f'inter-{i}', 'interstitial')
      midinter.set('title', 'New Tasks Available')
      midinter.addChunk([
        f'Two weeks have passed since the last task and it is now {last_day}. During this time, new messages have arrived in the inbox.',
        'Use the email management tool to tag any new emails that are event commitments.'
      ])
      document.addSection(midinter)
    else:
      firstinter = MDSection(f'inter-{i}', 'interstitial')
      firstinter.set('title', 'Task Sessions')
      firstinter.addChunk([
        'Great job! You\'ve completed the tutorial and are now ready for the task sessions.',
        f'For this set of tasks you will be using an email management tool to assist {args.name} in managing their inbox. Your task will be to identify and tag event commitments in the inbox.',
        'An email is considered an event commitment if it contains a time and involves an event where there is an active choice to attend.',
        '- The time of the event may be specific (2/15 10:00am) or vague (this weekend). \\n - A passive situation (e.g. "power outage 5-6pm") or a deadline (e.g. "submit form by Wed.") alone is not considered an event.\\n - The same event may involve multiple emails. If this is the case, you should tag all of them, even if some are superseded (e.g. change of time).',
        'The email management tool has an AI feature that can detect some of the commitments and suggest that they should be tagged. The AI feature may be imperfect, though, so you should still pay attention and make the final judgment of whether an email is an event commitment or not.'
      ])
      document.addSection(firstinter)

    task = MDSection(f'task-{i}', 'task')
    task.set('task', 'commitment')
    task.set('usePerf', 'false')
    task.set('systemName', 'Event Detector')
    task.set('actions', ['tag-event', 'delete'])
    task.addChunk([
      f'Tag emails concerning event commitments between the dates {first_day} and {last_day}.'
    ])
    task.set('messages', [
      'raw-list: ' + ','.join([msg.getId() for msg in bin])
    ])
    document.addSection(task)

  print(document)
  #document.addSection(MDSection(f'inter-{i}'))
  #print(document)
  #for week in sorted(regrouped_bins.keys(), reverse=True):
  #    print(f'{week}: {len(regrouped_bins[week])}')
