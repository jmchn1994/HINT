import React from 'react';
import styled from 'styled-components';
import { PrimaryButton } from 'office-ui-fabric-react';

import { Container } from '../common';

const InstructionsWrap = styled.div`
  color: #0c2f0c;
  border: 1px #4CAF50 solid;
  background-color: #dbffdd;
  border-radius: 6px;
  padding: 0.3rem;
  margin: 10px 5px;
`;
const InstructionsHead = styled.h2`
  margin: 5px 14px 4px 18px;
`;
const InstructionsBody = styled.div`
  margin: 10px 14px 8px 10px;
  font-size: 18px;
`;
const TriggerText = styled.span`
  text-decoration: underline;
  text-decoration-style: double;
  cursor: pointer;
`;

const MainArea = styled.div<{showSideBar?:boolean, showTopBar?:boolean}>`
  position: absolute;
  top: ${props => props.showTopBar ? '52px' : '0'};
  bottom: 0;
  right: ${props => props.showSideBar ? '20%' : '0'};
  left: 0;
  border-right: 2px solid #aaaaaa;
  border-top: 2px solid #aaaaaa;
`;
const SideBar = styled.div<{hasInset?:boolean}>`
  position: absolute;
  right: 0;
  top: 0;
  bottom: ${props => props.hasInset ? '254px' : '0'};
  width: 20%;
  overflow-y: auto;
`;
const TopBar = styled.div`
  position: absolute;
  top: 0;
  height: 32px;
  right: 20%;
  left: 0;
  padding: 10px;
  background-color: #fff;
`;
const SideBarInset = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  height: 252px;
  width: 20%;
  border-top: 2px solid #aaaaaa;
`;

interface State {
  showInstructions:boolean;
  hoverButton:boolean;
}
interface Props {
  showControls:boolean;
  instructions:React.ReactNode;
  instructionsHead?:string;
  sidebarBefore?:React.ReactNode;
  sidebarAfter?:React.ReactNode;
  suppressFooter?:boolean;
  completeButtonMode:'top' | 'side' | 'inside';
  disabled?:boolean;
  onComplete?:() => void;
}

export default class TaskControls extends React.Component<Props, State> {
  constructor(props:Props) {
    super(props);
    this.state = {
      showInstructions: true,
      hoverButton: false
    };
  }

  protected renderInstructions() {
    const { instructions, instructionsHead, suppressFooter,
      sidebarBefore, sidebarAfter, completeButtonMode } = this.props;
    const { showInstructions } = this.state;
    if (showInstructions) {
      return <React.Fragment>
          <SideBar hasInset = {completeButtonMode === 'side'}>
            { sidebarBefore }
            <InstructionsWrap>
            <InstructionsHead>
              { instructionsHead ? instructionsHead : 'Task' }
            </InstructionsHead>
            <InstructionsBody>
            { instructions }
            { suppressFooter ? null :
              <p>
                When you are done with the task, please click on the&nbsp;
                <TriggerText
                  onMouseEnter = { () => {
                    this.setState({
                      hoverButton: true
                    });
                  } }
                  onMouseOut = { () => {
                    this.setState({
                      hoverButton: false
                    })
                  }}>

                  "I'm Done"
                </TriggerText>&nbsp;
                button.
              </p>
            }
            </InstructionsBody>
            </InstructionsWrap>
            { sidebarAfter }
            { completeButtonMode === 'inside' ? this.renderControls() : null }
        </SideBar>
        { completeButtonMode === 'side' ? this.renderControls() : null }
      </React.Fragment>;
    }
  }

  private renderControls() {
    const { showControls, disabled, completeButtonMode, onComplete } = this.props;
    const { hoverButton } = this.state;
    const button = <PrimaryButton
      id = 'controls-done-button'
      text = "I'm Done!"
      disabled = { disabled }
      style = { {
        float: (completeButtonMode === 'top' ? 'right' : 'none'),
        display: 'block',
        margin: (completeButtonMode === 'side' ||
          completeButtonMode === 'inside' ? '10px auto' : '0'),
        backgroundColor: hoverButton ? '#6bb700' : undefined
      } }
      onClick = { () => {
        if (onComplete) {
          onComplete();
        }
      } }/>;
    if (showControls) {
      if (completeButtonMode === 'top') {
        return <TopBar>
          { button }
        </TopBar>;
      } else if (completeButtonMode === 'side') {
        return <SideBarInset>
          { button }
        </SideBarInset>;
      } else if (completeButtonMode === 'inside') {
        return button;
      }
    }
  }

  render() {
    const { completeButtonMode, children } = this.props;

    return <Container>
        { completeButtonMode === 'top' ? this.renderControls() : null }
        { this.renderInstructions() }
        <MainArea
          showSideBar
          showTopBar = {completeButtonMode === 'top'}>{ children }</MainArea>
      </Container>;
  }
}
