import React from 'react';
import { Construction } from 'lucide-react';

export const FranchisesPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Construction className="h-10 w-10 text-primary" />
      </div>
      <span className="inline-block mb-4 px-3 py-1 text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary rounded-full border border-primary/20">
        Coming Soon
      </span>
      <h1 className="text-2xl font-bold text-foreground mb-3">Franchise Management</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        This module is currently under development and will be available in a future update.
      </p>
    </div>
  );
};