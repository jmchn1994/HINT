import React from 'react';
import Plot from 'react-plotly.js';
import { Layout, LayoutAxis } from 'plotly.js';

import { Container,
  HHead,
  Para,
  Paragraph,
  DoubleItem,
  Placeholder,
  ColorBox,
  TableWrap } from './components/common';
import { ExperimentDesc } from './models/experiment-desc';
import { QUAL_QUESTIONS, OVERVIEW, QUANT_METRICS } from './models/defaults';

import { replaceNames } from './models/qual-question';

import { OverviewData,
  QuantData,
  QualData,
  FeedbackData,
  Series,
  seriesToConfig,
  decodeSubSeries } from './models/data';

import { linearFit,
  correlationCoeff,
  interpolateColor,
  colorToString } from './utils/math';

interface Props {
  toolInfo:ExperimentDesc;
  overviewData:OverviewData;
  quantData:QuantData;
  qualData:QualData;
  userFeedback:FeedbackData;
}

interface State {
  overviewPerfMode:'no-ai-perf' | 'offline-perf';
}

const COLORS = {
  A: {
    NoAI: 'rgb(8, 81, 156)',
    WithAI: 'rgb(33, 113, 181)',
    Offline: 'rgb(66, 146, 198)'
  },
  B: {
    NoAI: 'rgb(179, 0, 0)',
    WithAI: 'rgb(215, 48, 31)',
    Offline: 'rgb(239, 101, 72)'
  }
};

const DEFAULT_LAYOUT:Partial<Layout> = {
  width: 460,
  height: 240,
  margin: {
    l: 30,
    r: 30,
    b: 30,
    t: 30,
    pad: 0
  }
};
const makeLayout = (config:Partial<Layout>):Partial<Layout> => {
  if (config.yaxis2 === undefined) {
    delete config.yaxis2;
  }
  return {...DEFAULT_LAYOUT, ...config};
}
const makeSeries = (series:Series) => {
  const adjSeries = {...series};
  if (series.group === 'A') {
    if (series.name !== undefined &&
      series.name.startsWith('No-AI')) {
      adjSeries.color = COLORS.A.NoAI;
    } else if (series.name !== undefined &&
      series.name.startsWith('Offline')) {
      adjSeries.color = COLORS.A.Offline;
    } else {
      adjSeries.color = COLORS.A.WithAI
    }
  } else {
    if (series.name !== undefined &&
      series.name.startsWith('No-AI')) {
      adjSeries.color = COLORS.B.NoAI;
    } else if (series.name !== undefined &&
      series.name.startsWith('Offline')) {
      adjSeries.color = COLORS.B.Offline;
    } else {
      adjSeries.color = COLORS.B.WithAI;
    }
  }
  if (series.group === 'A') {
    adjSeries.name = adjSeries.name + ' (A)';
  } else {
    adjSeries.name = adjSeries.name + ' (B)';
  }
  return adjSeries;
}
export default class App extends React.Component<Props, State> {
  constructor(p:Props) {
    super(p);
    this.state = {
      overviewPerfMode: 'no-ai-perf'
    };
  }

  private renderIntro() {
    const { toolInfo } = this.props;
    return <React.Fragment>
      <Paragraph>
        This report compares across the conditions across reports for &nbsp;
        { toolInfo.conditions.map((c) => c.long).join(', ') }&nbsp;
        ({ toolInfo.conditions.map((c) => c.short).join(', ') }). These
        reports will be referred to below as Report A and Report B respectively.
      </Paragraph>
      <Paragraph>
        Data was used from <strong>{
          toolInfo.participants.reduce((acc, cur) =>
            acc + (cur.selected ? cur.selected : 0), 0)
        }</strong> to generate this report, with other participants discarded
        according to quality control conditions.
      </Paragraph>
    </React.Fragment>
  }

