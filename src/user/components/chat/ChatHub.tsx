import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import {
    Send, Loader2, Globe, Calendar, Flag, MessageSquare, Lock
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

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

    const { data: messages = [], isLoading, refetch } = useQuery<ChatMessage[]>({
        queryKey: [`/api/chat`, activeChatType, userCountry],
        queryFn: () => fetch(queryUrl).then(r => r.json()),
        refetchInterval: 5000, // Poll every 5s
    });

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
            refetch();
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

            {/* Input */}
            {user ? (
                <form onSubmit={handleSubmit} className="border-t border-border p-3 bg-muted/20">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
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
                    </div>
                    {sendMutation.isError && (
                        <p className="text-xs text-destructive mt-1">
                            {(sendMutation.error as Error).message}
                        </p>
                    )}
                </form>
            ) : (
                <div className="border-t border-border p-4 text-center bg-muted/20">
                    <p className="text-sm text-muted-foreground">Sign in to start chatting</p>
                </div>
            )}
        </div>
    );
};

export default ChatHub;
