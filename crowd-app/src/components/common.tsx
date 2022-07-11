import React from 'react';
import styled from 'styled-components';

export const Container = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
`;
export const Page = styled(Container)``;

export const Card = styled.div`
  border: 1px solid #d0d0d0;
  margin: 8px 20px 8px 8px;
  background: #fff;
  padding: 0 12px 12px 12px;
`

export const PageBody = styled.div<{footer?:boolean}>`
  position: absolute;
  top: 0;
  bottom: ${props => props.footer ? '60px' : '0'};
  left: 0;
  right: 0;
  padding: 32px 20% 70px 20%;
  overflow-y: auto;
  overflow-x: hidden;
`;
export const PageOverlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #000;
  opacity: 0.3;
`;

export const PageCard = styled(Card)`
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
  font-weight: normal;
  & > h1 {
    font-family: "Segoe UI Light";
    font-weight: normal;
    margin: 10px 0;
  }
  & > h2 {
    font-family: "Segoe UI Light";
    font-weight: normal;
    margin: 10px 0;
    color: #D83B01;
  }
  &::after {
    content: "";
    clear: both;
    display: table;
  }
`

const PageFooterOutside = styled.div`
  position: absolute;
  border-top: 1px solid #d0d0d0;
  height: 59px;
  bottom: 0;
  left: 0;
  right: 0;
  padding-left: 20%;
  padding-right: 20%;
  background: #fff;
`;
const PageFooterInside = styled.div`
  padding: 14px 40px 13px 40px;
  &::after {
    content: "";
    clear: both;
    display: table;
  }
`
export const PageFooter:React.FunctionComponent = (props) => {
  const { children } = props;
  return <PageFooterOutside>
    <PageFooterInside>{ children }</PageFooterInside>
  </PageFooterOutside>;
};
