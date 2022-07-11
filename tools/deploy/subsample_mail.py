"""
Usage: Subsamples emails from the Enron Dataset


"""

import os
import sys
from os.path import join, dirname, abspath

from constants import MAILDIR
from tools import mailtools

def find_maiboxes(targetDir = MAILDIR, inboxSize = 350):
  """find_maiboxes
  Finds all mail relative to the path

  @param targetDir - target directory to scan
  @param inboxMinCutoff - minimum inbox size reqired to include a user
  """
  # Sanity check that the directories exist
  if not os.path.isdir(targetDir):
    raise Exception(f'Cannot find directory {targetDir}!')

  people = {}
  for dirname in os.listdir(targetDir):
    userdir = os.path.join(targetDir, dirname)
    if not os.path.isdir(userdir):
      continue
    inboxdir = os.path.join(userdir, 'inbox')
    if not os.path.isdir(inboxdir):
      continue
    emails = []
    for mail in os.listdir(inboxdir):
      mailfile = os.path.join(inboxdir, mail)
      if not os.path.isfile(mailfile):
        continue
      emails.append({
        'id': '/'.join([dirname, 'inbox', mail]),
        'path': mailfile
      })
    if len(emails) >= inboxSize:
      people[dirname] = emails

  return people

def filter_mails(mails):
  bins = {}
  for mail in mails:
    with open(mail['path'], 'r') as f:
      try:
        message = mailtools.load_email(mail['id'], f)
      except Exception as e:
        print(f'Failed[{mail["id"]}] - {e}', file=sys.stderr)
        continue
      date = message.getDate()
      if date is not None:
        bin = f'{date[0]}-{date[1]:02}'
        if not bin in bins:
          bins[bin] = []
        bins[bin].append(message)
  return bins

if __name__ == '__main__':

  limit = None
  if len(sys.argv) > 1 and not sys.argv[1] == '?':
    limit = [x.strip() for x in sys.argv[1].split(',')]
  mode = sys.argv[2] if len(sys.argv) > 2 else 'summary'

  people = find_maiboxes()
  for person in people:
    if limit is None or person in limit:
      if mode == 'summary':
        print(f'{person} = {len(people[person])}')
      elif mode == 'monthly':
        binned = filter_mails(people[person])
        cur_mc, max_mc = 0, 0
        for bin in sorted(binned.keys(), reverse=True):
          num_mails = len(binned[bin])
          if num_mails >= 100:
            cur_mc += 1
            if cur_mc > max_mc:
              max_mc = cur_mc
          else:
            if cur_mc > max_mc:
              max_mc = cur_mc
            cur_mc = 0
        # Do some threshing
        if max_mc < 5:
          continue

        # Do output
        print(f'{person}:')
        for bin in sorted(binned.keys(), reverse=True):
          num_mails = len(binned[bin])
          print(f'  {bin} = {num_mails}')
        print(f'Usable months: {max_mc}')
        print('')
      elif mode == 'sample-monthly':
        binned = filter_mails(people[person])
        current_pool, current_months, task_id = [], [], 0
        for bin in sorted(binned.keys()):
          current_pool.extend(binned[bin])
          current_months.append(bin)
          if len(current_pool) > 40:
            if task_id > 0:
              print(f'# inter-{",".join(current_months)}')
              print('title: New Tasks Available\n')
              if len(current_months) > 1:
                elapsed = f'{len(current_months)} months have passed'
              else:
                elapsed = 'One month has passed'

              print(f'> {elapsed} since the last task and it is now the month of {current_months[-1]}. Use the email management tool to tag new emails that are event commitments.')
            else:
              print(f'# inter-{",".join(current_months)}')
              print('title: Task Sessions')
              print('> Great job! You\'ve completed the tutorial and are now ready for the task sessions.')
              print('> For this set of tasks you will be using an email management tool to assist {NAME} in managing their inbox. Your task will be to identify and tag event commitments in the inbox.')
              print('> An email is considered an event commitment if it contains a time and involves an event where there is an active choice to attend.')
              print('> 	- The time of the event may be specific (2/15 10:00am) or vague (this weekend). \\n - A passive situation (e.g. "power outage 5-6pm") or a deadline (e.g. "submit form by Wed.") alone is not considered an event.\\n - The same event may involve multiple emails. If this is the case, you should tag all of them, even if some are superseded (e.g. change of time).')
              print('> The email management tool has an AI feature that can detect some of the commitments and suggest that they should be tagged. The AI feature may be imperfect, though, so you should still pay attention and make the final judgment of whether an email is an event commitment or not.')

            print('')
            print(f'## task-{task_id}')
            print('task: commitment\n')
            print('group: yellow\n')
            print('usePerf: false\n')
            print('actions:')
            print('- tag-event')
            print('- delete\n')
            print(f'> Tag emails concerning event commitments in the months {", ".join(current_months)}\n')
            print('systemName: Event Detector\n')
            print('messages:')
            print('- raw-list:' + ','.join([msg.id for msg in current_pool]))
            print('')

            current_pool = []
            current_months = []
            task_id += 1
          else:
            continue
        print('')
