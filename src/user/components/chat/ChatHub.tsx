import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import {
    Send, Loader2, Globe, Calendar, Flag, MessageSquare, Lock
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useSocket } from '@/shared/hooks/use-socket';

type ChatType = 'global' | 'event' | 'country';

interface ChatMessage {
    id: string;
    userId: string;
    eventId: string | null;
    chatType: string;
    countryCode: string | null;
    message: string;
    createdAt: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });
}

const chatTabs: { id: ChatType; label: string; icon: React.ElementType }[] = [
    { id: 'global', label: 'Global', icon: Globe },
    { id: 'country', label: 'Country', icon: Flag },
];

export const ChatHub: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeChatType, setActiveChatType] = useState<ChatType>('global');
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userCountry = (user as any)?.country;

    const queryUrl = activeChatType === 'country' && userCountry
        ? `/api/chat?chat_type=country&country_code=${encodeURIComponent(userCountry)}`
        : `/api/chat?chat_type=global`;

    const queryKey = [`/api/chat`, activeChatType, userCountry];

    const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
        queryKey,
        queryFn: () => fetch(queryUrl).then(r => r.json()),
    });

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        // Join appropriate room
        if (activeChatType === 'country' && userCountry) {
            socket.emit('join_country_chat', userCountry);
        }

        const handleNewMessage = (newMessage: ChatMessage) => {
            // Check if message belongs to current chat context
            const isMatch = (activeChatType === 'global' && newMessage.chatType === 'global') ||
                (activeChatType === 'country' && newMessage.chatType === 'country' && newMessage.countryCode === userCountry);

            if (isMatch) {
                queryClient.setQueryData(queryKey, (oldMessages: ChatMessage[] = []) => {
                    // Avoid duplicates
                    if (oldMessages.find(m => m.id === newMessage.id)) return oldMessages;
                    return [newMessage, ...oldMessages];
                });
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            if (activeChatType === 'country' && userCountry) {
                socket.emit('leave_room', `country_${userCountry}`);
            }
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, activeChatType, userCountry, queryClient, queryKey]);

    const sendMutation = useMutation({
        mutationFn: async (message: string) => {
            const body: any = {
                message,
                chatType: activeChatType,
            };

            if (activeChatType === 'country') {
                body.countryCode = userCountry;
            }

            const response = await fetchWithAuth('/api/chat', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to send message');
            }
            return response.json();
        },
        onSuccess: () => {
            // queryClient.invalidateQueries({ queryKey }); // Optional, socket will push it
            setInput('');
        },
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sendMutation.isPending || !user) return;
        sendMutation.mutate(input.trim());
    };

    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!socket) return;

        const currentRoom = activeChatType === 'global' ? 'global' : `country_${userCountry}`;

        const handleUserTyping = (data: { username: string, room: string }) => {
            if (data.room === currentRoom) {
                setTypingUsers(prev => prev.includes(data.username) ? prev : [...prev, data.username]);
            }
        };

        const handleUserStopTyping = (data: { username: string, room: string }) => {
            if (data.room === currentRoom) {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
            }
        };

        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);

        return () => {
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
        };
    }, [socket, activeChatType, userCountry]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (!socket) return;

        const currentRoom = activeChatType === 'global' ? 'global' : `country_${userCountry}`;

        socket.emit('typing', { room: currentRoom });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { room: currentRoom });
        }, 2000);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px] bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
            {/* Tab Row */}
            <div className="flex border-b border-border bg-muted/30">
                {chatTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeChatType === tab.id;
                    const isDisabled = tab.id === 'country' && !userCountry;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => !isDisabled && setActiveChatType(tab.id)}
                            disabled={isDisabled}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                                isActive
                                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                                    : isDisabled
                                        ? 'text-muted-foreground/50 cursor-not-allowed'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                            title={isDisabled ? 'Set your country in Settings to use Country Chat' : undefined}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                            {isDisabled && <Lock className="h-3 w-3" />}
                        </button>
                    );
                })}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    [...messages].reverse().map((msg) => {
                        const isOwn = msg.userId === (user as any)?.id;
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex",
                                    isOwn ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[75%] rounded-xl px-4 py-2.5 text-sm",
                                    isOwn
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted border border-border text-foreground"
                                )}>
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <span className="text-[10px] opacity-60 mt-1 block">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input & Typing Indicators */}
            <div className="border-t border-border p-3 bg-muted/20">
                {typingUsers.length > 0 && (
                    <div className="text-[10px] text-muted-foreground mb-1 animate-pulse">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                )}
                {user ? (
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder={`Message ${activeChatType === 'country' ? userCountry : 'global'} chat...`}
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            maxLength={1000}
                            disabled={sendMutation.isPending}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!input.trim() || sendMutation.isPending}
                            className="px-4"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                ) : (
                    <div className="text-center py-1">
                        <p className="text-sm text-muted-foreground">Sign in to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHub;
