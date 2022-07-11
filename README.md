# HINT: Integration Testing for AI-based features with Humans in the Loop

Official repository of code related to our paper `HINT: Integration Testing for 
AI-based features with Humans in the Loop` from IUI '22.

Authors: Quanze Chen, Tobias Schnabel, Besmira Nushi, Saleema Amershi

![Overview Diagram](https://github.com/jmchn1994/HINT/blob/main/overview.png?raw=true)

HINT is an integration testing framework that supports early testing of 
AI-based features within the context of realistic user tasks and makes use of 
successive sessions to simulate AI experiences that evolve over-time.

## Overview 
This repository contains an implementation of the HINT framework as well as the 
AI-based feature prototypes used in our studies.

To cite our work, please refer to [CITATION.cff](CITATION.cff) or use the 
following:

```bibtex
@inproceedings{10.1145/3490099.3511141,
  author = {Chen, Quan Ze and Schnabel, Tobias and Nushi, Besmira and Amershi, Saleema},
  title = {HINT: Integration Testing for AI-Based Features with Humans in the Loop},
  year = {2022},
  isbn = {9781450391443},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  doi = {10.1145/3490099.3511141},
  booktitle = {27th International Conference on Intelligent User Interfaces},
  pages = {549–565},
  numpages = {17},
  keywords = {prototyping, Human-AI interaction, crowdsourcing, testing},
  location = {Helsinki, Finland},
  series = {IUI '22}
}
```

## Repository Layout

There are 4 main components:
- `crowd-app/`: This is a React-based application for deploying to 
    Amazon Mechanical Turk.
- `report-app/`: This is a React-based application that produces the 
    practitioner-facing report after HINT tests.
- `tools/`
    - `deploy`: Tools related to deploying the MTurk tasks
    - `report`: Tools related to generating the report from MTurk data
    - ``

## How to use our code

Refer to the sections below on using our tool.

### Building Tests

To build your own tests, refer to the example in `crowd-app` as a starter 
template for a React based application. The code relevant to the AI-based 
feature will be located in `src/components/ui`, `src/components/smart`, and
`src/models`.

During development you should use `yarn start` to do live development. Refer
to the [README](crowd-app/README.md) for details.

### Creating Task Configurations

In order to conduct experiments, you will also need to supply the App with 
experiment configurations. The `tools/deploy` folder contains examples for 
our AI based features, but overall refer to the format indicated to supply 
the data necessary to your own implementation.

You should test out configurations locally by moving them into 
`crowd-app/public`. Refer to the [README](crowd-app/README.md) for details.

### Deploying to MTurk

Once you are done, use `yarn build` to build your application. Now make sure to
use the HTML file located in `crowd-app/post-build`. This is a unified bundle
of your application as retrofitted for MTurk. 

You will need to copy the contents of this file, and paste them into the Custom
HIT designer. This way you can deploy the HIT without using external hosting.

Extra: To host the HIT via a static server or GitHub instead, refer to 
instructions in [this repo](https://github.com/jmchn1994/amt-shim-template) 
(when available).

Please load the task on MTurk to test whether it is correct. Then use the 
`build_tasks.py` tool with the additional options `--base64 --csv` to output the 
task input CSV file for MTurk. See [README](tools/deploy/README.md) for details.

### Generating Reports

To generate the reports, you will want to download the results file from MTurk.
Then use the `export.py` tools in `tools/report` to create a single or 
comparative report. See [README](tools/report/README.md) for details.

You will need to replace the `data.json` in the corresponding 
`report-app/*/public` folder to load the results in the report. You will also 
need to manually edit `experiment.json` in this folder with the metadata for
your test(s) (i.e. tool name, condition details, participant details etc.)