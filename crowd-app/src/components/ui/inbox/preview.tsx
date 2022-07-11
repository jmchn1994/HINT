import React from 'react';
import styled from 'styled-components';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react';
import { FontIcon } from 'office-ui-fabric-react/lib/Icon';

import { TagColors } from '../refs/colors';
import { EmailPreview } from '../email-preview';
import { ActionStatus, TagStatus, SmartStatus } from './mail-status';
import { InboxAction } from './index';
import { Email } from '../../../models/email';
import { Highlighter } from '../../smart/search-engine';

const PreviewOuter = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 68%;
  background-color: #faf9f8;
  font-size: 11.0pt;
  font-family: "Calibri",sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
`;
const Subject = styled.div`
  margin: 0 20px;
  padding: 17px 0 12px 0;
  font-size: 17px;
  font-weight: 600;
`;
const SubjectSuffix = styled.div`
  display: inline;
  margin-left: 15px;
`;

interface InboxPreviewProps {
  email:Email;
  actions:InboxAction[];
  actionStatus:ActionStatus;
  tagStatus:TagStatus;
  smartStatus:SmartStatus;
  id?:string;
  highlighter?:Highlighter;
  onAction?:(action:InboxAction) => void;
  onInteract?:(spanId:string) => void;
}

export const InboxPreview:React.FunctionComponent<InboxPreviewProps> =
  (props) => {
  const { email,
    actions,
    tagStatus,
    actionStatus,
    smartStatus,
    highlighter,
    id,
    onAction,
    onInteract } = props;

  const singleActions = actions.filter((a) => !a.startsWith('tag-')),
    multiAction = actions.filter((a) => a.startsWith('tag-'));
  const singleActionButtons = singleActions.map((a) => {
      const title =
        (a === 'delete' ? (actionStatus.deleted ? 'Restore' : 'Delete') :
        (a === 'archive' ? (actionStatus.archived ? 'Unarchive': 'Archive') :
          (actionStatus.flagged ? 'Un-flag': 'Flag')));
      return <PrimaryButton key = { a } text = { title }
        style = { {'marginLeft': '12px'} }
        onClick = { () => {
          if (onAction) {
            onAction(a);
          }
        } }/>;
    });
  const multiActionButton = multiAction.length === 1 ?
    <PrimaryButton key = { multiAction[0] }
      id = { 'inbox-preview-tag-button' }
      text = { tagStatus.event ? 'Remove Event Tag' : 'Tag as Event'}
      style = { {'marginLeft': '12px', 'backgroundColor': '#0078d4'} }
      onClick = { () => {
        if (onAction) {
          onAction(multiAction[0]);
        }
      } }
      />
    : <DefaultButton
      id = { 'inbox-preview-tag-button-group' }
      text="Categorize"
      primary
      style = { {'marginLeft': '12px', 'backgroundColor': '#0078d4'} }
      splitButtonAriaLabel="See options"
      aria-roledescription="split button"
      menuProps={ {
        'items':multiAction.map((a) => {
          return {
            key: a,
            text: (a === 'tag-event' ? 'Event' : a),
            iconProps: {
              iconName: 'Tag',
              styles: {
                root: {
                  color: TagColors.red + ' !important'
                }
              }
            },
            canCheck: true,
            onClick: () => {
              if (onAction) {
                onAction(a);
              }
            },
            checked: tagStatus.event
          };
        })
      } } />;
  const actionButtons = <React.Fragment>
    { singleActionButtons }
    { multiAction.length > 0 ? multiActionButton : null }
    </React.Fragment>;

  const { commitmentStatus } = smartStatus;
  const smartCommitment = (commitmentStatus === undefined ? null :
    (commitmentStatus === 'pending' ? 'EventTentative' :
    (commitmentStatus === 'accepted' ? 'EventAccepted' :
    (commitmentStatus === 'rejected' ? 'EventDeclined' :
    (commitmentStatus === 'conflict' ? 'EventInfo' : null)))));
  const suffix = <SubjectSuffix>
      { smartCommitment !== null ?
          <FontIcon iconName = {smartCommitment }/> : null }
    </SubjectSuffix>;

  return <PreviewOuter id = { id }>
    <Subject>
      { email.subject }
      { suffix }
    </Subject>
    <EmailPreview
      id = { 'inbox-preview-body' }
      email = { email }
      highlighter = { highlighter }
      topActionArea = { actionButtons }
      onInteract = { onInteract }/>
  </PreviewOuter>;
}
