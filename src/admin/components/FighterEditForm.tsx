import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Fighter } from '@/shared/types/fighter';
import { useFighters } from '@/shared/hooks/useFighters';
import { useFighterImageUpload } from '@/shared/hooks/use-fighter-image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Form } from '@/shared/components/ui/form';
import { toast } from '@/shared/hooks/use-toast';
import { User, Image, Loader2, Save, UserCircle, Trophy, Activity } from 'lucide-react';
import { FormData } from './fighter-form/types';
import { PersonalInfoTab } from './fighter-form/PersonalInfoTab';
import { RecordStatsTab } from './fighter-form/RecordStatsTab';
import { PerformanceStatsTab } from './fighter-form/PerformanceStatsTab';
import { ImagesTab } from './fighter-form/ImagesTab';

interface FighterEditFormProps {
  fighter: Fighter;
  onUpdate: () => void;
}

export const FighterEditForm = ({ fighter, onUpdate }: FighterEditFormProps) => {
  const { updateFighter } = useFighters();
  const [isSaving, setIsSaving] = useState(false);
  const { uploadFighterImage, isUploading, progress } = useFighterImageUpload({
    onSuccess: (response) => {
      const field = response.imageType === 'face' ? 'imageUrl' : 'bodyImageUrl';
      updateFighter(fighter.id, { [field]: response.imageUrl });
      toast({
        title: 'Image uploaded',
        description: `${response.imageType === 'face' ? 'Face' : 'Body'} image updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const faceInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    defaultValues: {
      firstName: fighter.firstName ?? '',
      lastName: fighter.lastName ?? '',
      nickname: fighter.nickname ?? '',
      dateOfBirth: fighter.dateOfBirth ?? '',
      nationality: fighter.nationality ?? '',
      gender: fighter.gender ?? 'Male',
      weightClass: fighter.weightClass ?? 'Lightweight',
      stance: fighter.stance ?? 'Orthodox',
      organization: fighter.organization ?? 'UFC',
      gym: fighter.gym ?? '',
      headCoach: fighter.headCoach ?? '',
      team: fighter.team ?? '',
      age: fighter.physicalStats?.age ?? 0,
      height: fighter.physicalStats?.height ?? '',
      heightInches: fighter.physicalStats?.height_inches ?? 0,
      reach: fighter.physicalStats?.reach ?? '',
      reachInches: fighter.physicalStats?.reach_inches ?? 0,
      legReach: fighter.physicalStats?.leg_reach ?? '',
      legReachInches: fighter.physicalStats?.leg_reach_inches ?? 0,
      weight: fighter.physicalStats?.weight ?? 0,
      wins: fighter.record?.wins ?? 0,
      losses: fighter.record?.losses ?? 0,
      draws: fighter.record?.draws ?? 0,
      noContests: fighter.record?.noContests ?? 0,
      koWins: fighter.performance?.ko_wins ?? 0,
      tkoWins: fighter.performance?.tko_wins ?? 0,
      submissionWins: fighter.performance?.submission_wins ?? 0,
      decisionWins: fighter.performance?.decision_wins ?? 0,
      finishRate: fighter.performance?.finish_rate ?? 0,
      strikeAccuracy: fighter.performance?.strike_accuracy ?? 0,
      strikeDefense: fighter.performance?.strike_defense ?? 0,
      takedownAvg: fighter.performance?.takedown_avg ?? 0,
      takedownAccuracy: fighter.performance?.takedown_accuracy ?? 0,
      takedownDefense: fighter.performance?.takedown_defense ?? 0,
      strikesLandedPerMin: fighter.performance?.strikes_landed_per_min ?? 0,
      strikesAbsorbedPerMin: fighter.performance?.strikes_absorbed_per_min ?? 0,
      submissionAvg: fighter.performance?.submission_avg ?? 0,
      lossesByKo: fighter.performance?.losses_by_ko ?? 0,
      lossesBySubmission: fighter.performance?.losses_by_submission ?? 0,
      lossesByDecision: fighter.performance?.losses_by_decision ?? 0,
      longestWinStreak: fighter.performance?.longest_win_streak ?? 0,
      fightingOutOf: fighter.fightingOutOf ?? '',
      rankGlobal: fighter.rankGlobal ?? 0,
      rankPromotion: fighter.rankPromotion ?? 0,
      isVerified: fighter.isVerified ?? false,
    },
  });

  const handleFileSelect = async (imageType: 'face' | 'body', file: File) => {
    await uploadFighterImage(fighter.id, imageType, file);
  };

  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect('face', file);
  };

  const handleBodyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect('body', file);
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const updatedFighter: Partial<Fighter> = {
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname || undefined,
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality,
        gender: data.gender,
        weightClass: data.weightClass,
        stance: data.stance,
        organization: data.organization,
        gym: data.gym,
        headCoach: data.headCoach,
        team: data.team || undefined,
        fightingOutOf: data.fightingOutOf || undefined,
        rankGlobal: Number(data.rankGlobal) || undefined,
        rankPromotion: Number(data.rankPromotion) || undefined,
        physicalStats: {
          age: Number(data.age) || 0,
          height: data.height,
          height_inches: Number(data.heightInches) || 0,
          reach: data.reach,
          reach_inches: Number(data.reachInches) || 0,
          leg_reach: data.legReach,
          leg_reach_inches: Number(data.legReachInches) || 0,
          weight: Number(data.weight) || 0,
        },
        record: {
          wins: Number(data.wins) || 0,
          losses: Number(data.losses) || 0,
          draws: Number(data.draws) || 0,
          noContests: Number(data.noContests) || 0,
        },
        performance: {
          ...fighter.performance,
          ko_wins: Number(data.koWins) || 0,
          tko_wins: Number(data.tkoWins) || 0,
          submission_wins: Number(data.submissionWins) || 0,
          decision_wins: Number(data.decisionWins) || 0,
          finish_rate: Number(data.finishRate) || 0,
          strike_accuracy: Number(data.strikeAccuracy) || 0,
          strike_defense: Number(data.strikeDefense) || 0,
          takedown_avg: Number(data.takedownAvg) || 0,
          takedown_accuracy: Number(data.takedownAccuracy) || 0,
          takedown_defense: Number(data.takedownDefense) || 0,
          strikes_landed_per_min: Number(data.strikesLandedPerMin) || 0,
          strikes_absorbed_per_min: Number(data.strikesAbsorbedPerMin) || 0,
          submission_avg: Number(data.submissionAvg) || 0,
          losses_by_ko: Number(data.lossesByKo) || 0,
          losses_by_submission: Number(data.lossesBySubmission) || 0,
          losses_by_decision: Number(data.lossesByDecision) || 0,
          longest_win_streak: Number(data.longestWinStreak) || 0,
        },
        isVerified: data.isVerified,
      };

      await updateFighter(fighter.id, updatedFighter);
      toast({
        title: 'Fighter updated',
        description: `${data.firstName} ${data.lastName} has been updated successfully.`,
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update fighter. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {fighter.firstName} {fighter.lastName}
              {fighter.nickname && (
                <span className="text-muted-foreground font-normal">"{fighter.nickname}"</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" data-testid="tab-personal-info">
                  <UserCircle className="h-4 w-4 mr-1" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="record" data-testid="tab-record-stats">
                  <Trophy className="h-4 w-4 mr-1" />
                  Record
                </TabsTrigger>
                <TabsTrigger value="performance" data-testid="tab-performance-stats">
                  <Activity className="h-4 w-4 mr-1" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="images" data-testid="tab-images">
                  <Image className="h-4 w-4 mr-1" />
                  Images
                </TabsTrigger>
              </TabsList>

              <PersonalInfoTab form={form} />
              <RecordStatsTab form={form} />
              <PerformanceStatsTab form={form} />
              <ImagesTab
                fighter={fighter}
                faceInputRef={faceInputRef}
                bodyInputRef={bodyInputRef}
                handleFaceFileChange={handleFaceFileChange}
                handleBodyFileChange={handleBodyFileChange}
                isUploading={isUploading}
                progress={progress}
              />
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onUpdate} data-testid="button-cancel-editing">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} data-testid="button-save-fighter">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
