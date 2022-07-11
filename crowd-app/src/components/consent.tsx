import React from 'react';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react';

import { getTotalPay } from '../const';
import { Page, PageBody, PageCard, PageFooter } from './common';

interface Props {
  taskCount:number;
  onAccept:()=>void;
  onReject:()=>void;
}

export default class Consent extends React.Component<Props> {

  private downloadLink() {
    return <Link
      onClick = { (e) => {
        e.preventDefault();
        const form = document.getElementById('consent-form');
        if (form === null) {
          alert('Download trigger failed. ' +
            'Please copy page contents and save for your own records.');
          return;
        }
        const tempLink = document.createElement('a');
        tempLink.setAttribute('href', 'data:text/plain;charset=utf-8,' +
          encodeURIComponent(form.innerText));
        tempLink.setAttribute('download', 'consent.txt');
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
      } }>link</Link>;
  }

  render() {
    const { onAccept, onReject, taskCount } = this.props;
    return <Page>
      <PageBody footer = { true } >
        <PageCard id="consent-form">
          <h1>Microsoft Research Project Participation Consent Form</h1>
          <h2>INTRODUCTION</h2>
          <p>Thank you for taking the time to consider volunteering in a
          Microsoft Corporation research project.  This form explains what
          would happen if you join this research project. Please read it
          carefully and take as much time as you need. Email the study team
          to ask about anything that is not clear.<br/>
          Participation in this study is voluntary and you may withdraw at
          any time.
          </p>
          <h2>TITLE OF RESEARCH PROJECT</h2>
          <p>
          Measure longitudinal performance of Human-AI interactive systems
          </p>
          <p><strong>Principal Investigator: Quanze Chen</strong></p>
          <h2>PURPOSE</h2>
          <p>The purpose of this project is to measure over-time human-reported
          quality of an adaptive Human-AI collaborative email management system
          under different longitudinal behavior scenarios of the AI.</p>
          <h2>PROCEDURES</h2>
          <p>During this project, the following will happen:
          At the start there will be a brief training session on using the
          email management interface. You will then be engaged in a series of
          up to 8 task sessions involving processing (finding, responding to,
            forwarding etc.) email with the aid of an AI system. After each
          task, you will be asked a small group of questions about your
          experience of the AI system and satisfaction on the completion of
          the task.
          <br/>
          While you are completing each task, we will also collect timestamped
          digital trace data of your interaction with the task interface in
          the background, such as button clicks, text typed into entry areas
          (search queries, responses to emails), and keyboard interactions with
          the AI system (tab, enter, arrow keys etc.).
          <br/>
          The emails used will be drawn from public datasets and artificial
          messages synthesized by the researchers. <br/>
          We expect each session to take about 5-7 minutes to complete.
          </p>
          <h2>PERSONAL INFORMATION</h2>
          <p>Aside from your Mechanical Turk ID, no personal information will
          be collected during this study. Your Mechanical Turk ID will not be
          shared outside of Microsoft Research and will be promptly deleted
          after compensation has been successfully provided (30 days or less).
          </p>
          <ul>
            <li>Microsoft Research is ultimately responsible for determining
            the purposes and uses of your personal information. </li>
            <li><strong>Personal information we collect. </strong>During the
            project no personal information aside from your Mechanical Turk
            ID will be collected.<br/>
            Your study information will be stored for a period of up to
            30 days.</li>
            <li>How you can access and control your information. If you wish
            to review or copy any personal information you provided during
            the study, or if you want us to delete or correct any such data,
            email your request within 30 days to the research team at:&nbsp;
            <Link href="mailto:hai-testing-2020@microsoft.com">
            hai-testing-2020@microsoft.com</Link>.
            <br/>
            Once your Mechanical Turk ID is disassociated from your responses
            we may not be able to remove your data from the study without
            re-identifying you.</li>
          </ul>
          <p>
            For additional information or concerns about how Microsoft handles
            your personal information, please see the Microsoft Privacy
            Statement (
              <Link href="https://privacy.microsoft.com/en-us/privacystatement">
              https://privacy.microsoft.com/en-us/privacystatement</Link>).
          </p>
          <h2>BENEFITS AND RISKS</h2>
          <p><strong>Benefits</strong>:
          There are no direct benefits to you that might reasonably be expected
          as a result of being in this study. The research team expects to
          gain a better understanding of longitudinal experiences in Human-AI
          collaborative systems, as well as any public benefit that may come
          these Research Results being shared with the greater scientific
          community.
          </p>
          <p><strong>Risks</strong>: There are no anticipated, foreseeable
          risks or discomforts to you as a result of being in this study.
          </p>
          <h2>FUTURE USE OF YOUR IDENTIFIABLE INFORMATION</h2>
          <p>Your Mechanical Turk identifiers will be removed from the study
          data, and after such removal, the study data could be used for future
           research studies or distributed to another investigator for future
           research studies without your (or your legally authorized
             representative’s) additional informed consent.</p>
          <h2>PAYMENT FOR PARTICIPATION</h2>
          <p>You will receive a payment based on your completion of the HIT,
          up to a total of ${ getTotalPay(taskCount) } for completing all tasks.
          Payment will be made through the Mechanical Turk platform.</p>
          <p>
          Your data may be used to make new products, tests or findings. These
          may have value and may be developed and owned by Microsoft and/or
          others. If this happens, there are no plans to pay you.
          </p>
          <h2>CONTACT INFORMATION</h2>
          <p>Should you have any questions concerning this project, or if you
          are injured as a result of being in this study, please contact us at
          &nbsp;
          <Link href="mailto:hai-testing-2020@microsoft.com">
          hai-testing-2020@microsoft.com</Link>.<br/>
          Should you have any questions about your rights as a research subject,
          please contact Microsoft Research Ethics Program Feedback at &nbsp;
          <Link href="mailto:MSRStudyfeedback@microsoft.com">
          MSRStudyfeedback@microsoft.com</Link>.
          </p>
          <h2>CONSENT</h2>
          <p>By clicking “I agree” below, you confirm that the study was
          explained to you, you had a chance to ask questions before beginning
          the study, and all your questions were answered satisfactorily.
          By clicking “I agree” below, you voluntarily consent to participate,
          and you do not give up any legal rights you have as a study
          participant. <br/>
          You will be provided a { this.downloadLink() } to download this form.
          On behalf of Microsoft, we thank you for your contribution and look
          forward to your research session.</p>
        </PageCard>
      </PageBody>
      <PageFooter>
          <PrimaryButton text = "I agree"
            style = { {float: "left" } }
            onClick = { onAccept } />
          <DefaultButton text = "No thanks, I do not want to do this task"
            style = { {float: "right" } }
            onClick = { onReject } />
      </PageFooter>
    </Page>;
  }
}
