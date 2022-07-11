import React from 'react';
import './styles.css';
import ReactDOM from 'react-dom';
import App from './App';

import { Loader } from './data/loader';

const experimentDescUrl = './experiment.json';
const dataUrl = './data.json';

window.addEventListener('load', () => {
  const loader = new Loader();
  loader.load(experimentDescUrl, dataUrl).then((spec) => {
    ReactDOM.render(
      <React.StrictMode>
        <App
          toolInfo = { spec.experiment }
          overviewData = { spec.overview }
          quantData = { spec.quant }
          qualData = { spec.qual }
          userFeedback = { spec.feedback } />
      </React.StrictMode>,
      document.getElementById('root')
    );
  })
})
