import { RefObject } from 'react';
import { Fighter } from '@/shared/types/fighter';
import { Button } from '@/shared/components/ui/button';
import { TabsContent } from '@/shared/components/ui/tabs';
import { Upload, User, AlertCircle, Loader2 } from 'lucide-react';

interface ImagesTabProps {
  fighter: Fighter;
  faceInputRef: RefObject<HTMLInputElement>;
  bodyInputRef: RefObject<HTMLInputElement>;
  handleFaceFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBodyFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  progress: number;
}

export const ImagesTab = ({
  fighter,
  faceInputRef,
  bodyInputRef,
  handleFaceFileChange,
  handleBodyFileChange,
  isUploading,
  progress,
}: ImagesTabProps) => {
  return (
    <TabsContent value="images" className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>Face image:</strong> Face only, NO shoulders. Max 5MB.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-48 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {fighter.imageUrl && !fighter.imageUrl.includes('placeholder') ? (
                <img
                  src={fighter.imageUrl}
                  alt={`${fighter.firstName} ${fighter.lastName} face`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            <input
              ref={faceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFaceFileChange}
              className="hidden"
              data-testid="input-face-image"
            />

            <Button
              type="button"
              onClick={() => faceInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
              data-testid="button-upload-face"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading... {progress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {fighter.imageUrl ? 'Replace Face' : 'Upload Face'}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>Body image:</strong> Full body or stance. Max 5MB.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-36 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {fighter.bodyImageUrl ? (
                <img
                  src={fighter.bodyImageUrl}
                  alt={`${fighter.firstName} ${fighter.lastName} body`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            <input
              ref={bodyInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBodyFileChange}
              className="hidden"
              data-testid="input-body-image"
            />

            <Button
              type="button"
              onClick={() => bodyInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
              data-testid="button-upload-body"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading... {progress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {fighter.bodyImageUrl ? 'Replace Body' : 'Upload Body'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};
