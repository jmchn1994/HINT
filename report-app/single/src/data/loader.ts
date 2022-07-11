import { OverviewData,
  QualData,
  QuantData,
  UserFeedback } from '../models/data';
import { ExperimentDesc } from '../models/experiment-desc';

export interface DataObject {
  overview:OverviewData,
  qual:QualData,
  quant:QuantData,
  feedback:UserFeedback[]
}

export interface SpecObject extends DataObject {
  experiment:ExperimentDesc
};

export class Loader {
  async load(experimentUrl:string, dataUrl:string):Promise<SpecObject> {
    const networkPromises = [
      fetch(experimentUrl).then((resp) => resp.json()),
      fetch(dataUrl).then((resp) => resp.json())
    ];
    const data = await Promise.all(networkPromises);
    const experimentObject: ExperimentDesc = (data[0] as ExperimentDesc);
    const dataObject: DataObject = (data[1] as DataObject);
    return {
      overview: dataObject.overview,
      qual: dataObject.qual,
      quant: dataObject.quant,
      feedback: dataObject.feedback,
      experiment: experimentObject
    };
  }
}
