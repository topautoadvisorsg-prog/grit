import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Settings, Save, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface SystemSetting {
    key: string;
    value: any;
    description: string;
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

export const AdminSystemSettings = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch settings
    const { data: settings = [], isLoading } = useQuery<SystemSetting[]>({
        queryKey: ['/api/admin/settings'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/admin/settings');
            if (!res.ok) throw new Error('Failed to fetch settings');
            return res.json();
        }
    });

    // Determine state
    const maintenanceMode = settings.find(s => s.key === 'maintenance_mode')?.value?.enabled || false;
    const globalAlert = settings.find(s => s.key === 'global_alert')?.value?.message || '';

    // Update Mutation
    const updateSettingMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: any }) => {
            const res = await fetchWithAuth('/api/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({ key, value, description: 'Updated via Admin Panel' })
            });
            if (!res.ok) throw new Error('Failed to update setting');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
            toast({ title: "Settings Saved", description: "Global configuration updated." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Configuration
                </CardTitle>
                <CardDescription>
                    Manage global platform settings. Changes affect ALL users immediately.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Maintenance Mode */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium flex items-center gap-2">
                                    Maintenance Mode
                                    {maintenanceMode && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Disable access to the app for all non-admin users.
                                </p>
                            </div>
                            <Switch
                                checked={maintenanceMode}
                                onCheckedChange={(checked) => updateSettingMutation.mutate({
                                    key: 'maintenance_mode',
                                    value: { enabled: checked }
                                })}
                            />
                        </div>

                        {/* Global Alert Banner */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Global Alert Message</Label>
                                <Input
                                    placeholder="Enter a message to display at the top of the app..."
                                    defaultValue={globalAlert}
                                    onBlur={(e) => {
                                        if (e.target.value !== globalAlert) {
                                            updateSettingMutation.mutate({
                                                key: 'global_alert',
                                                value: { message: e.target.value }
                                            });
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to disable the banner. Changes save on blur.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground italic">
                                Note: More settings will be added here as system complexity grows.
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
