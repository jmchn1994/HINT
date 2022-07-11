import React from 'react';
import styled from 'styled-components';

import { Card } from '../common';

const ComposeCard = styled(Card)`
`;

interface Props {

}

interface State {

}

export class ComposeArea extends React.Component<Props, State> {
  render() {
    return <ComposeCard />;
  }
}
