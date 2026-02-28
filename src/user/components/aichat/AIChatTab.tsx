import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import {
    Send, Loader2, Bot, User, Trash2, Sparkles, AlertCircle, Lock
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface AiChatMessage {
    id: string;
    userId: string;
    role: 'user' | 'assistant';
    message: string;
    context: any;
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

export const AIChatTab: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isPremium = (user as any)?.tier === 'premium';

    const { data: messages = [], isLoading } = useQuery<AiChatMessage[]>({
        queryKey: ['/api/ai/chat/history'],
        enabled: isPremium,
    });

    const [isStreaming, setIsStreaming] = useState(false);

    // Auto-scroll to bottom on new messages or during streaming
    useEffect(() => {
        // Use 'auto' behavior during streaming to prevent smooth-scroll jitter
        messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    }, [messages, isStreaming]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming || !user || !isPremium) return;

        const userMessageText = input.trim();
        setInput('');
        setIsStreaming(true);

        const newUserMessage: AiChatMessage = {
            id: `temp-user-${Date.now()}`,
            userId: (user as any).id,
            role: 'user',
            message: userMessageText,
            context: null,
            createdAt: new Date().toISOString(),
        };

        const tempAiMessage: AiChatMessage = {
            id: `temp-ai-${Date.now()}`,
            userId: (user as any).id,
            role: 'assistant',
            message: '',
            context: null,
            createdAt: new Date().toISOString(),
        };

        // Optimistically add user message and placeholder AI message
        queryClient.setQueryData(['/api/ai/chat/history'], (old: AiChatMessage[] = []) => [...(old || []), newUserMessage, tempAiMessage]);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessageText }),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to start stream');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    accumulatedResponse += parsed.content;
                                    // Update the temporary AI message in the cache
                                    queryClient.setQueryData(['/api/ai/chat/history'], (old: AiChatMessage[] = []) => {
                                        return old.map(m => m.id === tempAiMessage.id ? { ...m, message: accumulatedResponse } : m);
                                    });
                                } else if (parsed.error) {
                                    throw new Error(parsed.error);
                                }
                            } catch (e) {
                                console.error('Error parsing SSE data:', e);
                            }
                        }
                    }
                }
            }

            // Final sync with server to get permanent IDs
            queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
        } catch (error: any) {
            console.error('Streaming error:', error);
            // Could add error handling UI here
        } finally {
            setIsStreaming(false);
        }
    };

    const clearMutation = useMutation({
        mutationFn: async () => {
            const response = await fetchWithAuth('/api/ai/chat/history', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to clear history');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
        },
    });

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
                <p className="text-muted-foreground">Please sign in to access AI Chat.</p>
            </div>
        );
    }

    if (!isPremium) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
                    <div className="relative p-6 bg-card border border-border rounded-2xl">
                        <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-display tracking-wide text-foreground uppercase mb-2">
                    Premium Feature
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                    AI Chat is available for Premium members. Upgrade to chat with our MMA analysis AI.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px] bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex flex-col border-b border-border bg-muted/30">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">MMA Analysis AI</h3>
                        <span className="text-xs text-muted-foreground hidden sm:inline-block">• Ask about fighters, stats & predictions</span>
                    </div>
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearMutation.mutate()}
                            disabled={clearMutation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                            title="Clear Chat History"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {/* Context Indicator */}
                <div className="px-4 py-1.5 bg-primary/5 border-t border-primary/10 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                        Context: Global Fight Database Connected
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col gap-4 py-4 w-full">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse border border-primary/20" />
                            <div className="h-16 w-[70%] bg-muted rounded-xl animate-pulse" />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <div className="h-10 w-[40%] bg-primary/20 rounded-xl animate-pulse" />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse border border-primary/20" />
                            <div className="h-24 w-[85%] bg-muted rounded-xl animate-pulse" />
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bot className="h-10 w-10 text-primary/50 mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">No messages yet</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            Ask about fighters, compare stats, get predictions, or discuss fight strategy.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isTempAiMessage = isStreaming && msg.id.startsWith('temp-ai-');

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3 animate-fade-in w-full",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Bot className={cn("h-4 w-4 text-primary", isTempAiMessage && "animate-pulse")} />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "rounded-xl px-4 py-3 text-sm transition-all duration-300",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground max-w-[85%]"
                                            : "bg-muted border border-border text-foreground w-full max-w-[90%] min-h-[44px]"
                                    )}
                                >
                                    {isTempAiMessage && !msg.message ? (
                                        <div className="flex items-center gap-2 h-full opacity-60">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                            </div>
                                        </div>
                                    )}
                                    {!isTempAiMessage && (
                                        <span className={cn(
                                            "text-[10px] opacity-60 mt-1 block",
                                            msg.role === 'assistant' && "text-right"
                                        )}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-border p-3 bg-muted/20">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about fighters, stats, predictions..."
                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isStreaming}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!input.trim() || isStreaming}
                        className="px-4"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AIChatTab;
