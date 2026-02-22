import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface ChatMessage {
    id: string;
    userId: string;
    eventId?: string;
    message: string;
    createdAt: string;
    user?: {
        username?: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

interface EventChatProps {
    eventId?: string;
}

export const EventChat: React.FC<EventChatProps> = ({ eventId }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Fetch messages with polling (every 5 seconds)
    const { data: messages = [], isLoading, error } = useQuery<ChatMessage[]>({
        queryKey: ['/api/chat', eventId],
        queryFn: async () => {
            const url = eventId ? `/api/chat?event_id=${eventId}` : '/api/chat';
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch messages');
            return res.json();
        },
        refetchInterval: 5000, // Poll every 5 seconds
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message, eventId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to send message');
            }
            return res.json();
        },
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['/api/chat', eventId] });
        },
    });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            sendMutation.mutate(newMessage.trim());
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] bg-card rounded-lg border border-border">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-border">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                    {eventId ? 'Event Chat' : 'General Chat'}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                    {messages.length} messages
                </span>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
                        <p>No messages yet</p>
                        <p className="text-sm">Be the first to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                                {(msg.user?.displayName || msg.user?.username || 'U')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-medium text-sm">
                                        {msg.user?.displayName || msg.user?.username || 'Anonymous'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(msg.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/90 break-words">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border">
                {error && (
                    <p className="text-xs text-red-400 mb-2">
                        Failed to load messages. Using cached data.
                    </p>
                )}
                {sendMutation.error && (
                    <p className="text-xs text-red-400 mb-2">
                        {(sendMutation.error as Error).message || 'Failed to send message'}
                    </p>
                )}
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sendMutation.isPending}
                        data-testid="chat-input"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sendMutation.isPending}
                        size="icon"
                        data-testid="chat-send"
                    >
                        {sendMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
