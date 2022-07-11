import styled from 'styled-components';

export const ToggleContainer = styled.div<{containOnly?:boolean}>`
  ${props => props.containOnly ? '' : 'margin: 10px 0 0 0; padding: 10px 5px; border: 1px dotted #888;'}
  & p {
    margin: 0;
    padding: 0;
  }
`;

export const ToggleOption = styled.div<{selected:boolean}>`
  padding: 5px;
  margin: 5px 0 0 0;
  border: 1px solid ${props => props.selected ? '#ffa024' : 'transparent'} ;
  background-color: ${props => props.selected ? '#ffc880' : '#fff'};
  & > label {
    font-weight: bold;
    cursor: pointer;
  }
  & > p {
    margin: 0;
    padding: 0;
  }
`;
