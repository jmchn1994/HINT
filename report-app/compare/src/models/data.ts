import { Data } from 'plotly.js';

export interface SubSeries {
  x:number[]|string[];
  y:number[]|string[];
}

export interface Series extends SubSeries {
  raw?:string;
  error_x?:number[];
  error_y?:number[];
  name?:string;
  desc?:string|string[];
  type?:'markers-only'|'trendline';
  orientation?:'h'|'v';
  axis?:'alt'|'main';
  color?:string;
  marker?:string;
  group?:'A'|'B';
}

export const decodeSubSeries = (s:String):SubSeries => {
  const X:number[] = [], Y:number[] = [];
  s.split('|').forEach((pair) => {
    const xy = pair.split(',');
    X.push(parseFloat(xy[0]));
    Y.push(parseFloat(xy[1]));
  })
  return {
    x: X,
    y: Y
  };
};

export type ChartMode = 'bar' | 'line';

interface OverviewItem {
  findings:string[];
  series:Series[];
}

export interface OverviewData {
  f1:OverviewItem;
  effort:OverviewItem;
  preference:OverviewItem;
}

type NamedSeries = {[name:string]:Series[]};

export type QualData = {
  line: NamedSeries;
}

type QuantTable = {
  name:string;
  series:Series[];
}

export type QuantData = {[name:string]:QuantTable};

export type FeedbackData = {
  A:UserFeedback[];
  B:UserFeedback[];
}

export const seriesToConfig = (s:Series, m:ChartMode):Partial<Data> => {
  const plotData:Partial<Data> = {
    x: s.x,
    y: s.y,
    name: s.name
  };
  if (m === 'line') {
    plotData.type = 'scatter';
    plotData.line = {};
    if (s.type === 'markers-only') {
      plotData.mode = 'markers';
    } else if (s.type === 'trendline') {
      plotData.mode = 'lines';
      plotData.line.dash = 'dash';
      plotData.hoverinfo = 'skip';
    } else {
      plotData.mode = 'lines+markers';
    }
    if (s.color !== undefined) {
      plotData.line.color = s.color;
    }
  } else if (m === 'bar') {
    // Make the bar chart
    plotData.type = 'bar';
    plotData.orientation = s.orientation;
    if (s.color !== undefined) {
      if (plotData.marker === undefined) {
        plotData.marker = {};
      }
      plotData.marker.color = s.color;
    }
    //plotData.width = 0.6;
  }
  if (s.marker !== undefined) {
    if (plotData.marker === undefined) {
      plotData.marker = {};
    }
    plotData.marker.symbol = s.marker;
    plotData.marker.size = 10;
  }
  if (s.error_x !== undefined) {
    plotData.error_x = {
      visible: true,
      type: 'data',
      array: s.error_x
    };
  }
  if (s.error_y !== undefined) {
    plotData.error_y = {
      visible: true,
      type: 'data',
      array: s.error_y
    };
  }
  if (s.axis === 'alt') {
    plotData.yaxis = 'y2';
  }
  return plotData;
}

export interface UserFeedback {
  p:number;// pref likert
  t:string;
};
