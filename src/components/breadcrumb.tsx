import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  current?: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' }
    ];

    if (segments.length === 0) {
      breadcrumbs[0].current = true;
      return breadcrumbs;
    }

    // Handle /games route
    if (segments[0] === 'games') {
      breadcrumbs.push({ label: 'Games', path: '/games' });
      
      if (segments[1]) {
        const gameNames: Record<string, string> = {
          'mental-arithmetic': 'Mental Arithmetic',
          'multiplication-table': 'Multiplication Table'
        };
        
        breadcrumbs.push({
          label: gameNames[segments[1]] || segments[1],
          path: `/games/${segments[1]}`,
          current: true
        });
      } else {
        breadcrumbs[breadcrumbs.length - 1].current = true;
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Generate JSON-LD structured data for breadcrumbs
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://www.semakinpintar.com${item.path === '/' ? '' : item.path}`
    }))
  };

  // Don't show breadcrumbs on homepage
  if (breadcrumbs.length <= 1) return null;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      {/* Breadcrumb Navigation - Single responsive version */}
      <nav aria-label="Breadcrumb" className="w-full">
        <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 overflow-x-auto scrollbar-hide">
          {breadcrumbs.map((item, index) => (
            <li key={item.path} className="flex items-center flex-shrink-0">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2 text-gray-400 flex-shrink-0" />
              )}
              
              {item.current ? (
                <span 
                  className="text-purple-700 font-medium bg-purple-50 px-2 py-1 rounded-md truncate max-w-[120px] sm:max-w-none"
                  aria-current="page"
                  title={item.label}
                >
                  {index === 0 && <Home className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 flex-shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-gray-600 hover:text-purple-700 transition-colors flex items-center bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-md truncate max-w-[100px] sm:max-w-none"
                  title={item.label}
                >
                  {index === 0 && <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;