  private renderOverview() {
    const { overviewData, toolInfo } = this.props;
    const overviewBlocks = OVERVIEW.map((item) => {
      const perfFindings = overviewData.f1.findings.concat(
          overviewData.effort.findings).map(
            (s, i) => <Para key={'eff-f-' + i}>{ s }</Para>),
        prefFindings = overviewData.preference.findings.map(
          (s, i) => <Para key={'pref-f-' + i}>{ s }</Para>);
      const left = <div>
          <strong>Overall { item.name.toUpperCase() }&nbsp;
          { item.name === 'performance' ? 'comparing' : 'for'}&nbsp;
          <i>With-AI</i> sessions&nbsp;
          { item.name === 'performance' ? 'and' : 'over'}&nbsp;
          <i>No-AI</i> sessions</strong>
          <div></div>
          { item.name === 'performance' ? perfFindings : prefFindings }
        </div>;
      const f1Configs =  overviewData.f1.series.map((series) => {
        return seriesToConfig(makeSeries(series), 'line');
      });
      const y2:Partial<LayoutAxis>|undefined =
        toolInfo.toolName.startsWith('Smart') ?
          {
            'title': 'MRR',
            'overlaying': 'y',
            'side': 'right',
            'range': [0, 1]
          } : undefined;
      const plots = item.name === 'performance'? <div>
          <Plot
            data = { f1Configs }
            layout = { makeLayout({
              title: 'F1 Score',
              legend: {
                xanchor:"right",
                x: 1.6
              },
              yaxis: { range: [0, 1] },
              xaxis: { range: [0, 5] },
              yaxis2: y2
            }) }
          />
          <Plot
            data = { overviewData.effort.series.map((series) => {
              return seriesToConfig(makeSeries(series), 'line');
            })}
            layout = { makeLayout({
              title: 'Observed Effort (% messages opened)',
              xaxis: { range: [0, 5] },
              legend: {
                xanchor:"right",
                x: 1.6
              }
              //yaxis: { range: [0, 1] }
            }) }
          />
        </div> : <div>
          <Plot
            data = { overviewData.preference.series.map((series) => {
              return seriesToConfig(series, 'bar');
            }) }
            layout = { makeLayout({
              title: 'Preference (% users)',
              barmode: 'stack',
              legend: {
                orientation: "h",
                yanchor: 'bottom',
                y: -1
              },
            }) }
          />
        </div>;
      return <DoubleItem
        key = { item.name }
        left = { left }
        right = { plots }
        split = { 0.5 } />
    });
    return <React.Fragment>
        <Paragraph>
          In our test, participants engaged with the system through 2 groups
          of tasks: first the <i>No-AI</i> group, where the AI assistance was
          turned off (2 sessions); and then the <i>With-AI</i> group, where
          AI assistance was provided according to the experiment configuration
          (4 sessions). This section presents an overview comparing between
          these groups of sessions.
        </Paragraph>
        { overviewBlocks }
      </React.Fragment>;
  }

  private renderQual() {
    const { qualData, toolInfo } = this.props;

    const questions = QUAL_QUESTIONS.map((section) => {
      const dataMode = (section.type === 'likert' ? '7-point Likert' :
        (section.type === 'freeform' ? 'Free Text' : 'Continuous'));
      // Do a linear fit
      const fitA = linearFit(qualData.line[section.title].filter(
        (s) => s.name?.startsWith('With-AI'))[0]);
      const fitB = linearFit(qualData.line[section.title].filter(
        (s) => s.name?.startsWith('With-AI'))[1]);

      const left = <div>
        <strong>
          { section.title.toUpperCase() } over time ({ dataMode })
        </strong>
        <Para>
          <i>{ replaceNames(section.text, toolInfo.toolName) }</i>
          <br/>
          <span style = { { fontSize: '10px' } }>
            { section.type === 'likert' ?
            '(1 - Strongly disagree, 7 - Strongly agreee)' : null }
          </span>
        </Para>
        <Para>
          Report A: Linear fit coefficient:&nbsp;
          <span style = { {
              fontWeight: 'bold',
              color: fitA.slope > 0 ? '#00912e' :
                (fitA.slope < 0 ? '#910000' : '#000')
            } }>
            { fitA.slope >= 0 ? '+ ' : '- '}
            { Math.abs(Math.round(fitA.slope * 1000) / 1000) }
          </span>
        </Para>
        <Para>
          Report B: Linear fit coefficient:&nbsp;
          <span style = { {
              fontWeight: 'bold',
              color: fitB.slope > 0 ? '#00912e' :
                (fitB.slope < 0 ? '#910000' : '#000')
            } }>
            { fitB.slope >= 0 ? '+ ' : '- '}
            { Math.abs(Math.round(fitB.slope * 1000) / 1000) }
          </span>
        </Para>
      </div>;
      // Generate the visualization
      const seriesList = qualData.line[section.title].slice();

      var plot = <Placeholder width = { 460 } height={ 280 } />;
      if (seriesList !== undefined ) {
        plot = <Plot
          data = { seriesList.map((series) => {
            return seriesToConfig(makeSeries(series), 'line');
          })}
          layout = { makeLayout({
            width: 590,
            height: 280,
            title: 'Likert Score (1-7)',
            yaxis:{
              title: 'Score',
              range:[1,7]
            },
            xaxis: {
              title: 'Session',
              range: [0, 5]
            },
            showlegend: true
          })} />;
      }
      return {
        item: <DoubleItem
          key = {section.title}
          left = { left }
          right = { plot }
          split = { 0.35 } />,
        name: section.title
      };
    });

    return <React.Fragment>
        <Paragraph>
          This section presents user reported impressions of their experience
          with the AI system based on a set of Likert questions. These questions
          are asked at the end of each session a participant completes.
        </Paragraph>
        { questions.map((q) => q.item) }
        { this._renderUserVoices() }
      </React.Fragment>;
  }

