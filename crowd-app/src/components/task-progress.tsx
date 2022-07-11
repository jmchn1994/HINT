import React from 'react';
import styled from 'styled-components';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';

interface Props {
  current?:number;
  total?:number;
}

const Wrapper  = styled.div`
  position: relative;
  padding: 4px 5% 4px 5%;
  height: 32px;
`;
const TextLabel = styled.div<{progress:number}>`
  position: absolute;
  top: 12px;
  left: ${props => props.progress * 90 + 5}%;
`
export default class TaskProgress extends React.Component<Props> {

  render() {
    const { current, total } = this.props;
    if (current === undefined || total === undefined) {
      return <Wrapper>
        (Task data not loaded)
      </Wrapper>
    }
    const progress = Math.min(1, current / total);
    return <Wrapper>
        <div style = { {'width': '100%' } }>
          <TextLabel progress = { progress } >
            { current } / { total }
          </TextLabel>
        </div>
        <ProgressIndicator
          percentComplete = { progress } />
      </Wrapper>;
  }
}
