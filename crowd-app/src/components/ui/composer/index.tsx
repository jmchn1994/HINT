import React from 'react';
import styled from 'styled-components';

import { MapStoreView } from '../../../store/local-backed-storage';
import { Email } from '../../../models/email';
import { EmailPreview } from '../email-preview';
import { ComposeArea } from './compose-area';
import { SmartComposeAPI } from './smart-compose-api';

export { DefaultSmartComposeAPI } from './smart-compose-api';

const Wrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #f3f2f1;
  font-family: "Segoe UI", "Segoe UI Web (West European)", "Segoe UI",
  -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
`;
const Subject = styled.div`
  margin: 0 20px;
  padding: 17px 0 12px 0;
  font-size: 17px;
  font-weight: 600;
`;

interface Props {
  message:Email;
  store:MapStoreView;
  smartComposeProvider?:SmartComposeAPI;
  onEvent?:(eventName:string,eventData?:any) => void;
}

interface State {

}

export class Composer extends React.Component<Props, State> {
  render() {
    const { message } = this.props;
    return <Wrapper>
      <Subject>{ message.subject }</Subject>
      <ComposeArea />
      <EmailPreview
        email = { message } />
    </Wrapper>;
  }
}
