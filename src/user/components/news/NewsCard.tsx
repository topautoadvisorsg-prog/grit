import React from 'react';
import { NewsArticle } from './NewsPage';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ChevronRight, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
  onReadMore?: (article: NewsArticle) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onReadMore }) => {
  const formattedDate = format(new Date(article.publishedAt), 'MMMM d, yyyy | h:mm a');

  return (
    <div className="group relative bg-card/50 border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-300 hover:bg-card/80">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-32 h-24 md:w-40 md:h-28 rounded-lg overflow-hidden bg-muted">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Title */}
          <h3 className="text-base md:text-lg font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 hidden md:block">
            {article.excerpt}
          </p>

          {/* Tags + Meta Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
              >
                {tag}
              </Badge>
            ))}

            {article.eventReference && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {article.eventReference}
              </span>
            )}

            {article.fighterReference && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {article.fighterReference}
              </span>
            )}

            <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Read More Button */}
        <div className="flex-shrink-0 flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
            onClick={() => onReadMore?.(article)}
          >
            Read More
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
