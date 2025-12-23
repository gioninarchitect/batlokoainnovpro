/**
 * ChatWidget - Smart AI Chat Assistant
 * Floating chat widget with full conversation support
 *
 * Features:
 * - Floating button with unread badge
 * - Full chat interface with message history
 * - Quick reply buttons
 * - Dark mode support
 * - Mobile-responsive (full-screen on mobile)
 * - Keyboard accessible
 */

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/context/ChatContext'
import { useTheme } from '@/context/ThemeContext'

// Icons as inline SVGs for zero dependencies
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
)

const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M3.75 12a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
)

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
)

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
  </svg>
)

// Message component
function ChatMessage({ message, darkMode }) {
  const isBot = message.role === 'bot'
  const isError = message.isError

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isBot
            ? isError
              ? darkMode
                ? 'bg-red-900/30 text-red-300'
                : 'bg-red-50 text-red-700'
              : darkMode
                ? 'bg-navy-light text-gray-200'
                : 'bg-gray-100 text-gray-800'
            : 'bg-safety text-white'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.responseTime && (
          <p className={`text-xs mt-1 opacity-60`}>
            {message.responseTime}ms
          </p>
        )}
      </div>
    </div>
  )
}

// Quick replies component
function QuickReplies({ replies, onSelect, darkMode }) {
  if (!replies || replies.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-3 px-1">
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onSelect(reply)}
          className={`text-sm px-3 py-1.5 rounded-full border transition-all duration-200 ${
            darkMode
              ? 'border-industrial text-industrial-light hover:bg-industrial hover:text-white'
              : 'border-industrial text-industrial hover:bg-industrial hover:text-white'
          }`}
        >
          {reply}
        </button>
      ))}
    </div>
  )
}

// Typing indicator
function TypingIndicator({ darkMode }) {
  return (
    <div className="flex justify-start mb-3">
      <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-navy-light' : 'bg-gray-100'}`}>
        <div className="flex space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// Main ChatWidget component
export default function ChatWidget() {
  const {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    unreadCount,
    isOffline,
    sendMessage,
    handleQuickReply,
    clearChat,
    toggleChat,
    minimizeChat,
    closeChat
  } = useChat()

  const { darkMode } = useTheme()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      sendMessage(inputValue)
      setInputValue('')
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeChat()
    }
  }

  // Get last bot message for quick replies
  const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot')

  return (
    <>
      {/* Floating Chat Button */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={toggleChat}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            darkMode
              ? 'bg-safety hover:bg-safety-dark focus:ring-safety'
              : 'bg-safety hover:bg-safety-dark focus:ring-safety'
          }`}
          aria-label={isMinimized ? 'Restore chat' : 'Open chat assistant'}
        >
          <ChatIcon />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-navy text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div
          className={`fixed z-50 shadow-2xl rounded-xl overflow-hidden transition-all duration-300 ${
            darkMode ? 'bg-navy border border-navy-light' : 'bg-white border border-gray-200'
          } ${
            // Mobile: full screen, Desktop: fixed size in corner
            'inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-[380px] md:h-[560px]'
          }`}
          role="dialog"
          aria-label="Chat assistant"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            darkMode ? 'bg-navy-dark border-navy-light' : 'bg-industrial text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ChatIcon />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white">Batlokoa Assistant</h3>
                <p className="text-xs text-white/70">
                  {isOffline ? 'Offline - Limited functionality' : 'Online - Ready to help'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <RefreshIcon />
              </button>
              <button
                onClick={minimizeChat}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Minimize chat"
                title="Minimize"
              >
                <MinimizeIcon />
              </button>
              <button
                onClick={closeChat}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close chat"
                title="Close"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className={`flex-1 overflow-y-auto p-4 ${
              // Calculate height: total minus header and input
              'h-[calc(100%-140px)] md:h-[calc(100%-140px)]'
            }`}
          >
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} darkMode={darkMode} />
            ))}

            {isTyping && <TypingIndicator darkMode={darkMode} />}

            {/* Quick Replies */}
            {!isTyping && lastBotMessage?.quickReplies && (
              <QuickReplies
                replies={lastBotMessage.quickReplies}
                onSelect={handleQuickReply}
                darkMode={darkMode}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className={`absolute bottom-0 left-0 right-0 p-4 border-t ${
              darkMode ? 'bg-navy border-navy-light' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-safety ${
                  darkMode
                    ? 'bg-navy-light text-white placeholder-gray-500 border border-navy-light'
                    : 'bg-white text-gray-800 placeholder-gray-400 border border-gray-300'
                }`}
                aria-label="Chat message input"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  inputValue.trim() && !isTyping
                    ? 'bg-safety text-white hover:bg-safety-dark'
                    : darkMode
                      ? 'bg-navy-light text-gray-600 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
            <p className={`text-xs text-center mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Powered by Batlokoa Smart AI
            </p>
          </form>
        </div>
      )}
    </>
  )
}
