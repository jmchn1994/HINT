import React from 'react';
import styled from 'styled-components';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { PrimaryButton, Callout } from 'office-ui-fabric-react';

import { getTotalPay,
  BASE_PAY, PER_TASK_PAY, PER_TASK_BONUS, FINAL_BONUS } from '../const';
import { Page, PageBody, PageCard, PageFooter, PageOverlay } from './common';

const CalloutInner = styled.div`
  min-width: 100px;
  font-size: 16px;
  padding: 20px;
`;

interface Props {
  taskCount:number;
  canAccept:boolean;
  onAccept:()=>void;
}

interface State {
  showCompDetails:boolean;
}

export default class Intro extends React.Component<Props, State> {
  constructor(props:Props) {
    super(props);
    this.state = {
      showCompDetails: false
    };
  }

  private toggleIsCalloutVisible() {
    const { showCompDetails } = this.state;
    this.setState({
      showCompDetails: !showCompDetails
    });
  }

  render() {
    const { taskCount, onAccept, canAccept, children } = this.props;
    const { showCompDetails } = this.state;
    return <Page>
      <PageBody>
        <PageCard>
          { children }
          <h1>Introduction</h1>
          <p>
            Thanks for your interest in our HIT! We are researchers conducting
            a research study to <strong>evaluate AI powered productivity tools.
            </strong>
          </p>
          <p>
          In this HIT, you will be using a simplified version of an email
          application as if you were helping an employee manage their inbox
          over a period of time.
          </p>
          <p>
          This HIT will proceed as follows:
          </p>
          <ul>
            <li>
              Following this page, you will see a consent form with more details
              about the study. Your consent is required for participation.
            </li>
            <li>
              You will then be given a short tutorial about how to use the email
              application to complete an example task.
            </li>
            <li>
              After the tutorial, you will go through a sequence of tasks using
              the email application as if you were helping an employee manage
              their inbox over the duration of several months. During each of
              the tasks you will be asked to help the employee by tagging or
              categorizing emails for them that have arrived within a period of
              2 weeks. You will also be provided with AI-based assistance to
              complete each task.
            </li>
            <li>
              After each task you will be asked about your experience completing
              the task and your experience with the AI-based assistance.
            </li>
            <li>
              After completing all the tasks, you will be asked a final set of
              questions about your overall experience.
            </li>
          </ul>
          <p>
            You will be paid for your participation based on your completion of
            the tasks in this HIT. Most commonly, this will be&nbsp;
            <strong>${ getTotalPay(taskCount) }</strong> assuming you completed
            all task sessions
            (<Link
              className="p-comp-details"
              onClick = { (e) => {
                e.preventDefault();
                this.toggleIsCalloutVisible();
              }}>?</Link>
            { showCompDetails ? <Callout
              target = '.p-comp-details'
              onDismiss={ () => this.toggleIsCalloutVisible() }
              setInitialFocus>
                  <CalloutInner>
                    Base pay: ${ BASE_PAY }<br/>
                    Per-task pay: ${ PER_TASK_PAY } (x { taskCount })<br/>
                    Per-task correct reward: ${ PER_TASK_BONUS } (x { taskCount })<br/>
                    Final bonus: ${ FINAL_BONUS } (rewarded after completing final survey)
                  </CalloutInner>
                </Callout> : null }).
            We expect each task session to take around&nbsp;
            <strong>5-7 minutes</strong> to complete. There
            are <strong>{ taskCount }</strong> of them in total.
          </p>
          <p>
            Note: You cannot participate in this study more than once. An error
            message will appear in the task if we believe you have already
            participated in this study.
          </p>
          <p>
            Once you have accepted the HIT, click on the
            &nbsp;<strong>Next</strong> button at the bottom of this page to
            continue.
          </p>
        </PageCard>
        { !canAccept ? <PageOverlay /> : null }
      </PageBody>
      <PageFooter>
          <PrimaryButton
            text = { canAccept ? 'Next' :
              'You must accept the HIT before proceeding' }
            disabled = { !canAccept }
            style = { {float: "right" } }
            onClick = { onAccept } />
      </PageFooter>
    </Page>;
  }
}
