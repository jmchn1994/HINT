import React from 'react';
import styled from 'styled-components';

import { AvatarCircle, colorAvatar, Card } from './common';
import { LOCALE_LONG_TIME } from './refs/locale';
import { Email, getInitials } from '../../models/email';
import { Highlighter } from '../smart/search-engine';

const Body = styled(Card)`
  margin-top: 0px;
`;
const Header = styled.div`
  padding-top: 10px;
`;
const Avatar = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 8px;
  float: left;
`;
const SenderArea = styled.div`
  margin-left 52px;
`;
const NameLine = styled.div``;
const DateLine = styled.div`
  color: #605e5c;
`;

const AddrSpan = styled.span`
  padding-right: 4px;
`;
const ToLine = styled.div``;
const CcLine = styled.div``;
const BccLine = styled.div``;

const RecipientsArea = styled.div`
  margin-left 52px;
`;

const Content = styled.div`
  margin: 12px 16px 10px 52px;
  font-size: 18px;
`;

const TopActionArea = styled.div`
  float: right;
`
const BottomActionArea = styled.div`
  margin: 12px 16px 0 44px;
`;

const ContentParagraph = styled.p`
  white-space: pre-wrap;
`;
const LinkSpan = styled.span`
  color: #0563C1;
  text-decoration: underline;
  cursor: pointer;
`;
const DateSpan = styled.span`
  text-decoration: underline;
  text-decoration-style: dashed;
  cursor: pointer;
`;
const MentionSpan = styled.span`
  border-radius: 2px;
  padding: 0 1px;
  background-color: #f3f2f1;
  &:hover{
    background-color: #edebe9;
  }
`;
const HighlightSpan = styled.span`
  background-color: #fff100;
`;

interface EmailPreviewProps {
  email:Email;
  id?:string;
  highlighter?:Highlighter;
  topActionArea?:React.ReactNode;
  bottomActionArea?:React.ReactNode;
  onInteract?:(tokenId:string) => void;
}

export const EmailPreview:React.FunctionComponent<EmailPreviewProps> =
  (props) => {
  const { id, email, topActionArea, bottomActionArea, onInteract,
    highlighter } = props;
  const emailBody = email.body.map((paragraph, index) => {
    return <ContentParagraph key = { index }>
      {
        paragraph.map((span) => {
          if (span.type === 'span') {
            if (highlighter) {
              const chunks = highlighter(span.text);
              const spans:JSX.Element[] = [];
              let lastIndex = 0;
              chunks.forEach((chunk, i) => {
                if (chunk.start > lastIndex) {
                  spans.push(<span key = { span.id + '-pre-' + i }>
                      { span.text.substring(lastIndex, chunk.start) }
                    </span>);
                }
                spans.push(<HighlightSpan key = { span.id + '-chk-' + i }>
                    { span.text.substring(chunk.start,
                        chunk.start + chunk.length) }
                  </HighlightSpan>);
                lastIndex = chunk.start + chunk.length;
              });
              if (lastIndex < span.text.length - 1) {
                spans.push(<span key = { span.id + '-last' } >
                    { span.text.substring(lastIndex, span.text.length) }
                  </span>);
              }
              return spans;
            } else {
              return <span key = { span.id }>
                  { span.text }
                </span>;
            }
          } else if (span.type === 'link') {
            return <LinkSpan onClick = { () => {
              if (onInteract) {
                onInteract(span.id);
              }
            } } >
              { span.text }
            </LinkSpan>;
          } else if (span.type === 'date') {
            return <DateSpan onClick = { () => {
              if (onInteract) {
                onInteract(span.id);
              }
            } }>
              { span.text }
            </DateSpan>;
          } else if (span.type === 'mention') {
            return <MentionSpan onClick = { () => {
              if (onInteract) {
                onInteract(span.id);
              }
            } }>
              { span.text }
            </MentionSpan>;
          } else {
            return span.text;
          }
        })
      }
    </ContentParagraph>
  });
  return <Body id = { id }>
      <Header>
        <TopActionArea>{ topActionArea }</TopActionArea>
        <Avatar>
          <AvatarCircle color = { colorAvatar(email.from.email) }>
            { getInitials(email.from) }
          </AvatarCircle>
        </Avatar>
        <SenderArea>
          <NameLine>
            { email.from.fullName.length > 0 ?
                email.from.fullName : email.from.email }
          </NameLine>
          <DateLine>
            { email.time.toLocaleString(undefined, LOCALE_LONG_TIME) }
          </DateLine>
        </SenderArea>
        <RecipientsArea>
          <ToLine>
            <strong>To:</strong>&nbsp;
            { email.to.map((addr) =>
              <AddrSpan key = {addr.email}>
                { addr.fullName.length > 0 ? addr.fullName : addr.email };
              </AddrSpan>)}
          </ToLine>
          { email.cc.length > 0 ? <CcLine><strong>Cc:&nbsp;</strong>
            { email.cc.map((addr) =>
            <AddrSpan key = {addr.email}>
              { addr.fullName.length > 0 ? addr.fullName : addr.email };
            </AddrSpan>) }</CcLine> : null }
          { email.bcc.length > 0 ? <BccLine><strong>Bcc:&nbsp;</strong>
            { email.bcc.map((addr) =>
            <AddrSpan key = {addr.email}>
              { addr.fullName.length > 0 ? addr.fullName : addr.email };
              </AddrSpan>)}</BccLine> : null }
        </RecipientsArea>
      </Header>
      <Content>
        { emailBody }
      </Content>
      <BottomActionArea>{ bottomActionArea }</BottomActionArea>
    </Body>;
}
