import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import './Chatbot.css';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Show button when page is scrolled up to given distance
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Throttle scroll event for better performance
    let timeoutId;
    const throttledToggleVisibility = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        toggleVisibility();
        timeoutId = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledToggleVisibility);
    return () => {
      window.removeEventListener('scroll', throttledToggleVisibility);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const easeInOutCubic = (t) => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const scrollToTop = () => {
    setIsScrolling(true);
    const duration = 800; // Duration in milliseconds
    const start = window.pageYOffset;
    const startTime = performance.now();

    const scroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = easeInOutCubic(progress);
      window.scrollTo(0, start * (1 - easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(scroll);
      } else {
        setIsScrolling(false);
      }
    };

    requestAnimationFrame(scroll);
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          type="button"
          disabled={isScrolling}
          className={`
            fixed bottom-8 right-8 back-to-top-button
            bg-red-600 hover:bg-red-700
            text-white
            w-12 h-12
            rounded-full
            flex items-center justify-center
            shadow-lg
            transition-all duration-300
            transform hover:scale-110
            z-50
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            ${isScrolling ? 'opacity-70 cursor-not-allowed' : 'animate-bounce-gentle'}
          `}
          aria-label="Back to top"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              scrollToTop();
            }
          }}
        >
          <ArrowUp 
            className={`w-6 h-6 transition-transform duration-300
              ${isScrolling ? 'animate-move-up' : 'hover:translate-y-1'}`}
          />
        </button>
      )}

      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        @keyframes move-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite;
        }
        
        .animate-move-up {
          animation: move-up 0.8s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default BackToTop;