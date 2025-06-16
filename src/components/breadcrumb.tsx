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
          'multiplication-table': 'Multiplication Table',
          'mental-division': 'Mental Division',
          'mental-multiplication': 'Mental Multiplication',
          'patterns-detective': 'Patterns Detective',
          'rocket-math': 'Rocket Math',
          'mathcha-cafe': 'Mathcha Cafe',
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
      
      {/* Breadcrumb Navigation - Mobile-first responsive design */}
      <nav aria-label="Breadcrumb" className="w-full px-2 sm:px-0">
        {/* Mobile version: Show only current page */}
        <div className="block sm:hidden">
          <ol className="flex items-center text-sm">
            <li className="flex items-center min-w-0 flex-1">
              <span 
                className="text-purple-700 font-medium bg-purple-50 px-3 py-1.5 rounded-md truncate"
                aria-current="page"
                title={breadcrumbs[breadcrumbs.length - 1].label}
              >
                {breadcrumbs[breadcrumbs.length - 1].label}
              </span>
            </li>
          </ol>
        </div>

        {/* Desktop version: Full breadcrumb trail */}
        <div className="hidden sm:block">
          <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-600">
            {breadcrumbs.map((item, index) => (
              <li key={item.path} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
                )}
                
                {item.current ? (
                  <span 
                    className="text-purple-700 font-medium bg-purple-50 px-3 py-1.5 rounded-md"
                    aria-current="page"
                  >
                    {index === 0 && <Home className="w-4 h-4 inline mr-2" />}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="text-gray-600 hover:text-purple-700 transition-colors flex items-center bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md"
                  >
                    {index === 0 && <Home className="w-4 h-4 mr-2" />}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
};

export default Breadcrumb;