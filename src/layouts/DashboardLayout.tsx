import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';
import { NAVIGATION_ITEMS } from '@/constants/navigation';


import { 
  Menu, 
  X, 
  LogOut, 
  Bell, 
  HeartPulse, 
  ChevronRight,
  User2,    
  ArrowRightLeft,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState as useRefreshState } from 'react';
import { useToast } from '@/components/Toast';
export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useRefreshState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const ROUTE_QUERY_KEYS: Record<string, string[][]> = {
    '/users': [['users']],
    '/admin-users': [['adminUsers']],
    '/bookings': [['bookings']],
    '/tests': [['tests']],
    '/packages': [['packages']],
    '/reports': [['reports'], ['bookingsForReport']],
    '/coupons': [['coupons'], ['couponAnalytics']],
    '/payments': [['payments'], ['refunds'], ['settlements'], ['paymentSummary']],
    '/branches': [['branches']],
    '/inventory': [['inventory'], ['inventoryTransactions'], ['inventorySuppliers'], ['inventoryAnalytics']],
    '/partners': [['partners']],
    '/samples': [['sampleQueue']],
    '/analytics': [['analyticsDashboard']],
    '/logs': [['auditLogs'], ['apiLogs']],
    '/notifications': [['notificationLogs']],
    '/prescriptions': [['prescriptions']],
    '/cms': [['cmsBanners'], ['cmsConfig'], ['cmsAlerts'], ['cmsPages'], ['cmsAuditLogs']],
    '/roles': [['roles'], ['allPermissions']],
    '/support': [['supportConversations']],
  };

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const matchedKeys = Object.entries(ROUTE_QUERY_KEYS).find(([route]) =>
        location.pathname === route || location.pathname.startsWith(route + '/')
      );
if (matchedKeys) {
        await Promise.all(
          matchedKeys[1].map((key) =>
            queryClient.refetchQueries({ queryKey: key, type: 'active' })
          )
        );
      } else {
        await queryClient.refetchQueries({ type: 'active' });
      }
     toastSuccess('Data refreshed successfully.');
    } catch {
      toastError('Failed to refresh data.');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, location.pathname, queryClient]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
// Filter sidebar items based on RBAC permissions
const filteredNavItems = NAVIGATION_ITEMS.filter((item) => {
    if (!user) return false;
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.adminRoleSlug === 'super_admin';
    if (isSuperAdmin) return true;
    if (item.roles && !item.roles.includes(user.role as any)) return false;
    if (item.moduleKey) {
      return Array.isArray(user.permissions) && user.permissions.includes(`${item.moduleKey}.view`);
    }
    return true;
  });

  // Determine breadcrumb from location
  const activeItem = NAVIGATION_ITEMS.find(item => item.path === location.pathname) || NAVIGATION_ITEMS[0];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-background flex text-foreground overflow-hidden selection:bg-primary/20">
      
   
      <motion.aside 
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "hidden md:flex flex-col h-screen bg-card border-r border-border/80 sticky top-0 left-0 z-20 flex-shrink-0 shadow-sm shadow-border/20"
        )}
      >
  
      <div className="h-16 flex items-center px-4 border-b border-white/10 overflow-hidden whitespace-nowrap bg-[#0a7c7c]">
        <Link to="/" className="flex items-center justify-center active:scale-95 transition-transform w-full">
            {isSidebarOpen ? (
              <motion.img
                src="/logo.png"
                alt="MedsSeva Logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-10 w-auto object-contain max-w-[180px]"
              />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center mx-auto">
                <img src="/logo.png" alt="MedsSeva Logo" className="w-full h-full object-contain" />
              </div>
            )}
          </Link>
        </div>

     
        <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1.5 custom-scrollbar scroll-smooth">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group flex items-center h-11 rounded-xl transition-all duration-200 select-none",
                  isSidebarOpen ? "px-3.5" : "justify-center px-0",
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/15" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3.5 text-sm truncate"
                  >
                    {item.title}
                  </motion.span>
                )}
                
                {isSidebarOpen && isActive && (
                  <motion.div layoutId="activeIndicator" className="ml-auto bg-primary-foreground/30 w-1.5 h-1.5 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>


        <div className="p-3 border-t border-border/50 bg-muted/10">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-3.5 justify-center md:justify-start"
          >
            <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3.5 text-xs font-medium">Collapse Sidebar</span>}
          </button>
        </div>
      </motion.aside>


      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black md:hidden"
            />
           
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card flex flex-col h-full shadow-2xl md:hidden"
            >
         <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0a7c7c]">
                <div className="flex items-center">
                  <img src="/logo.png" alt="MedsSeva Logo" className="h-9 w-auto object-contain" />
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center h-12 px-4 rounded-xl transition-colors",
                        isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 mr-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
        
    
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border/80 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 flex-shrink-0 shadow-sm shadow-border/10">
          <div className="flex items-center gap-3 md:gap-6">
        
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 md:hidden hover:bg-muted rounded-xl text-muted-foreground active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>

          
            <div className="flex items-center text-sm font-medium text-muted-foreground select-none overflow-hidden truncate max-w-[180px] md:max-w-full">
              <span className="hover:text-foreground transition-colors">LMS Admin</span>
              <ChevronRight className="w-4 h-4 mx-1.5 flex-shrink-0 opacity-50" />
              <span className="text-foreground font-semibold truncate">{activeItem.title}</span>
            </div>
          </div>

      
          <div className="flex items-center gap-3.5">
            
          
            <div className="hidden sm:inline-flex items-center h-8 bg-accent/40 text-accent-foreground rounded-full border border-primary/10 px-3 text-[11px] font-bold uppercase tracking-wider select-none shadow-sm">
              {user?.role.replace('_', ' ')}
            </div>

         
    <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh current page data"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/8 hover:bg-primary/15 text-primary font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
         <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-xl border border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all">
              <Bell className="w-[19px] h-[19px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card" />
            </button>
            <div className="w-px h-6 bg-border/60 hidden md:block mx-0.5" />

     
          

          
            <div className="w-px h-6 bg-border/60 hidden md:block mx-0.5" />

         
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 pl-1 pr-1.5 md:pr-2 py-1 rounded-full border border-border/60 hover:bg-muted/50 transition-colors select-none active:scale-95"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <User2 className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left text-xs font-medium select-none">
                  <span className="text-foreground font-semibold leading-tight">{user?.name}</span>
                  <span className="text-muted-foreground text-[10px] font-normal leading-none mt-0.5">{user?.email}</span>
                </div>
              </button>

   
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 z-20 bg-card border border-border rounded-xl shadow-xl py-2 origin-top-right"
                    >
                      <div className="px-4 py-2.5 border-b border-border/50 md:hidden">
                        <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 font-medium transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out Session</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

  
      

    
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background custom-scrollbar relative">
       
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="h-full max-w-7xl mx-auto flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

 

    </div>
  );
};


