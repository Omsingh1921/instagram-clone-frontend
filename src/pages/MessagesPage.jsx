import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  Edit,
  ArrowLeft,
  MessageSquare,
  Search,
  User,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import chatService from '../services/chat.service';
import userService from '../services/user.service';
import stompClient from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils';
import './MessagesPage.css';

export const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  // New Chat Modal
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const { user: currentUser } = useAuth();
  const { showError } = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const currentUserId = currentUser?.id || currentUser?.userId;
  const currentUsername = currentUser?.username;

  // Helper to identify if a message is from the current user
  const isMyMessage = useCallback(
    (msg) => {
      if (!msg) return false;
      const senderId = msg.sender?.id || msg.sender?.userId;
      const senderUsername = msg.sender?.username;

      if (currentUserId && senderId && currentUserId === senderId) return true;
      if (currentUsername && senderUsername && currentUsername === senderUsername) return true;
      return false;
    },
    [currentUserId, currentUsername]
  );

  // Helper to get other member in conversation
  const getOtherMember = useCallback(
    (conv) => {
      if (!conv) return {};
      const members = conv?.members || [];
      const other = members.find((m) => {
        const mId = m.id || m.userId;
        if (mId && currentUserId) return mId !== currentUserId;
        if (m.username && currentUsername) return m.username !== currentUsername;
        return false;
      });
      return other || members[0] || {};
    },
    [currentUserId, currentUsername]
  );

  // Load conversations
  const loadConversations = useCallback(
    async (preferredConvId) => {
      try {
        setLoadingConvs(true);
        const res = await chatService.getConversations(0, 30);
        const list = res?.data?.content || res?.content || res?.data || [];
        setConversations(list);

        const targetId = preferredConvId || location.state?.conversationId;
        if (targetId) {
          const found = list.find((c) => c.id === targetId);
          if (found) {
            setActiveConversation(found);
          } else {
            try {
              const singleRes = await chatService.getConversationById(targetId);
              const singleConv = singleRes?.data || singleRes;
              if (singleConv?.id) {
                setActiveConversation(singleConv);
              }
            } catch {
              // Ignore single conversation load error
            }
          }
        }
      } catch {
        setConversations([]);
      } finally {
        setLoadingConvs(false);
      }
    },
    [location.state?.conversationId]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Connect STOMP WebSocket
  useEffect(() => {
    stompClient.connect();
    return () => {
      // Keep persistent connection
    };
  }, []);

  // Load messages & subscribe when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const convId = activeConversation.id;

    const loadMessages = async () => {
      try {
        setLoadingMsgs(true);
        const res = await chatService.getMessages(convId, 0, 50);
        const list = res?.data?.content || res?.content || res?.data || [];
        // Backend returns newest first (DESC). Reverse to render chronologically (oldest top, newest bottom).
        setMessages([...list].reverse());

        // Mark conversation as read on server
        await chatService.markAsRead(convId).catch(() => {});

        // Broadcast read receipt to the other member over WebSocket
        stompClient.send(`/topic/conversations/${convId}`, {
          type: 'READ_RECEIPT',
          conversationId: convId,
          readerId: currentUserId,
          readerUsername: currentUsername,
          readAt: new Date().toISOString(),
        });

        // Clear unread indicator locally
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        showError(err.message || 'Failed to load messages');
      } finally {
        setLoadingMsgs(false);
      }
    };

    loadMessages();

    // Subscribe to live messages and read receipts for this conversation
    const unsubscribe = stompClient.subscribe(
      `/topic/conversations/${convId}`,
      (incomingMsg) => {
        if (!incomingMsg) return;

        // Handle real-time read receipts from the other user
        if (incomingMsg.type === 'READ_RECEIPT') {
          const readerId = incomingMsg.readerId;
          const readerUsername = incomingMsg.readerUsername;

          // If the reader is NOT the current user, it means the recipient read our messages!
          if (
            (readerId && readerId !== currentUserId) ||
            (readerUsername && readerUsername !== currentUsername)
          ) {
            setMessages((prev) =>
              prev.map((m) =>
                isMyMessage(m) ? { ...m, isSeen: true, status: 'delivered' } : m
              )
            );
          }
          return;
        }

        if (!incomingMsg.id) return;

        const fromOther = !isMyMessage(incomingMsg);

        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          // If the other user sent a message, all our previous messages are now seen
          const updated = prev.map((m) =>
            isMyMessage(m) ? { ...m, isSeen: true, status: 'delivered' } : m
          );
          return [...updated, incomingMsg];
        });

        // If message is from other user and we are currently viewing this chat, acknowledge read receipt
        if (fromOther) {
          chatService.markAsRead(convId).catch(() => {});
          stompClient.send(`/topic/conversations/${convId}`, {
            type: 'READ_RECEIPT',
            conversationId: convId,
            readerId: currentUserId,
            readerUsername: currentUsername,
            readAt: new Date().toISOString(),
          });
        }

        // Update conversation last message in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: incomingMsg,
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation, showError, isMyMessage, currentUserId, currentUsername]);

  // Auto-scroll to bottom on message stream changes
  useEffect(() => {
    if (messages.length > 0 && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || sending) return;

    const content = inputText.trim();
    setInputText('');

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg = {
      id: tempId,
      content,
      messageType: 'TEXT',
      sender: {
        id: currentUserId,
        userId: currentUserId,
        username: currentUsername,
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      isSeen: false,
    };

    // Optimistically show message immediately
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      setSending(true);
      const res = await chatService.sendMessage(activeConversation.id, {
        content,
        messageType: 'TEXT',
      });
      const sentMsg = res?.data || res;

      // Mark message as confirmed/sent (SINGLE RIGHT TICK ?).
      // Will ONLY become double tick (??) when recipient actually views or replies!
      const confirmedMsg = { ...sentMsg, status: 'sent', isSeen: false };

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? confirmedMsg : m))
      );

      // Update conversations sidebar last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                lastMessage: confirmedMsg,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      showError(err.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(content);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Search users for new chat modal
  useEffect(() => {
    if (!newChatModalOpen) return;
    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const res = await userService.searchUsers(userSearchTerm, 0, 10);
        const list = res?.data?.content || res?.content || res?.data || [];
        setSearchResults(
          list.filter((u) => {
            const uid = u.id || u.userId;
            return uid !== currentUserId;
          })
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [userSearchTerm, newChatModalOpen, currentUserId]);

  // Start chat with user
  const handleStartChatWithUser = async (targetUser) => {
    const targetId = targetUser?.id || targetUser?.userId;
    if (!targetId) return;

    try {
      const res = await chatService.getOrCreateDirectConversation(targetId);
      const conv = res?.data || res;
      setNewChatModalOpen(false);
      setUserSearchTerm('');
      await loadConversations(conv.id);
      setActiveConversation(conv);
    } catch (err) {
      showError(err.message || 'Failed to create conversation');
    }
  };

  const otherMember = activeConversation ? getOtherMember(activeConversation) : null;

  // Find index of latest message received from other party
  const lastTheirsIndex = messages.map((m) => !isMyMessage(m)).lastIndexOf(true);

  // Determine whether message should display double checkmark (double right)
  const isDoubleRight = (msg, index) => {
    if (msg.status === 'sending') return false;
    // Explicitly verified seen by recipient (via real-time read receipt)
    if (msg.isSeen === true || msg.status === 'delivered') return true;
    // Recipient sent a message at or after this message
    if (lastTheirsIndex !== -1 && index <= lastTheirsIndex) return true;
    // Recipient has not viewed yet -> SINGLE RIGHT TICK
    return false;
  };

  return (
    <div className="messages-page-layout">
      {/* Conversations Column */}
      <aside
        className={`conversations-sidebar ${activeConversation ? 'hidden-mobile' : ''}`}
      >
        <div className="conversations-header">
          <span className="conversations-username">{currentUser?.username}</span>
          <button
            type="button"
            className="new-msg-btn"
            onClick={() => setNewChatModalOpen(true)}
            title="New message"
            aria-label="New message"
          >
            <Edit size={20} />
          </button>
        </div>

        <div className="conversations-list-stream">
          {loadingConvs ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <LoadingSpinner size="md" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="conversations-empty-msg">
              No messages yet. Send a direct message to a friend.
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherMember(conv);
              const isActive = activeConversation?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  type="button"
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveConversation(conv)}
                >
                  <Avatar
                    src={other.avatarUrl || other.profilePictureUrl}
                    alt={other.displayName || other.username || 'User'}
                    size="md"
                  />
                  <div className="conversation-meta-box">
                    <span className="conversation-recipient-name">
                      {other.displayName || other.username || 'User'}
                    </span>
                    <span className="conversation-last-msg">
                      {conv.lastMessage?.content || 'Started a conversation'}
                    </span>
                  </div>
                  {conv.unreadCount > 0 && <div className="conversation-unread-dot" />}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat Thread Column */}
      <section
        className={`chat-window ${!activeConversation ? 'hidden-mobile' : ''}`}
      >
        {!activeConversation ? (
          <div className="chat-empty-selection">
            <div className="chat-empty-icon-circle">
              <MessageSquare size={44} />
            </div>
            <h2>Your Messages</h2>
            <p>Send private photos and messages to a friend or group.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setNewChatModalOpen(true)}
            >
              Send Message
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => setActiveConversation(null)}
                  aria-label="Back to conversations"
                  title="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div
                  className="chat-recipient-info"
                  onClick={() => {
                    const targetId = otherMember?.id || otherMember?.userId;
                    if (targetId) navigate(`/profile/${targetId}`);
                  }}
                >
                  <Avatar
                    src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
                    alt={otherMember?.username || 'User'}
                    size="sm"
                  />
                  <div className="chat-recipient-names">
                    <span className="chat-recipient-username">
                      {otherMember?.username || 'User'}
                    </span>
                    {otherMember?.displayName && (
                      <span className="chat-recipient-display">
                        {otherMember.displayName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="chat-messages-container">
              {loadingMsgs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <LoadingSpinner size="md" />
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-thread">
                  <Avatar
                    src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
                    alt={otherMember?.username || 'User'}
                    size="lg"
                  />
                  <h3>{otherMember?.displayName || otherMember?.username}</h3>
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const mine = isMyMessage(msg);
                  const doubleRight = mine && isDoubleRight(msg, index);
                  const isSending = mine && msg.status === 'sending';

                  return (
                    <div
                      key={msg.id}
                      className={`message-bubble-row ${mine ? 'mine' : 'theirs'}`}
                    >
                      <div className={`message-bubble ${mine ? 'mine' : 'theirs'}`}>
                        <div className="message-content-text">{msg.content}</div>
                        <span className="message-time">
                          <span>{msg.createdAt ? timeAgo(msg.createdAt) : 'Just now'}</span>
                          {mine && (
                            <span
                              className="message-status-indicator"
                              title={isSending ? 'Sending...' : doubleRight ? 'Seen' : 'Sent'}
                              aria-label={isSending ? 'Sending' : doubleRight ? 'Seen' : 'Sent'}
                            >
                              {isSending ? (
                                <Clock size={11} className="status-clock" />
                              ) : doubleRight ? (
                                <CheckCheck size={13} className="status-check-double" />
                              ) : (
                                <Check size={13} className="status-check-single" />
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <input
                ref={inputRef}
                type="text"
                className="chat-input-box"
                placeholder="Message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={2000}
                autoFocus
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!inputText.trim() || sending}
                aria-label="Send message"
                title="Send"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </section>

      {/* New Chat Modal */}
      <Modal
        isOpen={newChatModalOpen}
        onClose={() => {
          setNewChatModalOpen(false);
          setUserSearchTerm('');
        }}
        title="New message"
        size="sm"
      >
        <div className="new-chat-dialog-content">
          <div className="new-chat-search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search people..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="new-chat-search-input"
              autoFocus
            />
          </div>

          <div className="new-chat-results-list">
            {searchingUsers ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="new-chat-no-results">
                {userSearchTerm ? 'No account found.' : 'Search for a user to message.'}
              </div>
            ) : (
              searchResults.map((target) => (
                <div
                  key={target.id || target.userId}
                  className="new-chat-user-item"
                  onClick={() => handleStartChatWithUser(target)}
                >
                  <Avatar
                    src={target.avatarUrl || target.profilePictureUrl}
                    alt={target.username}
                    size="md"
                  />
                  <div className="new-chat-user-meta">
                    <span className="new-chat-username">{target.username}</span>
                    {target.displayName && (
                      <span className="new-chat-display-name">{target.displayName}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessagesPage;
