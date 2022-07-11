import { SubSeries, Series } from '../models/data';

interface LinRegOutput {
  series:Series;
  slope:number;
  intercept:number;
  r:number;
}

interface Color {
  r:number;
  g:number;
  b:number;
}

export const interpolateColor = (a:Color, b:Color, ratio:number):Color => {
  if (ratio < 0 || ratio > 1) {
    throw new Error('Ratio must be between 0-1');
  }
  return {
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  }
}

export const colorToString = (color:Color):string => {
  return 'rgb(' + [color.r, color.g, color.b].join(',') +')';
}

export const correlationCoeff = (X:number[], Y:number[]):number => {
  const sumX = X.reduce((a, b) => a + b),
    sumY = Y.reduce((a, b) => a + b),
    sumX2 = X.reduce((acc, cur) => acc + cur * cur, 0),
    sumY2 = Y.reduce((acc, cur) => acc + cur * cur, 0),
    sumXY = X.reduce((acc, cur, i) => acc + cur * Y[i], 0);
  return (X.length * sumXY - sumX * sumY) /
    Math.sqrt((X.length * sumX2 - sumX * sumX) *
      (Y.length * sumY2 - sumY * sumY));
}

export const linearFit = (source:SubSeries):LinRegOutput=> {
  if (source.x === undefined || source.y === undefined) {
    throw new Error('Cannot run regression on incomplete series');
  }
  if (source.x.length !== source.y.length) {
    throw new Error('Mismatched x,y');
  }
  if (source.x.length < 2) {
    throw new Error('Inputs too short! Must have > 1 data point.');
  }
  const X = source.x as number[], Y = source.y as number[];
  const sumX = X.reduce((a, b) => a + b),
    sumY = Y.reduce((a, b) => a + b),
    sdX = Math.sqrt(X.reduce((acc, cur) =>
      acc + Math.pow(cur - sumX / X.length, 2), 0) / X.length),
    sdY = Math.sqrt(Y.reduce((acc, cur) =>
      acc + Math.pow(cur - sumY / Y.length, 2), 0) / Y.length);
  const R = correlationCoeff(X, Y);
  const slope = R * sdY / sdX;
  const intercept = (sumY - slope * sumX) / X.length;
  const f = (x:number):number => slope * x + intercept;

  return {
    series: {
      x: [X[0], X[X.length - 1]],
      y: [f(X[0]), f(X[X.length -1])],
      type: 'trendline',
      color: '#aaaaaa',
      name: 'Trendline <br>(R2 = ' + Math.round(R * R * 10000) / 10000 + ')'
    },
    slope: slope,
    intercept: intercept,
    r: R
  };
}