  private _renderUserVoices() {
    const { userFeedback, toolInfo } =  this.props;
    const userNegativeA = <React.Fragment>
        <p>
          <strong>{toolInfo.conditions[0].short}</strong>
        </p>
        <ColorBox color={'orange'}>
          { userFeedback.A.filter((item) => item.p < 4).map((item, i) => {
            return <p key={'no-ai-' + i}>
              <strong>(Score: {item.p})</strong>&nbsp;
              { item.t }
            </p>;
          }) }
        </ColorBox>
      </React.Fragment>;
    const userNegativeB = <React.Fragment>
        <p>
          <strong>{toolInfo.conditions[1].short}</strong>
        </p>
        <ColorBox color={'orange'}>
          { userFeedback.B.filter((item) => item.p < 4).map((item, i) => {
            return <p key={'no-ai-' + i}>
              <strong>(Score: {item.p})</strong>&nbsp;
              { item.t }
            </p>;
          }) }
        </ColorBox>
      </React.Fragment>;
    const userPositiveA = <React.Fragment>
        <p>
          <strong>{toolInfo.conditions[0].short}</strong>
        </p>
        <ColorBox color={'blue'}>
        { userFeedback.A.filter((item) => item.p >= 4).reverse()
          .map((item, i) => {
            return <p key={'no-ai-' + i}>
              <strong>(Score: {item.p})</strong>&nbsp;
              { item.t }
            </p>;
          }) }
        </ColorBox>
      </React.Fragment>;
    const userPositiveB = <React.Fragment>
        <p>
          <strong>{toolInfo.conditions[1].short}</strong>
        </p>
        <ColorBox color={'blue'}>
        { userFeedback.B.filter((item) => item.p >= 4).reverse()
          .map((item, i) => {
            return <p key={'no-ai-' + i}>
              <strong>(Score: {item.p})</strong>&nbsp;
              { item.t }
            </p>;
          }) }
        </ColorBox>
      </React.Fragment>;
    return <React.Fragment>
        <Paragraph>
          <strong>USER VOICES</strong>
          <br/>
          In this section we present comments from users regarding their
          experience with the system and the two groups of tasks
          (With-AI and No-AI).
        </Paragraph>
        <Paragraph>
          <strong>Prefer No-AI (1-3 on Likert scale)</strong>​
        </Paragraph>
        <DoubleItem
          left = { userNegativeA }
          right = { userNegativeB }
          split = { 0.5 }/>
        <Paragraph>
          <strong>Neutral or Prefer With-AI (4-7 on Likert scale)</strong>​
        </Paragraph>
        <DoubleItem
          left = { userPositiveA }
          right = { userPositiveB }
          split = { 0.5 }/>
      </React.Fragment>;
  }

