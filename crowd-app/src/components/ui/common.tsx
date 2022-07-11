import styled from 'styled-components';

export { Card } from '../common';

export const AvatarCircle = styled.div<{small?:boolean,color?:string}>`
  text-align: center;
  color: #ffffff;
  font-size: ${props => props.small ? '10px' : '16px'};
  font-weight: 600;
  line-height: ${props => props.small ? '28px' : '40px'};
  height: ${props => props.small ? '28px' : '40px'};
  width: ${props => props.small ? '28px' : '40px'};
  background-color: ${props => props.color ? props.color : 'rgb(0, 91, 112)'};
  border-radius: 50%;
  margin: auto;
`;

const COLOR_INDEX:string[] = [
  '#750b1c', '#a4262c', '#d13438', '#da3b01',
  '#8e562e', '#ca5010', '#ffaa44', '#fce100',
  '#986f0b', '#c19c00', '#8cbd18', '#0b6a0b',
  '#498205', '#00ad56', '#005b70', '#038387',
  '#00b7c3', '#004e8c', '#0078d4', '#4f6bed',
  '#5c2e91', '#8764b8', '#8378de', '#881798',
  '#c239b3', '#9b0062', '#e3008c', '#393939',
  '#7a7574', '#69797e', '#a0aeb2'
];
export const colorAvatar = (email:string) => {
  const seedValue = email.toUpperCase().split('').reduce((acc, cur) => {
    return acc + cur.charCodeAt(0);
  }, 0);
  const h = Math.sin(seedValue) * 10000;
  return COLOR_INDEX[Math.floor((h - Math.floor(h)) * COLOR_INDEX.length)];
};
