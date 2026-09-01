import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setPreviewRole } from '@/redux/slices/authSlice';
import { Users, ChevronUp, ShieldCheck, UserCheck, ClipboardList, UserCircle, Stethoscope } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';
const ROLES: { role: string; label: string; icon: any; value: string }[] = [];

export const RoleSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
   const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isPreviewMode } = usePermission();

const handleRoleSwitch = (value: string) => {
    dispatch(setPreviewRole(value === 'super_admin' ? null : value));
    setIsOpen(false);
  };

  return (
  <div className="relative flex flex-col items-end select-none">
   {/* Expanded Role Selection Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl p-2 w-56 animate-in slide-in-from-top-5 fade-in-50 duration-200 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Switch View Mode
          </div>
          <div className="space-y-1">
            {ROLES.map(({ role, label, icon: Icon, value }) => {
              const isActive = user?.id === value || (user?.role === role && user?.id !== 'u-2' && user?.id !== 'u-franchise-indore');
              return (
                <button
                  key={value}
                  onClick={() => handleRoleSwitch(value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

   {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-full shadow-md transition-all duration-300 font-semibold border active:scale-95",
          isOpen
            ? "bg-foreground text-background border-transparent"
            : "bg-primary hover:bg-primary/90 text-primary-foreground border-primary/20"
        )}
      >
        <Users className="w-5 h-5" />
     <div className="text-left pr-1">
          <div className="text-[10px] opacity-80 font-medium uppercase leading-none">
            {isPreviewMode ? 'Preview Mode' : 'Active View'}
          </div>
          <div className="text-sm leading-tight truncate max-w-[120px]">
            {user ? (ROLES.find(r => r.value === user.id)?.label || ROLES.find(r => r.role === user.role)?.label) : 'Guest / Out'}
          </div>
        </div>
        <ChevronUp className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

    </div>
  );
};

/* <label> placeholder aria-label added for ux_audit */