  private renderQuant() {
    const { quantData, toolInfo } = this.props;
    const metrics = QUANT_METRICS.map((item) => {
      const seriesList = quantData[item.title].series.slice();
      const fitA =
        linearFit(seriesList.filter((s) => s.name?.startsWith('With-AI'))[0]);
      const fitB =
        linearFit(seriesList.filter((s) => s.name?.startsWith('With-AI'))[1]);
      const left = <div>
        <strong>
          Measure of { item.title.toUpperCase() } over time
        </strong>
        <Para>
          { item.title === 'uptake' ?
              item.desc.split('|')[
                toolInfo.toolName.startsWith('Event') ? 1 : 0] : item.desc }
        </Para>
        <Para>
          Report A - Linear fit coefficient: { fitA.slope >= 0 ? '+ ': '- '}
          { Math.abs(Math.round(fitA.slope * 1000) / 1000) }
        </Para>
        <Para>
          Report B - Linear fit coefficient: { fitB.slope >= 0 ? '+ ': '- '}
          { Math.abs(Math.round(fitB.slope * 1000) / 1000) }
        </Para>
      </div>;
      const plot = <Plot
        data = { seriesList.map((series) => {
          return seriesToConfig(makeSeries(series), 'line');
        })}
        layout = { makeLayout({
          width: 590,
          title: quantData[item.title].name,
          showlegend: true
        })} />;
      return <DoubleItem
        key = { item.title }
        left = { left }
        right = { plot }
        split = { 0.35 } />;
    })
    return <React.Fragment>
        <Paragraph>
          This section presents aggregate values for various user interaction
          probes.
        </Paragraph>
        { metrics }

        <Paragraph>
          <strong>Correlations with self-reported experience</strong>
          <br/>
          Correlation of quantitative interaction measurements against
          participants' self reported experience (Likert values).
        </Paragraph>

        { this._renderCorrelation() }
      </React.Fragment>;
  }

  private _renderCorrelation() {
    const { quantData, qualData } = this.props;
    const cols = QUANT_METRICS.map((m) => m.title);
    const rows = QUAL_QUESTIONS.map((q) => {
      const cells = QUANT_METRICS.map((m) => {
        const aiQuantSeries = quantData[m.title].series
          .filter((s) => s.name?.startsWith('With-AI'))
          .map((s) => s.raw ? decodeSubSeries(s.raw) : s);
        const aiQualSeries = qualData.line[q.title]
          .filter((s) => s.name?.startsWith('With-AI'))
          .map((s) => s.raw ? decodeSubSeries(s.raw) : s);
        const yQuant = aiQuantSeries.reduce((acc, cur) =>
          acc.concat(cur.y as number[]), [] as number[]);
        const yQual = aiQualSeries.reduce((acc, cur) =>
          acc.concat(cur.y as number[]), [] as number[]);
        const R =correlationCoeff(yQuant, yQual);
        const POS = {r:33, g:102, b:172},
          NEG = {r:128,g:24,b:43},
          NEUTRAL = {r:160,g:160,b:160};
        const ratio = Math.sqrt(Math.abs(R))
        const color = R >= 0 ?
          colorToString(interpolateColor(NEUTRAL, NEG, ratio)) :
          colorToString(interpolateColor(NEUTRAL, POS, ratio));
        const weight = Math.abs(R) >= 0.7 ? 'bold' : 'normal';
        return <td key={q.title + '::' + m.title }
          style = {{ color: color, fontWeight: weight }}>
            { R >= 0 ? '+ ' : '- '}
            { Math.abs(Math.round(R * 100)/100) }
          </td>;
      })
      return <tr key = { q.title }>
          <td className="head">{ q.title }</td>
          { cells }
        </tr>;
    });
    return <TableWrap>
        <table>
          <thead>
            <tr>
              <td width="15%" className = 'head'></td>
              { cols.map((n) => <td key={n}
                className = 'head'
                width={(85/cols.length) + '%'}>{ n }</td>) }
            </tr>
          </thead>
          <tbody>
            { rows }
          </tbody>
        </table>
      </TableWrap>;
  }

  render() {
    const { toolInfo } = this.props;
    return <Container>
        <HHead>
        Comparison Report for { toolInfo.toolName }&nbsp;
        ({ toolInfo.conditions.map((c) => c.short).join(', ') })
        </HHead>
        { this.renderIntro() }

        <HHead>OVERVIEW</HHead>
        { this.renderOverview() }

        <HHead>SELF REPORTED</HHead>
        { this.renderQual() }

        <HHead>MEASURED</HHead>
        { this.renderQuant() }
    </Container>;
  }
}
