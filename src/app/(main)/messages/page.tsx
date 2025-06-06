
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Send, Users, User, Bot, PlusCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import type { ConversationFirestore, MessageFirestore, UserProfile } from "@/types/user";
import { formatDistanceToNowStrict } from 'date-fns';

interface DisplayConversation extends ConversationFirestore {
  displayName: string;
  displayAvatarSeed?: string;
}

export default function MessagesPage() {
  const { 
    user, 
    allUsers,
    conversationsList, 
    currentMessagesList, 
    selectedConversationId, 
    setSelectedConversationId,
    listenForUserConversations, 
    listenForMessages, 
    sendMessageToConversation,
    findOrCreateDirectConversation
  } = useAuth();

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  // Listener for user's conversations
  useEffect(() => {
    if (user?.userID) {
      const unsubscribe = listenForUserConversations(user.userID);
      return () => unsubscribe();
    }
  }, [user, listenForUserConversations]);

  // Listener for messages in the selected conversation
  useEffect(() => {
    const unsubscribe = listenForMessages(selectedConversationId); 
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, listenForMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessagesList]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversationId || !user) return;
    
    await sendMessageToConversation(selectedConversationId, newMessage);
    setNewMessage('');
  };

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 0 || !names[0]) return "?";
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1 && names[names.length - 1]) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const handleSelectConversation = (convoId: string) => {
    setSelectedConversationId(convoId);
    setShowUserList(false); // Hide user list when a conversation is selected
  };

  const handleStartNewConversation = async (targetUserId: string) => {
    setIsCreatingConversation(true);
    const newConvoId = await findOrCreateDirectConversation(targetUserId);
    if (newConvoId) {
      setSelectedConversationId(newConvoId);
      setShowUserList(false);
    }
    setIsCreatingConversation(false);
  };

  const getConversationDisplayName = (convo: ConversationFirestore): string => {
    if (convo.type === 'group') {
      return convo.groupName || 'Group Chat';
    }
    // For direct messages
    const otherParticipantId = convo.participantUIDs.find(uid => uid !== user?.userID);
    if (otherParticipantId) {
      const participantInfo = convo.participantInfo?.[otherParticipantId];
      return participantInfo?.fullName || allUsers.find(u => u.userID === otherParticipantId)?.fullName || 'User';
    }
    return 'Conversation';
  };
  
  const getConversationAvatarSeed = (convo: ConversationFirestore): string | undefined => {
     if (convo.type === 'group') {
      return convo.groupAvatarSeed || convo.groupName;
    }
    const otherParticipantId = convo.participantUIDs.find(uid => uid !== user?.userID);
     if (otherParticipantId) {
      const participantInfo = convo.participantInfo?.[otherParticipantId];
      return participantInfo?.avatarSeed || participantInfo?.fullName || getConversationDisplayName(convo);
    }
    return getConversationDisplayName(convo);
  }

  const displayConversations: DisplayConversation[] = conversationsList.map(convo => ({
    ...convo,
    displayName: getConversationDisplayName(convo),
    displayAvatarSeed: getConversationAvatarSeed(convo),
  })).filter(convo => convo.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const potentialChatPartners = allUsers.filter(u => u.userID !== user?.userID && u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));


  return (
    <div className="flex flex-col h-full md:flex-row rounded-lg border bg-card text-card-foreground shadow-lg">
      {/* Conversation List Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="text-primary"/> Chats
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowUserList(prev => !prev)} title="Start new chat">
              <PlusCircle className="text-primary h-6 w-6"/>
            </Button>
          </div>
          <Input placeholder="Search chats or users..." className="mt-2" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <ScrollArea className="flex-1">
          {showUserList ? (
            <>
              <p className="p-2 text-sm text-muted-foreground">Select a user to start a new conversation:</p>
              {isCreatingConversation && <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>}
              {potentialChatPartners.length === 0 && !isCreatingConversation && (
                <p className="p-4 text-center text-muted-foreground">No users found matching your search.</p>
              )}
              {potentialChatPartners.map(pUser => (
                <div
                  key={pUser.userID}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50`}
                  onClick={() => handleStartNewConversation(pUser.userID)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(pUser.fullName)}`} alt={pUser.fullName} data-ai-hint="user avatar" />
                      <AvatarFallback className='bg-accent text-accent-foreground'>{getInitials(pUser.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                       <h3 className="font-semibold truncate">{pUser.fullName}</h3>
                       <p className="text-xs text-muted-foreground truncate">{pUser.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {displayConversations.length === 0 && (
                <p className="p-4 text-center text-muted-foreground">No conversations yet. Click '+' to start one.</p>
              )}
              {displayConversations.map(convo => (
                <div
                  key={convo.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${selectedConversationId === convo.id ? 'bg-muted' : ''}`}
                  onClick={() => handleSelectConversation(convo.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                       <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(convo.displayAvatarSeed || convo.displayName)}`} alt={convo.displayName} data-ai-hint="chat avatar" />
                      <AvatarFallback className={ convo.type === 'group' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}>
                        {convo.type === 'group' ? <Users size={18} /> : <User size={18} />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold truncate">{convo.displayName}</h3>
                        {convo.lastMessageTimestamp && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNowStrict(new Date(convo.lastMessageTimestamp), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessageText || 'No messages yet'}</p>
                        {/* Unread count UI can be added here later */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversationId && conversationsList.find(c=>c.id === selectedConversationId) ? (
          <>
            {(() => {
                const currentConvo = conversationsList.find(c => c.id === selectedConversationId) as DisplayConversation; // Already mapped
                if (!currentConvo) return null; // Should not happen if selectedConversationId is valid
                return (
                    <div className="p-4 border-b flex items-center gap-3 bg-card">
                       <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(currentConvo.displayAvatarSeed || currentConvo.displayName)}`} alt={currentConvo.displayName} data-ai-hint="chat avatar" />
                          <AvatarFallback className={ currentConvo.type === 'group' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}>
                            {currentConvo.type === 'group' ? <Users size={18} /> : <User size={18} />}
                          </AvatarFallback>
                        </Avatar>
                      <div>
                        <h2 className="text-lg font-semibold">{currentConvo.displayName}</h2>
                        <p className="text-xs text-muted-foreground">
                          {currentConvo.type === 'group' ? 'Group Chat' : 'Direct Message'}
                        </p>
                      </div>
                    </div>
                );
            })()}
            <ScrollArea className="flex-1 p-4 space-y-4">
              {currentMessagesList.length === 0 && (
                <p className="text-center text-muted-foreground">No messages in this conversation yet. Say hello!</p>
              )}
              {currentMessagesList.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user?.userID ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow ${msg.senderId === user?.userID ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                    {msg.senderId !== user?.userID && <p className="text-xs font-semibold mb-1">{msg.senderName}</p>}
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === user?.userID ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right`}>
                      {msg.timestamp ? formatDistanceToNowStrict(new Date(msg.timestamp), { addSuffix: true }) : 'sending...'}
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
                disabled={!selectedConversationId}
              />
              <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90" disabled={!newMessage.trim() || !selectedConversationId}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <MessageSquare size={64} className="mb-4" />
            {conversationsList.length > 0 ? (
                <p className="text-lg">Select a conversation to start messaging.</p>
            ) : (
                <p className="text-lg">No active conversations. Click the '+' icon to find users and start a new chat.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
