import React from 'react';
import styled from 'styled-components';

import { FontIcon } from 'office-ui-fabric-react/lib/Icon';

import { AvatarCircle, colorAvatar } from '../common';

import { LOCALE_WEEK_TIME, LOCALE_SHORT_DATE, isSameWeek } from '../refs/locale';
import { Email, getInitials } from '../../../models/email';
import { TagStatus, ActionStatus, SmartStatus } from './mail-status';
import { Highlighter } from '../../smart/search-engine';

export const MessageListHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  padding: 13px 24px 2px 45px;
  font-weight: 600;
  line-height: 38px;
  margin-bottom: 1px;
  background-color: #ffffff;
`;
export const MessageListBody = styled.div`
  position: absolute;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
`;
export const MessageList = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 32%;
  background-color: #f3f2f1;
`
export const MessageListPlaceholder = styled.div`
  padding-top: 120px;
  text-align: center;
`;

const ItemWrapper = styled.div<{deleted?:boolean}>`
  margin-bottom: 1px;
  user-select: none;
  cursor: pointer;
  ${props => props.deleted ? 'opacity: 0.6;' : ''}
`;
const ItemInner = styled.div<{selected:boolean, unread:boolean}>`
  background-color: ${props => props.selected ? '#F4F9FD' : '#FFFFFF'};
  padding-right: 16px;
  padding-bottom: 11px;
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: ${props => props.unread ? '#0062AD' : 'transparent'};

  &::after {
    content: "";
    clear: both;
    display: table;
  }
  &:hover {
    background-color: ${props => props.selected ? '#F4F9FD' : '#faf9f8'};
  }
`;

const TRInfoArea = styled.div<{}>`
  float: right;
  margin-top: 9px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  padding: 15px 12px 0 8px;
  float: left;
`;
const ContentWrap = styled.div`
  margin-left: 48px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 400;
  color: #605e5c;
`;
const SenderLine = styled.div<{unread:boolean}>`
  color: #201f1e;
  font-size: 14px;
  font-weight: ${props => props.unread ? '600' : '400'};
  padding-top: 9px;
`;
const SubjectLine = styled.div<{unread:boolean}>`
  color: ${props => props.unread ? '#0062AD' : '#605e5c'};
  font-weight: ${props => props.unread ? '600' : '400'};
  padding-top: 1px;
  & > .time {
    float: right;
  }
`;
const SummaryLine = styled.div`
  color: #605e5c;
  padding: 1px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const SearchHighlight = styled.span`
  background-color: #fff100;
  color: black;
`;
const CategoryTag = styled.div<{category:'red'|'green'|'orange'}>`
  margin: 2px 4px 0 0;
  border-radius: 2px;
  border-style: solid;
  border-width: 1px;
  height: 14px;
  display: inline;
  padding: 0 4px;
  background-color: ${props =>
    props.category === 'green' ? '#e9f9e8' :
    (props.category === 'red' ? '#fce9ea' :
    (props.category === 'orange' ? '#fff1e0' : ''))};
  border-color: ${props =>
    props.category === 'green' ? '#91e38d' :
    (props.category === 'red' ? '#f1919a' :
    (props.category === 'orange' ? '#ffba66' : ''))};
  color: ${props =>
    props.category === 'green' ? '#257e20' :
    (props.category === 'red' ? '#d01b2a' :
    (props.category === 'orange' ? '#a35a00' : ''))};
  cursor: pointer;
`;


const highlightText = (text:string, highlighter?:Highlighter) => {
  if (!highlighter) {
    return text;
  }
  const spans = highlighter(text);
  if (spans.length === 0) {
    return text;
  }
  let lastIndex = 0, chunks:JSX.Element[] = [];
  spans.forEach((span, index) => {
    if (lastIndex < span.start) {
      // Add unlabelled span
      chunks.push(<React.Fragment key = { 'text:' + index }>
          { text.substring(lastIndex, span.start) }
        </React.Fragment>);
    }
    chunks.push(<SearchHighlight key = { 'span:' + index }>
        { text.substring(span.start, span.start + span.length) }
      </SearchHighlight>);
    lastIndex = span.start + span.length;
  });
  if (lastIndex < text.length) {
    chunks.push(<React.Fragment key = { 'text:' + spans.length }>
        { text.substring(lastIndex) }
      </React.Fragment>);
  }
  return chunks;
};

const smartTime = (ref:Date, target:Date):string => {
  const tsDiff = Math.floor((ref.getTime() - target.getTime()) / 1000);
  if (tsDiff >= 0 && isSameWeek(ref, target)) {
    return target.toLocaleString(undefined, LOCALE_WEEK_TIME);
  }
  return target.toLocaleString(undefined, LOCALE_SHORT_DATE);;
}

interface EmailListItemProps {
  email:Email;
  isSelected:boolean;
  isRead:boolean;
  tagStatus:TagStatus;
  actionStatus:ActionStatus;
  smartStatus:SmartStatus;
  refTime?:Date;
  highlighter?:Highlighter;
  onClick?:(e:React.MouseEvent)=>void;
}

export const MessageListItem:React.FunctionComponent<EmailListItemProps> =
  (props) => {

  const { children,
    email,
    isSelected,
    isRead,
    tagStatus,
    actionStatus,
    smartStatus,
    refTime,
    highlighter,
    onClick } = props;

  const summary = email.body.map((p) => {
    return p.map((t) => t.text).join(' ');
  }).join(' ').substring(0, 100);

  const { commitmentStatus } = smartStatus;
  const smartCommitment = (commitmentStatus === undefined ? null :
    (commitmentStatus === 'pending' ? 'EventTentative' :
    (commitmentStatus === 'accepted' ? 'EventAccepted' :
    (commitmentStatus === 'rejected' ? 'EventDeclined' :
    (commitmentStatus === 'conflict' ? 'EventInfo' : null)))));
  const infoArea = <TRInfoArea>
    { smartCommitment !== null ?
        <FontIcon iconName = { smartCommitment }
          style = { { color:
            smartCommitment === 'EventAccepted' ? '#498205' :
            (smartCommitment === 'EventDeclined' ? '#d13438' :
            (smartCommitment === 'EventInfo' ? '#881798' : '')),
            fontWeight: 600} }/> : null }&nbsp;
    { actionStatus?.archived ?
        <FontIcon iconName = { 'Archive' }
          style={{fontWeight: 600}}/> : null }&nbsp;
    { actionStatus?.flagged ?
        <FontIcon iconName = { 'Flag' }
          style={{fontWeight: 600}}/> : null }
  </TRInfoArea>;

  const categoryTags = <React.Fragment>
    { tagStatus.event ?
        <CategoryTag category = "red">Event</CategoryTag> : null }
  </React.Fragment>;

  return <ItemWrapper onClick = { onClick } deleted = { actionStatus.deleted }>
    <ItemInner selected = { isSelected } unread = { !isRead }>
      <Avatar>
        <AvatarCircle
          small = { true }
          color = { colorAvatar(email.from.email) }>
          { getInitials(email.from) }
        </AvatarCircle>
      </Avatar>
      <ContentWrap>
        { infoArea }
        <SenderLine unread = { !isRead } >{ email.from.fullName }</SenderLine>
        <SubjectLine unread = { !isRead } >
          { highlightText(email.subject, highlighter) }
          <div className = 'time'>
            { smartTime(refTime ? refTime : new Date(), email.time) }
          </div>
        </SubjectLine>
        <SummaryLine>
          { categoryTags }
          { highlightText(summary, highlighter) }
        </SummaryLine>
        { children }
      </ContentWrap>
    </ItemInner>
  </ItemWrapper>;
}
