import React from 'react';
import styled from 'styled-components';

export const Container = styled.div`
  position: relative;
  width: 1000px;
  border-left: 1px dotted #000;
  border-right: 1px dotted #000;
  margin: 0 auto;
  padding: 1px 0;
`;

export const HHead = styled.h2`
  position: relative;
  background-color: #888;
  color: #fff;
  padding: 10px 40px;
  margin: 5px 0 15px 0;
`;

export const Paragraph = styled.p`
  position: relative;
  margin: 0 0 20px 0;
  padding: 0 20px 2px 40px;
`

export const Para = styled.p`
  position: relative;
  margin: 0 0 10px 0;
`;

export const Placeholder = styled.div<{width?:number,height?:number}>`
  background-color: #ccc;
  margin: 0 0 10px 0;
  ${props => props.width ? 'width: ' + props.width + 'px;' : ''}
  ${props => props.height ? 'height: ' + props.height + 'px;' : ''}
`;

export const ColorBox = styled.div<{color:'orange'|'blue'}>`
  width: 100%;
  height: 400px;
  background: ${props => props.color === 'orange' ? '#fbdca4' : '#a5b8f8'};
  border: 1px solid
    ${props => props.color === 'orange' ? '#ed7607' : '#0748ed'};
  overflow-y: auto;
  padding: 10px;
  & p {
    font-size: 14px;
  }
`;

const DoubleContainer = styled.div`
  margin: 0px 20px 30px 40px;
  &::after {
    content: "";
    clear: both;
    display: table;
  }
`;

const DoubleLeft = styled.div<{split:number}>`
  float: left;
  width: ${props => (props.split * 97)}%;
  padding-right: 3%;
`;

const DoubleRight = styled.div<{split:number}>`
  float: left;
  width: ${props => (1 - props.split) * 97}%;
`;

interface Props {
  left?:React.ReactNode;
  right?:React.ReactNode;
  split?:number;
}
export const DoubleItem:React.FunctionComponent<Props> = (props:Props) => {
  const { left, right, split } = props;
  return <DoubleContainer>
      <DoubleLeft split={ split ? split : 0.5 }>{ left }</DoubleLeft>
      <DoubleRight split={ split ? split : 0.5 }>{ right }</DoubleRight>
    </DoubleContainer>;
};

export const TableWrap = styled.div`
  position: relative;
  margin: 0 0 20px 0;
  padding: 0 20px 2px 40px;
  & > table {
    border-collapse: collapse;
    width: 100%;
    max-width: 100%;
    margin-bottom: 1rem;
    background-color: transparent;
  }
  & > table td, & > table th {
    padding: .75rem;
    vertical-align: top;
    border-top: 1px solid #dee2e6;
  }
  & > table .head {
    font-weight: bold;
  }
  & > table thead .head {
    vertical-align: bottom;
    border-bottom: 2px solid #dee2e6;
  }
`;
