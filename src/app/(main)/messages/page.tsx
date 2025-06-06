
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Send, Users, User, Bot } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/contexts/AuthContext";

// Mock data types
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  name: string; // e.g., "SSG Admin", "BSIT Department", "John Doe"
  type: 'user' | 'group' | 'bot'; // 'bot' for AI composer target
  lastMessage: string;
  timestamp: Date;
  unreadCount?: number;
  avatar?: string; // URL for avatar
}

const mockConversations: Conversation[] = [
  { id: 'convo1', name: 'SSG Admin', type: 'group', lastMessage: 'Meeting reminder for tomorrow.', timestamp: new Date(Date.now() - 3600000), unreadCount: 2, avatar: 'https://placehold.co/40x40.png/3F51B5/FFFFFF?text=SA' },
  { id: 'convo2', name: 'BS Information Technology', type: 'group', lastMessage: 'Please submit your project proposals.', timestamp: new Date(Date.now() - 7200000), avatar: 'https://placehold.co/40x40.png/009688/FFFFFF?text=IT' },
  { id: 'convo3', name: 'Robotics Club', type: 'group', lastMessage: 'Workshop next week!', timestamp: new Date(Date.now() - 10800000), unreadCount: 1, avatar: 'https://placehold.co/40x40.png/FFC107/000000?text=RC' },
  { id: 'convo4', name: 'Jane Doe (Student)', type: 'user', lastMessage: 'Thanks for the help!', timestamp: new Date(Date.now() - 86400000), avatar: 'https://placehold.co/40x40.png/9C27B0/FFFFFF?text=JD' },
];

const mockMessages: Record<string, Message[]> = {
  convo1: [
    { id: 'msg1', senderId: 'other', senderName: 'SSG Admin', text: 'Hello! Just a reminder about the SSG meeting tomorrow at 10 AM.', timestamp: new Date(Date.now() - 3700000), isOwn: false },
    { id: 'msg2', senderId: 'me', senderName: 'Current User', text: 'Got it, thanks for the reminder!', timestamp: new Date(Date.now() - 3650000), isOwn: true },
    { id: 'msg3', senderId: 'other', senderName: 'SSG Admin', text: 'Meeting reminder for tomorrow.', timestamp: new Date(Date.now() - 3600000), isOwn: false },
  ],
  convo2: [
    { id: 'msg4', senderId: 'other', senderName: 'BSIT Dept', text: 'Please submit your project proposals by end of week.', timestamp: new Date(Date.now() - 7200000), isOwn: false },
  ],
   convo3: [
    { id: 'msg5', senderId: 'other', senderName: 'Robotics Club', text: 'Workshop next week!', timestamp: new Date(Date.now() - 10800000), isOwn: false },
  ],
   convo4: [
    { id: 'msg6', senderId: 'other', senderName: 'Jane Doe', text: 'Thanks for the help!', timestamp: new Date(Date.now() - 86400000), isOwn: false },
  ],
};


export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(mockConversations[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedConversationId) {
      setMessages(mockMessages[selectedConversationId] || []);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversationId || !user) return;

    const message: Message = {
      id: `msg${Date.now()}`,
      senderId: user.id,
      senderName: user.fullName,
      text: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };
    
    setMessages(prev => [...prev, message]);
    // Also update mockMessages for persistence in this demo
    mockMessages[selectedConversationId] = [...(mockMessages[selectedConversationId] || []), message];
    // Update last message in conversation list (mock)
    const convoIndex = mockConversations.findIndex(c => c.id === selectedConversationId);
    if (convoIndex !== -1) {
      mockConversations[convoIndex].lastMessage = newMessage;
      mockConversations[convoIndex].timestamp = new Date();
    }

    setNewMessage('');
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 0 || names[0] === "") return "?";
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const selectedConversation = mockConversations.find(c => c.id === selectedConversationId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:flex-row rounded-lg border bg-card text-card-foreground shadow-lg">
      {/* Conversation List Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="text-primary"/> Chats
          </h2>
          <Input placeholder="Search chats..." className="mt-2" />
        </div>
        <ScrollArea className="h-[calc(100vh-16rem)] md:h-full">
          {mockConversations.map(convo => (
            <div
              key={convo.id}
              className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${selectedConversationId === convo.id ? 'bg-muted' : ''}`}
              onClick={() => setSelectedConversationId(convo.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={convo.avatar} alt={convo.name} data-ai-hint="avatar chat" />
                  <AvatarFallback className={ convo.type === 'group' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}>
                    {convo.type === 'group' ? <Users size={18} /> : convo.type === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate">{convo.name}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {convo.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                    {convo.unreadCount && convo.unreadCount > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-card">
               <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} data-ai-hint="avatar chat" />
                  <AvatarFallback className={ selectedConversation.type === 'group' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}>
                    {selectedConversation.type === 'group' ? <Users size={18} /> : selectedConversation.type === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </AvatarFallback>
                </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{selectedConversation.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.type === 'group' ? 'Group Chat' : 'Direct Message'}
                </p>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                    {!msg.isOwn && <p className="text-xs font-semibold mb-1">{msg.senderName}</p>}
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-200' : 'text-muted-foreground'} text-right`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-card flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare size={64} className="mb-4" />
            <p className="text-lg">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
