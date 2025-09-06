import { Link, useLocation } from 'react-router-dom';

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/sankey', label: 'Sankey' },
    { path: '/data', label: 'Data' },
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-bold text-white">Finance Flow</h1>
          </div>
          
          <div className="flex space-x-2 sm:space-x-4 md:space-x-8">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  location.pathname === path
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};