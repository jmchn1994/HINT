# Task Deployment Tools

For our experiments, deploying tasks consists of 2 steps:
- Task assembly: Assemble a single HINT test sequence spec from a mailbox.
    Each participant will be assigned one of these test sequences.
- Building HITs: Build a HIT out of a series of individual HINT tests
    Produces a CSV file that contains a bunch of different assembled tasks to
    be assigned to different test participants

## Assembling Tasks

The task specs roughly look like markdown documents. A sample can be seen in
`sample-tasks`. To generate these specs over the enron mail dataset, we have
included `assemble_tasks_search.py` and `assemble_tasks_commitment.py`.

These tools depend on the enron mail (assumed to be located in `./maildir`).

We first scan a set of inboxes (see `sample-inbox/` for samples), that have mail
manually labelled as `distractor` or `gold`. Inboxes are permuted and then
the condition is applied.

After this step, you should have a directory full of `.md` task specs.

## Building HITs

To build HITs, use `build_tasks.py`. When a single `.md` spec is specified,
this script reads the mail items designated in the spec from the enron dataset,
and assembles a json task spec that can be used to initialize tasks (see
`crowd-app/public/demo.json.sample`).

When specifying a directory of task specs (see above section), this script can
turn the sequence of `.md` specs into a list of JSON specs by constructing each
JSON input. Then it can then encode it into base64 and build everything into a
`.csv` file that MTurk will accept.

## Other files
We've also included various intermediate tools that we used but were not
directly relevant to the HIT.

- `subsample_mail.py`: Scans the enron mail dataset and gives info about the
    mailboxes so we can select good candidate users for using their mailbox
- `assemble_tasks_new_unused.py`: This is a newer version of the assembly code
    that were not used in the experiments. Instead of sampling different
    mailboxes, we sample different periods of time of a single user's mailbox
    giving tasks that have more immersive experience for the user.
