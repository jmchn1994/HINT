#? training
for: commitment

# calibration
title: Traditional Tool

group: blue

> In this group of tasks, you will be using a traditional email management tool.

> In each task session, you will be presented with a fictitious email inbox. Your task will be to identify (and tag) event commitments of the inbox owner.

> - An email is considered an event if contains a time and involves an active choice to attend. The time may be specific (2/15 10:00am) or vague (this weekend). \n- Passive situations ("power outage 5-6pm") or deadlines alone are not considered events. \n- If the same event involves multiple emails, you should tag all of them.

> There will be 5-15 event commitment emails to identify in each task.

> This section contains a total of 1 task.

## calibration-0
task: commitment

group: blue

actions:
- tag-event

systemName: Event Detector

> This inbox's owner is John Arnold.

> Your task is to find all event related emails John has received and tag them through the interface.

> If two emails refer to the same event, tag them both.


messages:
- arnold-j/inbox @ 0~100 : all-unread;
- _injected/inbox @ 0~5 : all-unread;

usePerf: true

isBaseline: true

commitments:
- arnold-j/inbox/94_ | pending | Hollywood video |
- arnold-j/inbox/47_ | accepted | Reminder:Interivews Thursday Trading Track | 1 Nov 2001 14:00:00 -0800 PST
- arnold-j/inbox/45_ | accepted | Mtg. regarding Index Postings | Tue, 30 Oct 2001 15:30:00 -0600 CST
- arnold-j/inbox/59_ | pending |  Presentation Announcement |
- arnold-j/inbox/40_ | pending |  Enron Management Conference |
- arnold-j/inbox/36_ | pending |  hi |
- arnold-j/inbox/19_ | pending |  RIBFEST -5- (Nov. 3rd) |
- arnold-j/inbox/4_ | pending |  LNG Update |
- _injected/inbox/1_ | accepted | Board retreat | 7 Jan 2002 18:30:00 -0800 PST
- _injected/inbox/2_ | accepted | Board Meeting | 2 Nov 2001 12:00:00 -0800 PST
- _injected/inbox/3_ | accepted | Movie Club | 13 Dec 2002 18:00:00 -0800 PST

# experiment
title: AI-assisted Tool

group: yellow

> In this section, you will see the same interface again, but in addition there is also an AI feature that can detect some of the commitments. The AI feature may be imperfect, so you should still pay attention and correct errors when needed.

> As before, your task will be to find and tag all the event commitment in the inbox.

> This section contains a total of 3 tasks.

## experiment-0
task: commitment

group: yellow

actions:
- tag-event

systemName: Event Detector

> This inbox's owner is Eric Bass.

> Your task is to find all event related emails Eric has received and tag them through the interface.

> If two emails refer to the same event, tag them both.

messages:
- bass-e/inbox @ 0~100 : all-unread;

commitments:
- bass-e/inbox/4_ | pending | Trader Presentations | 7 Feb 2002 14:30:00 -0800 PST
- bass-e/inbox/8_ | accepted | REMINDER: UBSW Orientation | 7 Feb 2002 10:00:00 -0800 PST
- bass-e/inbox/22_ | conflict | Online Trading Simulation | 7 Feb 2002 09:00:00 -0800 PST
- bass-e/inbox/25_ | accepted | RE: BBALL | 5 Feb 2002 18:00:00 -0800 PST
- bass-e/inbox/26_ | accepted | RE: BBALL | 5 Feb 2002 18:00:00 -0800 PST
- bass-e/inbox/30_ | conflict | Online Trading Simulation | 7 Feb 2002 09:00:00 -0800 PST
- bass-e/inbox/36_ | accepted | Updated: Gas Curves Validation | 4 Feb 2002 14:00:00 -0800 PST
- bass-e/inbox/40_ | rejected | Gas Curves Validation | 4 Feb 2002 10:00:00 -0800 PST
- bass-e/inbox/42_ | rejected | Gas Curves Validation | 4 Feb 2002 10:00:00 -0800 PST
- bass-e/inbox/45_ | accepted | RE: Super Bowl | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/47_ | accepted | RE: Super Bowl | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/50_ | accepted | Enron Conference Call - Rescheduled | 30 Jan 2002 17:00:00 -0600 CST
- bass-e/inbox/55_ | accepted | RE: Super Bowl | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/56_ | rejected | Enron Conference Call | 30 Jan 2002 10:00:00 -0600 CST
- bass-e/inbox/69_ | accepted | RE: Super Bowl Party - 2/3/02 | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/75_ | accepted | RE: Super Bowl Party - 2/3/02 | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/76_ | accpeted | Meeting, Tomorrow | 29 Jan 2002 10:00:00 -0800 PST
- bass-e/inbox/78_ | accepted | RE: Super Bowl Party - 2/3/02 | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/79_ | pending | FW: happy hour this Friday | 1 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/81_ | accepted | RE: Super Bowl Party - 2/3/02 | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/82_ | accepted | RE: Super Bowl Party - 2/3/02 | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/83_ | accepted | RE: Super Bowl Party - 2/3/02 | 3 Feb 2002 17:00:00 -0800 PST
- bass-e/inbox/93_ | accepted | FW: Lunch | 25 Jan 2002 11:45:00 -0800 PST
- bass-e/inbox/94_ | pending | Dinner | 26 Jan 2002 20:00:00 -0800 PST
- bass-e/inbox/98_ | accepted | RE: Lunch | 25 Jan 2002 11:45:00 -0800 PST
- bass-e/inbox/99_ | accepted | RE: Lunch | 25 Jan 2002 11:45:00 -0800 PST
- bass-e/inbox/100_ | accepted | RE: Lunch | 25 Jan 2002 11:45:00 -0800 PST
- bass-e/inbox/101_ | accepted | RE: Lunch | 25 Jan 2002 11:45:00 -0800 PST

