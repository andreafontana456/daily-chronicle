import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X, Send, Globe, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CreatePostForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [selfRating, setSelfRating] = useState(0);
  const [postType, setPostType] = useState<'global' | 'story'>('global');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'immagine deve essere inferiore a 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selfRating === 0) {
      toast.error('Seleziona un rating per il tuo post');
      return;
    }

    if (!description.trim() && !image) {
      toast.error('Aggiungi una descrizione o un\'immagine');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('post-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Create post
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user!.id,
        description: description.trim() || null,
        image_url: imageUrl,
        self_rating: selfRating,
        type: postType,
      });

      if (postError) throw postError;

      toast.success('Post pubblicato con successo! 🎉');
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Errore durante la pubblicazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {imagePreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted"
            >
              <img
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.button
              key="upload"
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/80 transition-colors"
            >
              <div className="rounded-full bg-primary/10 p-3">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                Clicca per aggiungere una foto
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          placeholder="Cosa vuoi condividere oggi?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {description.length}/500
        </p>
      </div>

      {/* Self rating */}
      <div className="space-y-2">
        <Label>Come valuti questo contenuto?</Label>
        <div className="flex items-center gap-2">
          <StarRating
            rating={selfRating}
            size="lg"
            interactive
            onChange={setSelfRating}
          />
          <span className="text-sm text-muted-foreground">
            {selfRating > 0 ? `${selfRating}/5` : 'Seleziona'}
          </span>
        </div>
      </div>

      {/* Post type */}
      <div className="space-y-3">
        <Label>Tipo di pubblicazione</Label>
        <RadioGroup
          value={postType}
          onValueChange={(v) => setPostType(v as 'global' | 'story')}
          className="grid grid-cols-2 gap-3"
        >
          <Label
            htmlFor="global"
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all',
              postType === 'global'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="global" id="global" className="sr-only" />
            <Globe className={cn(
              'h-6 w-6',
              postType === 'global' ? 'text-primary' : 'text-muted-foreground'
            )} />
            <span className="font-medium">Post Globale</span>
            <span className="text-xs text-muted-foreground text-center">
              Visibile a tutti, permanente
            </span>
          </Label>

          <Label
            htmlFor="story"
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all',
              postType === 'story'
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50'
            )}
          >
            <RadioGroupItem value="story" id="story" className="sr-only" />
            <Clock className={cn(
              'h-6 w-6',
              postType === 'story' ? 'text-accent' : 'text-muted-foreground'
            )} />
            <span className="font-medium">Storia</span>
            <span className="text-xs text-muted-foreground text-center">
              Solo amici, 24 ore
            </span>
          </Label>
        </RadioGroup>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting || selfRating === 0}
        className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
        size="lg"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            />
            Pubblicazione...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Pubblica
          </span>
        )}
      </Button>
    </form>
  );
}
