import React from 'react';
import styled from 'styled-components';
import { PrimaryButton } from 'office-ui-fabric-react';

import { InterstitialConfig } from '../models/interstitial-config';
import { Page, PageBody, PageCard, PageFooter } from './common';

const VerbCard = styled(PageCard)`
  white-space: pre-wrap;
`;
const TaskGroupNotice = styled.div<{color:'blue'|'yellow'}>`
  padding: 5px;
  border: 1px solid ${props => props.color === 'blue' ? '#b8daff' : '#ffeeba'};
  background-color: ${props => props.color === 'blue' ? '#cce5ff' : '#fff3cd'};
  color: ${props => props.color === 'blue' ? '#004085' : '#856404'}
`;

interface Props {
  config:InterstitialConfig;
  onProgress:()=>void;
}

export default class Interstitial extends React.Component<Props> {
  private _renderSimpleMarkdown(desc:string) {

    return desc;
  }

  render() {
    const { config, onProgress } = this.props;
    const taskGroup = config.group === '' ? null :
      <TaskGroupNotice color = {config.group}>
        We will refer to this group of tasks as the&nbsp;
        { config.group } group.
      </TaskGroupNotice>;

    return <Page>
      <PageBody footer = { true }>
        <VerbCard>
          <h2>{ config.title }</h2>
          { config.desc.map((t, i) => {
              return <p key = { 'inter-' + i }>{
                  this._renderSimpleMarkdown(t)
                }</p>;
            }) }
          { taskGroup }
        </VerbCard>
      </PageBody>
      <PageFooter>
          <PrimaryButton text = "Continue"
            style = { {float: "right" } }
            onClick = { onProgress } />
      </PageFooter>
    </Page>;
  }
}
