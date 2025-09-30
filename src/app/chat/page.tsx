'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { Send, Search, Plus, MoreVertical, Phone, Video } from 'lucide-react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useChat, useSocket } from '@/components/providers/socket-provider'
import { ChatMessageSkeleton } from '@/components/ui/loading-states'

interface Chat {
  id: string
  name: string
  type: 'private' | 'group'
  participants: {
    id: string
    name: string
    image?: string
    role: string
    isOnline: boolean
    lastSeen?: string
  }[]
  lastMessage?: {
    id: string
    content: string
    senderId: string
    timestamp: string
  }
  unreadCount: number
}

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderImage?: string
  timestamp: string
  type: 'text' | 'image' | 'file'
}

export default function ChatPage() {
  const { data: session } = useSession()
  const { isConnected } = useSocket()
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null)
  const [chats, setChats] = React.useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [newMessage, setNewMessage] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  const { messages, typing, sendMessage, startTyping, stopTyping } = useChat(selectedChatId || undefined)

  // Mock data for demonstration
  const mockChats: Chat[] = [
    {
      id: 'chat1',
      name: 'Fresh Fruits Co',
      type: 'private',
      participants: [
        {
          id: 'vendor1',
          name: 'Rajesh Kumar',
          image: undefined,
          role: 'VENDOR',
          isOnline: true
        }
      ],
      lastMessage: {
        id: 'msg1',
        content: 'Your mango order is ready for pickup!',
        senderId: 'vendor1',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      unreadCount: 2
    },
    {
      id: 'chat2',
      name: 'Tech Gadgets Support',
      type: 'private',
      participants: [
        {
          id: 'vendor2',
          name: 'Priya Sharma',
          image: undefined,
          role: 'VENDOR',
          isOnline: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ],
      lastMessage: {
        id: 'msg2',
        content: 'The warranty replacement will arrive tomorrow',
        senderId: 'vendor2',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      unreadCount: 0
    },
    {
      id: 'chat3',
      name: 'Order #12345 Discussion',
      type: 'group',
      participants: [
        {
          id: 'vendor3',
          name: 'Fashion Hub',
          image: undefined,
          role: 'VENDOR',
          isOnline: true
        },
        {
          id: 'customer1',
          name: 'Amit Patel',
          image: undefined,
          role: 'CUSTOMER',
          isOnline: false,
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      ],
      lastMessage: {
        id: 'msg3',
        content: 'Size exchange processed successfully',
        senderId: 'vendor3',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      unreadCount: 1
    }
  ]

  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hi! I wanted to check about my mango order.',
      senderId: session?.user?.id || 'current-user',
      senderName: session?.user?.name || 'You',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      type: 'text'
    },
    {
      id: '2',
      content: 'Hello! Your order is ready. The mangoes are perfectly ripe and sweet.',
      senderId: 'vendor1',
      senderName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      type: 'text'
    },
    {
      id: '3',
      content: 'Great! What time can I pick them up?',
      senderId: session?.user?.id || 'current-user',
      senderName: session?.user?.name || 'You',
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      type: 'text'
    },
    {
      id: '4',
      content: 'You can pick them up anytime between 9 AM to 7 PM. We\'re located at Shop 15, Central Market.',
      senderId: 'vendor1',
      senderName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text'
    }
  ]

  React.useEffect(() => {
    // Simulate loading chats
    setTimeout(() => {
      setChats(mockChats)
      setIsLoading(false)
      if (mockChats.length > 0) {
        setSelectedChatId(mockChats[0].id)
      }
    }, 1000)
  }, [])

  const selectedChat = chats.find(chat => chat.id === selectedChatId)
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatId) return

    if (sendMessage) {
      sendMessage(newMessage, selectedChatId)
    }

    // Add to local state for immediate feedback
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: session?.user?.id || 'current-user',
      senderName: session?.user?.name || 'You',
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getOtherParticipants = (chat: Chat) => {
    return chat.participants.filter(p => p.id !== session?.user?.id)
  }

  const ChatSidebar = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3">
                <ChatMessageSkeleton />
              </div>
            ))
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No conversations found</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherParticipants = getOtherParticipants(chat)
              const isSelected = chat.id === selectedChatId

              return (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherParticipants[0]?.image} />
                      <AvatarFallback>
                        {getInitials(chat.name)}
                      </AvatarFallback>
                    </Avatar>
                    {otherParticipants[0]?.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{chat.name}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'ADMIN']}>
      <div className="container mx-auto h-[calc(100vh-4rem)] max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full py-4">
          {/* Desktop Sidebar */}
          <Card className="hidden md:flex md:col-span-1 h-full">
            <CardContent className="p-0 flex flex-col h-full">
              <ChatSidebar />
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-3 h-full flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Mobile Menu */}
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm" className="md:hidden">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-80">
                          <ChatSidebar />
                        </SheetContent>
                      </Sheet>

                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getOtherParticipants(selectedChat)[0]?.image} />
                        <AvatarFallback className="text-sm">
                          {getInitials(selectedChat.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <CardTitle className="text-base">{selectedChat.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {getOtherParticipants(selectedChat)[0]?.isOnline ? (
                            <span className="text-green-600">Online</span>
                          ) : (
                            `Last seen ${getOtherParticipants(selectedChat)[0]?.lastSeen ?
                              formatDistanceToNow(new Date(getOtherParticipants(selectedChat)[0].lastSeen!), { addSuffix: true }) :
                              'recently'}`
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {mockMessages.map((message) => {
                      const isOwnMessage = message.senderId === session?.user?.id

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwnMessage && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={message.senderImage} />
                              <AvatarFallback className="text-xs">
                                {getInitials(message.senderName)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {!isOwnMessage && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {message.senderName}
                              </p>
                            )}
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </p>
                          </div>

                          {isOwnMessage && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={session?.user?.image || ''} />
                              <AvatarFallback className="text-xs">
                                {getInitials(session?.user?.name || 'You')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                    })}

                    {/* Typing Indicator */}
                    {typing.length > 0 && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials(getOtherParticipants(selectedChat)[0]?.name || 'User')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Message Input */}
                <div className="p-4">
                  {!isConnected && (
                    <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                      Connecting to chat...
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={!isConnected}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}