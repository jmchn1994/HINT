import React from 'react';
import styled from 'styled-components';

import { RenderFunction, StateUpdateFunction } from '../types';

const QuestionWrap  = styled.div<{error?:boolean}>`
  margin-bottom: 30px;
  border: ${props => props.error ? '1px solid #f00' : '1px solid transparent'};
  &::after {
    content: "";
    clear: both;
    display: table;
  }
`;
const QuestionsTable = styled.table`
  width:100%;
  border-spacing: 0;
  margin: 10px 0;
  & thead {
    background-color: #f5f5f5;
  }
  & tr > td, & tr > th {
    padding: 10px;
  }
`;
const QuestionsRow = styled.tr<{even?:boolean,error?:boolean}>`
  background-color: ${props => props.error ? '#fff1f1' :
    (props.even ? '#f1f1f1': '#fff')};
  border: 1px solid ${props => props.error ? '#f00' : 'transparent'};
  font-size: 18px;
`;
const QuestionsCell = styled.td`
  text-align: center;
`;

function shuffle<T>(arr:T[]):T[] {
  return arr;
}

export interface LikertQuestion {
  id:string;
  text:string;
  promptRenderer?:RenderFunction<string>;
  bodyRenderer?:RenderFunction<LikertQuestion>;
}

export interface LikertSurveyState {

}

interface Props {
  questions:LikertQuestion[];
  levels:string[];
  onUpdateSelection:StateUpdateFunction<LikertSurveyState>;
  levelLabelRenderer?:RenderFunction<string>;


  /**
   * Preserve the order of the questions as they are presented
   **/
  preserveOrder?:boolean;
}

interface State {
  answers:LikertSurveyState;
}

export default class LikertTable extends React.Component<Props, State> {
  constructor(props:Props) {
    super(props);
    this.state = {
      answers: {}
    };
  }

  private renderSingleQuestion(question:LikertQuestion) {

  }

  private renderQuestions() {
    const { questions, preserveOrder } = this.props;
    // Decide whether to shuffle or not
    if (preserveOrder) {
      return questions.map(this.renderSingleQuestion.bind(this));
    } else {
      return shuffle(questions).map(this.renderSingleQuestion.bind(this))
    }
  }

  private renderHeader() {
    const { levels, levelLabelRenderer } = this.props;
    return <thead>
      <tr>
        <th style = {{'width': '44%'}}>Question</th>
        {
          levels.map((level, i) => {
            return <th
              key = {'likert-head-' + i}
              style = {{'width': (60 / levels.length) + '%'}}>
              { levelLabelRenderer ? levelLabelRenderer(level) : level }
            </th>
          })
        }
      </tr>
    </thead>;
  }

  render() {
    return <QuestionsTable>
      { this.renderHeader() }
      <tbody>
        { this.renderQuestions() }
      </tbody>
    </QuestionsTable>
  }
}
