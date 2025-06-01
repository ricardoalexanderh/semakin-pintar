import React from 'react';
import { Share2, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { trackButtonClick } from '../utils/analytics';

interface SocialShareProps {
  title?: string;
  description?: string;
  url?: string;
  hashtags?: string[];
  className?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({
  title = 'Semakin Pintar - Free Educational Games for Kids & Family Learning',
  description = 'Check out these amazing free educational games! Perfect for kids learning math and families practicing together.',
  url = 'https://www.semakinpintar.com',
  hashtags = ['education', 'kids', 'math', 'learning', 'games'],
  className = ''
}) => {
  const encodedTitle = encodeURIComponent(title);
  //const encodedDescription = encodeURIComponent(description);
  const encodedUrl = encodeURIComponent(url);
  //const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');

  // Check if native sharing is supported
  const isNativeShareSupported = typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function';

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtags.join(',')}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    copy: url
  };

  const handleShare = async (platform: string, link: string) => {
    trackButtonClick(`share-${platform}`, 'social-share');
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
    } else {
      window.open(link, '_blank', 'width=600,height=400');
    }
  };

  const handleNativeShare = async () => {
    trackButtonClick('native-share', 'social-share');
    
    if (isNativeShareSupported) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Native share button for mobile devices */}
      {isNativeShareSupported && (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}

      {/* Individual platform buttons */}
      <button
        onClick={() => handleShare('twitter', shareLinks.twitter)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
        <span className="hidden sm:inline">Twitter</span>
      </button>

      <button
        onClick={() => handleShare('facebook', shareLinks.facebook)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
        <span className="hidden sm:inline">Facebook</span>
      </button>

      <button
        onClick={() => handleShare('whatsapp', shareLinks.whatsapp)}
        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      <button
        onClick={() => handleShare('copy', shareLinks.copy)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        title="Copy link"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Copy Link</span>
      </button>
    </div>
  );
};

export default SocialShare;