usePerf: true

## experiment-1
task: commitment

group: yellow

actions:
- tag-event

systemName: Event Detector

> This inbox's owner is Don Baughman.

> Your task is to find all event related emails Don has received and tag them through the interface.

> If two emails refer to the same event, tag them both.

messages:
- baughman-d/inbox @ 0~100 : all-unread;

commitments:
- baughman-d/inbox/3_ | pending | REMINDER: UBSW Orientation | 7 Feb 2002 10:00:00 -0800 PST
- baughman-d/inbox/20_ | pending | RE: Hello! | 5 Feb 2002 20:00:00 -0800 PST
- baughman-d/inbox/28_ | accepted | Group Meeting | 5 Feb 2002 10:00:00 -0800 PST
- baughman-d/inbox/37_ | accepted | Online Trading Simulation | 7 Feb 2002 09:00:00 -0600 CST
- baughman-d/inbox/39_ | pending | UBSW Orientation | 7 Feb 2002 10:00:00 -0800 PST
- baughman-d/inbox/41_ | pending | Kevin Burns | 13 Feb 2002 12:00:00 -0600 CST
- baughman-d/inbox/44_ | pending | MOVING | 6 Feb 2002 10:00:00 -0800 PST
- baughman-d/inbox/52_ | pending | FW: Parade Details: Galveston | 1 Feb 2002 08:00:00 -0800 PST
- baughman-d/inbox/82_ | pending | New Years | 31 Dec 2001 08:00:00 -0800 PST

usePerf: true

## experiment-2
task: commitment

group: yellow

actions:
- tag-event

systemName: Event Detector

> This inbox's owner is Sally Beck.

> Your task is to find all event related emails Sally has received and tag them through the interface.

> If two emails refer to the same event, tag them both.

messages:
- beck-s/inbox @ 0~100 : all-unread

commitments:
- beck-s/inbox/8_ | accepted | Trip to Houston | 27 Jan 2002 17:35:00 -0800 PST
- beck-s/inbox/7_ | pending | Patroness Mtg. Minutes |
- beck-s/inbox/13_ | pending | FW: Welcome to UBS meeting tommorrow |  23 Jan 2002 08:30:00 -0800 PST
- beck-s/inbox/1_ | pending | Strategy/Infrastructure/People EB 3127B | 20 Jan 2002 10:30:00 -0600 CST
- beck-s/inbox/19_ | pending | Strategy/Infrastructure/People | 20 Jan 2002 10:30:00 -0600 CST
- beck-s/inbox/24_ | accepted | NOTE CHANGE *** 01/22/02 EWS Staff Meeting | 22 Jan 2002 08:30:00 -0600 CST
- beck-s/inbox/56_ | accepted | Enron Management Committee Extended Meeting | 23 Jan 2002 12:00:00 -0800 PST
- beck-s/inbox/60_ | pending | ncl board meeting |
- beck-s/inbox/83_ | pending | meeting |
- beck-s/inbox/87_ | pending | FW: Logistics Discussion |
- beck-s/inbox/89_ | pending | Houston UTBN Networking Breakfast | 23 Jan 2002 07:00:00 -0800 PST
- beck-s/inbox/100_ | pending | Atria sub needed for Saturday (tomorrow) | 12 Jan 2002 14:00:00 -0800 PST

usePerf: true
