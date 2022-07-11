# Worker Facing WebApp (Built via [React](https://reactjs.org/))

This directory includes code related to the MTurk worker facing end of the HINT
testing framework.

## Organization

The app is roughly organized as follows:

- `src/components/controls`: UI controls used for HINT framework
- `src/components/smart`: Implementation of smart feature
- `src/components/ui`: Smart feature implementation (Email Management App)
- `src/components/`: UI components for HINT framework (consent,
    training sessions, task sessions, survey etc.)
- `src/models/`: Models for data used in HINT tests

## Loading Configurations

Configurations are loaded in 2 ways: via Ajax or via MTurk injection. For local
development and testing, youw will want to load configurations via Ajax while
during deployment, MTurk will be initializing your test configuration via
injection.

To load a test locally, make sure to set `DATA_SOURCE` in `src/index.tsx` to
a file in `public/` like `demo.json`. Then you can `yarn start` the app, and
supply the following URL parameters:

```
http://localhost:3000/?assignmentId=test&workerId=test&hitId=test
```

to load the task.

Before building for deployment, you will want to set `DATA_SOURCE` to
`'#--task-config'`, which will tell the App to load config from MTurk's
injection point instead. You need to then paste the bundle into MTurk's custom
HIT designer (via the code tab), and run the HIT in the sandbox + supply an
input CSV. If all goes well, you should be able to do your task in the worker
sandbox.

## Testing and Building
Use the following commands to run local debugging versions or build for
deployment to MTurk.

### `yarn start`

Runs the app in the development mode. Once your browser pops up, you should see
an error message along the lines of
`Could not read the assignment identifier from MTurk!`. You need to provide the
following URL paramters to fake being in an MTurk HIT context:
`/?assignmentId=test&workerId=test&hitId=test`.

Note: The MTurk identifiers are also used to prevent multiple participations by
the same user in different HITs and to index recorded local state. To clear task
state, remove all `localStorage` records or change the assignment Id.

Note: You may also enter `debug` mode by providing the url parameter
`&debug=debug`. This will provide a button to `Reset & Reload` the task as well
as show you the data collected at the end of the HIT (instead of attempting to
submit it).

### `yarn build`

Builds the app for production to the `build` folder, then runs a script to
rebuild it as an MTurk Custom HIT into the `post-build` folder. Use the one
in the `post-build` folder for deployment.

Note: The rebuild produces an HTML snippet that bundles the app code, css etc
and adds additional unused form elements so that MTurk will be happy with your
app having no form components specified.
