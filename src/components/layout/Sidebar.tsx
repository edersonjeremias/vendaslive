import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  Camera,
  Shield
} from 'lucide-react';
import { useMobileMenu } from '../../contexts/MobileMenuContext';
import { usePermissions } from '../../contexts/PermissionsContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isOpen, close } = useMobileMenu();
  const { isAdmin, permissions } = usePermissions();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    ...(permissions.canViewClients ? [{ name: 'Clientes', href: '/clients', icon: Users }] : []),
    ...(permissions.canViewSales ? [{ name: 'Vendas', href: '/sales', icon: ShoppingBag }] : []),
    ...(isAdmin ? [{ name: 'Administração', href: '/admin/users', icon: Shield }] : []),
  ];
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden" 
          onClick={close}
        />
      )}
    
      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-30 w-64 transform overflow-y-auto bg-gray-900 
          border-r border-gray-800 transition-transform duration-300 ease-in-out 
          md:translate-x-0 md:static md:z-0
        `}
      >
        <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-800">
          <Camera className="h-8 w-8 text-violet-500" />
          <span className="ml-2 text-xl font-bold text-gray-100">FotoVendas</span>
        </div>
        
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => close()}
                className={`
                  group flex items-center px-2 py-2 text-base font-medium rounded-md 
                  ${
                    active
                      ? 'bg-gray-800 text-violet-400'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  transition-colors duration-200
                `}
              >
                <item.icon
                  className={`
                    mr-4 h-5 w-5 flex-shrink-0 
                    ${active ? 'text-violet-400' : 'text-gray-400 group-hover:text-gray-300'}
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;