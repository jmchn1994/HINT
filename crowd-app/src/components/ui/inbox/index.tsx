import React from 'react';
import styled from 'styled-components';
import { Dialog,
  DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton,
  DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { FontIcon } from 'office-ui-fabric-react/lib/Icon';
import { mergeStyles } from 'office-ui-fabric-react/lib/Styling';

import { MapStoreView } from '../../../store/local-backed-storage';
import { ActionStatus, TagStatus } from './mail-status';
import { SearchEngine, Highlighter } from '../../smart/search-engine';
import { CommitmentEngine } from '../../smart/commitment-engine';
import { InboxPreview } from './preview';
import { MessageList,
  MessageListHeader,
  MessageListBody,
  MessageListItem,
  MessageListPlaceholder } from './message-list';
import { LOCALE_LONG_TIME } from '../refs/locale';

import { Email } from '../../../models/email';

// Define icons stuff
const iconClass = mergeStyles({
  margin: '0 4px',
});

export type TagAction = 'tag-event';
export type MailAction = 'delete' | 'archive' | 'flag';
export type InboxAction = TagAction | MailAction;

type InboxTab = 'inbox' | 'events' | 'search';

const InboxWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #f3f2f1;
  font-family: "Segoe UI", "Segoe UI Web (West European)", "Segoe UI",
    -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
`;
const InboxArea = styled.div<{showTopBar?:boolean}>`
  position: absolute;
  top: ${props => props.showTopBar ? '44px' : '0'};
  left: 0;
  right: 0;
  bottom: 0;
`;
const TabWrapper = styled.div<{active?:boolean}>`
  float: left;
  padding: 0 8px;
  margin-left: 2px;
  margin-right: 8px;
  border-bottom: 4px solid ${props => props.active ? '#0062AD' : 'transparent'};
  cursor: pointer;
  user-select: none;
  &:hover {
    background-color: #edebe9;
  }
`;

const SearchWrapper = styled.div`
  float: right;
  width: 50%;
`;

const EmailPreviewPlaceholder = styled.div`
  position: absolute;
  padding: 60px 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 68%;
  background-color: #faf9f8;
  font-family: "Calibri",sans-serif;
  line-height: 100%;
  text-align: center;
  user-select: none;
`;
const TopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
`;
const TopBarButtonBase = styled.div`
  margin: 6px 2px;
  padding: 0 4px;
  height: 32px;
  line-height: 30px;
  font-size: 14px;
  float: left;
  cursor: pointer;
  user-select: none;
  color: #0078d4;
  border-radius: 4px;
  &:hover {
    background-color: #edebe9;
  }
`;
/**
  'tag-green' = '#47d041'
  'tag-orange' = '#ff8c00'
**/
const TopBarButton = styled(TopBarButtonBase)<{action:InboxAction,active:boolean}>`
  border: 1px solid ${ props => {
    return props.active ? '#0078d4' : 'transparent';
  }};
  & > * {
    color: ${ props => {
      return (props.action === 'tag-event' ? '#e74856' : '#0078d4');
    }};
  };
`
const TopBarCalendarArea = styled.div`
  margin-right: 20px;
  float: right;
`;
const EventWrapper = styled.div`
  color: #0078d4;
  line-height: 32px;
  margin-top: 5px;
`;

interface InboxProps {
  id?:string;

  store?:MapStoreView;
  searchProvider?:SearchEngine;
  commitmentProvider?:CommitmentEngine;

  style?:React.CSSProperties;
  showToolbar?:boolean;

  debug?:boolean;

  defaultMessage?:number;

  messages:Email[];
  actions:InboxAction[];

  refTime?:Date;

  onEvent?:(eventName:string,eventData?:any) => void;
}

interface InboxState {
  currentEmail?:number;
  readStatus:boolean[];
  tagStatus:TagStatus[];
  actionStatus:ActionStatus[];
  listOrder:number[];
  activeTab:InboxTab;
  errorMessage?:string;
  highlighter?:Highlighter;
}

export class Inbox extends React.Component<InboxProps, InboxState> {
  constructor(props:InboxProps) {
    super(props);
    const { store, defaultMessage, messages } = props;

    const readDefaults = messages.map((m) => m.read),
      tagDefaults = messages.map((_) => {
        return {event: false}
      }),
      actionDefaults =  messages.map(() => {
        return {deleted: false, archived: false, flagged: false};
      }),
      viewOrderDefaults = messages.map((_, i) => i);

    const defaultEmail:number|undefined = (defaultMessage !== undefined &&
      defaultMessage < messages.length) ? defaultMessage : undefined;

    let currentEmail = store ? store.get('currentEmail', null) : null;
    this.state = {
      currentEmail: currentEmail === null ? defaultEmail : currentEmail,
      readStatus: store ?
        store.get('readStatus', readDefaults) : readDefaults,
      tagStatus: store ?
        store.get('tagStatus', tagDefaults) : tagDefaults,
      actionStatus: store ?
        store.get('actionStatus', actionDefaults) : actionDefaults,
      listOrder: viewOrderDefaults,
      activeTab: 'inbox',
    };
  }

  private emitEvent(eventName:string, data?:any) {
    const { onEvent } = this.props;
    if (onEvent) {
      onEvent(eventName, data);
    }
  }

  toggleTab(tab:InboxTab) {
    const { currentEmail, activeTab, tagStatus } = this.state;
    const { commitmentProvider, messages } = this.props;
    if (tab === activeTab) {
      return; // Nothing to do!
    }
    this.emitEvent('toggle-tab', {
      'tab': tab
    });
    if (tab === 'events' && commitmentProvider !== undefined) {
      const items = messages.map((_m, id) => {
        return tagStatus[id].event ?
          id : null;
      }).filter((id) => {
        return id !== null;
      }) as number[];
      if (currentEmail === undefined || items.indexOf(currentEmail) >= 0) {
        this.setState({
          'listOrder': items,
          'activeTab': 'events'
        });
      } else {
        this.setState({
          'listOrder': items,
          'currentEmail': undefined,
          'activeTab': 'events'
        });
      }
    } else {
      this.setState({
        'listOrder': messages.map((_, id) => id),
        'activeTab': 'inbox'
      });
    }
  }

  doSearch(searchQuery:string, quick:boolean = false) {
    const { searchProvider } = this.props;
    const { currentEmail } = this.state;
    if (searchProvider !== undefined) {
      this.emitEvent('search-init', {
        'query': searchQuery
      });
      const { results, searched } = searchProvider.search(searchQuery, quick);
      this.setState({
          'listOrder': results,
          'activeTab': searched ? 'search' : 'inbox',
          'highlighter': searched ?
            searchProvider.createHighlighter(searchQuery) : undefined,
          'currentEmail':
            currentEmail === undefined || results.indexOf(currentEmail) >= 0 ?
              currentEmail : undefined
      }, () => {
        this.emitEvent('search-resp', {
          'query': searchQuery,
          's': searchProvider.summarize(results)
        });
      });
    }
  }

  doAction(action:InboxAction, messageId:number, source?:string) {
    const { messages } = this.props;
    const { tagStatus, actionStatus } = this.state;
    const message = messages[messageId];
    this.emitEvent(action, {
      'source': source,
      'message': message.id
    });
    if (action.startsWith('tag-')) {
      this.setState({
        tagStatus: tagStatus.map((item, i) => {
          return i === messageId ? {
            event: action === 'tag-event' ? !item.event : item.event,
          } : item;
        }),
      }, () => {
        const { store } = this.props;
        if (store) {
          store.set('tagStatus', this.state.tagStatus);
        }
        this.emitEvent('tag-status-change', {
          'message': message.id,
          'action': action,
          'tagStatus': tagStatus[messageId]
        });
      });
    } else {
      this.setState({
        actionStatus: actionStatus.map((item, i) => {
          return i === messageId ? {
            deleted: action === 'delete' ? !item.deleted : item.deleted,
            archived: action === 'archive' ? !item.archived : item.archived,
            flagged: action === 'flag' ? !item.flagged : item.flagged
          } : item;
        })
      }, () => {
        const { store } = this.props;
        if (store) {
          store.set('actionStatus', this.state.actionStatus);
        }
        this.emitEvent('action-status-change', {
          'message': message.id,
          'action': action,
          'actionStatus': actionStatus[messageId]
        });
      });
    }
  }

  render() {
    const { id, style, showToolbar } = this.props;
    return <InboxWrapper style = { style }>
      { showToolbar ? this.renderTopBar() : null }
      <InboxArea id = { id } showTopBar = { showToolbar } >
        { this.renderMessageList() }
        { this.renderPreview() }
      </InboxArea>
      { this.renderErrorDlg() }
    </InboxWrapper>
  }

  private dismissError() {
    this.setState({errorMessage: undefined});
  }

  private renderErrorDlg() {
    const { errorMessage } = this.state;
    return <Dialog
        hidden = { errorMessage === undefined }
        onDismiss = { this.dismissError.bind(this) }
        dialogContentProps = {{
          type: DialogType.normal,
          title: 'Notice',
          closeButtonAriaLabel: 'Close',
          subText: errorMessage,
        }}>
      <DialogFooter>
        <PrimaryButton text='OK'
          onClick = { this.dismissError.bind(this) }/>
      </DialogFooter>
    </Dialog>;
  }

  private renderTopBarButton(action:InboxAction) {
    const { currentEmail, tagStatus, actionStatus } = this.state;
    const iconName =
      (action === 'tag-event') ? 'Tag' :
      (action === 'delete' ? 'Delete' :
      (action === 'archive' ? 'Archive' : 'Flag'));
    const iconText =
      (action === 'tag-event' ? 'Tag as event' :
      (action === 'delete' ? 'Delete' :
      (action === 'archive' ? 'Archive' : 'Flag Message')));
    const buttonActive = currentEmail !== undefined &&
      (action === 'tag-event' ? tagStatus[currentEmail].event :
        (action === 'flag' ? actionStatus[currentEmail].flagged : false));
    return <TopBarButton
      key = { action }
      id = { 'top-bar-btn-' + action }
      action = { action }
      active = { buttonActive }
      onClick = { () => {
        if (currentEmail !== undefined) {
          this.doAction(action, currentEmail, 'top');
        } else {
          this.setState({
            errorMessage: 'You didn\'t select an email to perform this action on'
          })
        }
      } }>
      <FontIcon iconName = { iconName } className={ iconClass }/>
      { iconText }
    </TopBarButton>;
  }

  private renderTopBarCommitment() {
    const { commitmentProvider, messages, refTime } = this.props;
    if (commitmentProvider === undefined) {
      return null; // No calendar
    }
    const commitment = commitmentProvider.findPriority(messages,
      refTime !== undefined ? refTime : new Date());
    if (commitment !== undefined) {
      return <TopBarCalendarArea>
          <TopBarButtonBase
            onClick = { () => {
              this.setState({
                currentEmail: commitment.index
              }, () => {
                this.emitEvent('click-calendar', {
                  'target': commitment.index
                })
              });
            } }>
            <FontIcon iconName = 'Event' className={ iconClass }/>
            { commitment.commitment.name }&nbsp;
            ({ commitment.commitment.time !== undefined ?
                commitment.commitment.time.toLocaleString(
                  undefined, LOCALE_LONG_TIME) :
                'Time unknown' })
          </TopBarButtonBase>
        </TopBarCalendarArea>;
    }
  }

  private renderTopBar() {
    const { actions } = this.props;
    return <TopBar>
      { actions.map((a) => {
        return this.renderTopBarButton(a);
      }) }
      { this.renderTopBarCommitment() }
    </TopBar>;
  }

  private renderSearchBar() {
    const { searchProvider, id } = this.props;
    if (searchProvider === undefined) {
      return null;
    }
    return <SearchWrapper id = { id ? (id + '-search') : undefined }>
      <SearchBox
        placeholder = "Search"
        onSearch = { (query) => {
          this.doSearch(query);
        } }
        onChange = { (query) => {
          this.doSearch(query);
        }} />
    </SearchWrapper>;
  }

  private renderMessageListTabs() {
    const { commitmentProvider } = this.props;
    const { activeTab, tagStatus } = this.state;
    const eventCount = tagStatus.filter((t) => t.event).length;
    if (commitmentProvider !== undefined) {
      return [
        <TabWrapper
          key = 'tab-inbox'
          active = { activeTab === 'inbox' || activeTab === 'search'}
          onClick = { () => this.toggleTab('inbox') }>

          { activeTab === 'search' ? 'Search' : 'Inbox' }
        </TabWrapper>,
        <TabWrapper
          key = 'tab-events'
          active = { activeTab === 'events' }
          onClick = { () => this.toggleTab('events') } >

          My Events { eventCount > 0 ? '(' + eventCount + ')' : '' }
        </TabWrapper>
      ];
    } else {
      return <TabWrapper active = { true }>
          { activeTab === 'search' ? 'Search' : 'Inbox'}
        </TabWrapper>;
    }
  }

  private renderMessageList() {
    const { messages, commitmentProvider, id, debug } = this.props;
    const { currentEmail,
      highlighter,
      listOrder,
      readStatus,
      tagStatus,
      actionStatus } = this.state;
    const list = listOrder.map((messageIndex) => {
      const message = messages[messageIndex];
      return <MessageListItem
        key = { message.id }
        email = { message }
        onClick = { () => {
          this.setState({
            currentEmail: messageIndex,
            readStatus: readStatus.map((item, i) => {
              return i !== messageIndex ? item : true;
            })
          }, () => {
            const { store } = this.props;
            if (store) {
              if (this.state.currentEmail !== undefined) {
                store.set('currentEmail', this.state.currentEmail);
              } else {
                store.remove('currentEmail');
              }
              store.set('readStatus', this.state.readStatus);
            }
            this.emitEvent('view-message', {
              'message': message.id,
              'readStatus': readStatus[messageIndex]
            });
          });
        } }
        highlighter = { highlighter }
        tagStatus = { tagStatus[messageIndex] }
        actionStatus = { actionStatus[messageIndex] }
        smartStatus = { {
            commitmentStatus: commitmentProvider?.extract(message)?.status
          } }
        isSelected = { currentEmail === messageIndex }
        isRead = { this.state.readStatus[messageIndex] }>
          { debug ? message.id : null }
          { commitmentProvider?.extract(message) !== undefined ?
              <EventWrapper>
                { debug ? (
                  commitmentProvider?.extract(message)?.flagged ? '!' : '') :
                  null}
                Event: { commitmentProvider?.extract(message)?.name}
                { tagStatus[messageIndex].event ? null :
                    <DefaultButton text="Add Event"
                      style = {{float:"right"}}
                      onClick = { () => {
                        this.doAction('tag-event', messageIndex, 'ai');
                      } }/>
                }
              </EventWrapper>
            : null}
        </MessageListItem>
    });
    return <MessageList id = { id ? (id + '-message-list') : undefined }>
      <MessageListHeader>
        { this.renderMessageListTabs() }
        { this.renderSearchBar() }
      </MessageListHeader>
      <MessageListBody>
      { listOrder.length > 0 ? list : <MessageListPlaceholder>
          There are no emails to show.
        </MessageListPlaceholder>}
      </MessageListBody>
    </MessageList>;
  }

  private renderPreview() {
    const { messages, actions, commitmentProvider, id } = this.props;
    const { currentEmail, tagStatus, actionStatus, highlighter } = this.state;
    if (typeof currentEmail === 'undefined') {
      return <EmailPreviewPlaceholder
        id = { id ? id + '-preview' : undefined }>
          Please select an email in the inbox to view its contents
        </EmailPreviewPlaceholder>;
    } else {
      const message = messages[currentEmail];
      return <InboxPreview
        id = { id ? id + '-preview' : undefined }
        email = { message }
        actions = { actions }
        tagStatus = { tagStatus[currentEmail] }
        actionStatus = { actionStatus[currentEmail] }
        smartStatus = { {
            commitmentStatus: commitmentProvider?.extract(message)?.status
          } }
        highlighter = { highlighter }
        onAction = { (action) => {
          this.doAction(action, currentEmail, 'preview');
        } }
        onInteract = { (spanId) => {
          this.emitEvent('body-interact', {
            'message': message.id,
            'spanId': spanId
          });
        } } />;
    }
  }
}
