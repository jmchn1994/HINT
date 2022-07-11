import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { Customizer } from 'office-ui-fabric-react';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

import ConfigLoader from './compatibility/config-loader';
import { LocalBackedStorage } from './store/local-backed-storage';
import App from './App';

initializeIcons();

const DATA_SOURCE = './demo.json.sample';//'#--task-config';//

function loadSource(path:string, loader:ConfigLoader) {
  if (path.startsWith('#')) {
    return loader.loadFromDOM(
      document.getElementById(path.substring(1)))
  } else {
    return loader.loadFromNetwork(path);
  }
}

// Don't be greedy, render after load
window.addEventListener('load', () => {
  const configLoader = new ConfigLoader();

  const store = new LocalBackedStorage('hai-experiment-2');
  const urlParams = new URLSearchParams(window.location.search);

  const assignmentId = urlParams.get('assignmentId'),
    hitId = urlParams.get('hitId'),
    submitTarget = urlParams.get('turkSubmitTo'),
    workerId = urlParams.get('workerId'),
    debug = (urlParams.get('debug') === 'debug'),
    debugSrc = urlParams.get('debugSrc'),
    dataFilePath = (debug && debugSrc !== null) ? debugSrc : DATA_SOURCE;

  ReactDOM.render(
    <Customizer {...FluentCustomizations}>
      <App
        debug = { urlParams.get('debug') === 'debug' }
        store = { store }
        assignmentId = { assignmentId === null ? undefined : assignmentId }
        hitId = { hitId === null ? undefined : hitId }
        submitTarget = { submitTarget === null ? undefined : submitTarget }
        workerId = { workerId === null ? undefined : workerId }
        sessions = { loadSource(dataFilePath, configLoader) }
        />
    </Customizer>,
    document.getElementById('root')
  );
});
