
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Send, Users, User, Bot } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/contexts/AuthContext";

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
  name: string; 
  type: 'user' | 'group' | 'bot';
  lastMessage: string;
  timestamp: Date;
  unreadCount?: number;
  avatar?: string; 
}

const initialConversations: Conversation[] = [];
const initialMessages: Record<string, Message[]> = {};


export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Select the first conversation by default if conversations exist
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);
  
  useEffect(() => {
    if (selectedConversationId) {
      setMessages(initialMessages[selectedConversationId] || []);
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
      senderId: user.userID, 
      senderName: user.fullName,
      text: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };
    
    setMessages(prev => [...prev, message]);
    
    const updatedConversations = conversations.map(c => {
      if (c.id === selectedConversationId) {
        return { ...c, lastMessage: newMessage, timestamp: new Date() };
      }
      return c;
    });
    setConversations(updatedConversations);
    
    if (!initialMessages[selectedConversationId]) {
        initialMessages[selectedConversationId] = [];
    }
    initialMessages[selectedConversationId].push(message);


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

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

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
          {conversations.length === 0 && (
            <p className="p-4 text-center text-muted-foreground">No conversations yet.</p>
          )}
          {conversations.map(convo => (
            <div
              key={convo.id}
              className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${selectedConversationId === convo.id ? 'bg-muted' : ''}`}
              onClick={() => setSelectedConversationId(convo.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {convo.avatar && <AvatarImage src={convo.avatar} alt={convo.name} data-ai-hint="avatar chat" />}
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
                  {selectedConversation.avatar && <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} data-ai-hint="avatar chat" />}
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
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground">No messages in this conversation yet.</p>
              )}
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
            <p className="text-lg">Select a conversation to start messaging or no conversations available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

