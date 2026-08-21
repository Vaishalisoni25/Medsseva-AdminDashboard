import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { upsertPackage } from '../redux/slices/testSlice';
import { useEffect } from 'react';
import { usePackagesQuery } from '@/hooks/useAdminQueries';
import { MedicalPackage } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Layers, 
  Edit2, 
  Search, 
  Activity, 
  Check,
  X,
  Percent,
  Info,
  Save
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../components/Toast';

export const PackagesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const tests = useAppSelector(state => state.tests.tests);
  const packages = useAppSelector(state => state.tests.packages);

const { isLoading: pkgLoading } = usePackagesQuery();
const [pageLoading, setPageLoading] = useState(pkgLoading);

useEffect(() => {
    if (!pkgLoading) setPageLoading(false);
  }, [pkgLoading]);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MedicalPackage | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

 const { error } = useToast();

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(search.toLowerCase()) ||
    pkg.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDrawer = () => {
    setEditingPackage(null);
    setName('');
    setCode('');
    setDescription('');
    setPrice('');
    setDiscountedPrice('');
    setSelectedTestIds([]);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (pkg: MedicalPackage) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setCode(pkg.code);
    setDescription(pkg.description || '');
    setPrice(pkg.price.toString());
    setDiscountedPrice(pkg.discountedPrice?.toString() || '');
    setSelectedTestIds(pkg.testIds);
    setIsDrawerOpen(true);
  };

  const handleToggleTestSelection = (testId: string) => {
    setSelectedTestIds(prev => 
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  // Automatically calculate bundled test sum
  const calculateIndividualTotal = () => {
    return selectedTestIds.reduce((sum, id) => {
      const t = tests.find(test => test.id === id);
      return sum + (t?.discountedPrice || t?.price || 0);
    }, 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
 if (!name || !code || !price || selectedTestIds.length === 0) {
      error('Please fill essential details and select at least one test.');
      return;
    }
    const newPkg: MedicalPackage = {
      id: editingPackage?.id || `pkg-${Date.now()}`,
      code,
      name,
      description,
      price: parseFloat(price),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : undefined,
      testIds: selectedTestIds,
      status: editingPackage?.status || 'active'
    };

    dispatch(upsertPackage(newPkg));
    setIsDrawerOpen(false);
  };

  const getBundledTestNames = (pkg: MedicalPackage) => {
    return pkg.testIds
      .map(tid => tests.find(t => t.id === tid)?.name)
      .filter(Boolean)
      .join(', ');
  };

if (pageLoading) {
    return (
      <div className="space-y-6 pb-10 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded w-64" />
            <div className="h-4 bg-muted rounded w-96" />
          </div>
          <div className="h-9 bg-muted rounded-lg w-36" />
        </div>

        <div className="h-9 bg-muted rounded-lg w-80" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-16" />
                    <div className="h-5 bg-muted rounded w-40" />
                  </div>
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-muted rounded w-32" />
                  <div className="h-20 bg-muted/50 rounded-lg w-full" />
                </div>
              </div>
              <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                <div className="h-6 bg-muted rounded w-20" />
                <div className="h-8 w-8 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Wellness Package Builder</h1>
          <p className="text-sm text-muted-foreground">Bundle multiple diagnostics into complete health packages with special tariffs.</p>
        </div>
        
        <button 
          onClick={openCreateDrawer}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-black flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Construct Package
        </button>
      </div>

      {/* Search Row */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text"
          placeholder="Filter active packages..."
          className="w-full pl-9 pr-4 py-2 bg-card border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid View of Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map(pkg => {
          const savings = pkg.discountedPrice ? pkg.price - pkg.discountedPrice : 0;
          const pct = savings > 0 ? Math.round((savings / pkg.price) * 100) : 0;

          return (
            <motion.div 
              layout
              key={pkg.id} 
              className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden hover:border-primary/30 transition-all group flex flex-col"
            >
              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="bg-muted text-muted-foreground font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-border">
                      {pkg.code}
                    </span>
                    <h3 className="font-bold text-base text-foreground mt-1.5 group-hover:text-primary transition-colors">
                      {pkg.name}
                    </h3>
                  </div>
                  {pct > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-0.5">
                      <Percent className="h-2.5 w-2.5" /> {pct}% OFF
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {pkg.description || 'Comprehensive medical screenings bundled for complete full-body metabolic evaluation.'}
                </p>

                {/* Bundled Tests Tag list */}
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Bundled Lab Tests ({pkg.testIds.length})
                  </div>
                  <div className="text-xs text-foreground bg-muted/50 p-3 rounded-lg max-h-20 overflow-y-auto font-medium leading-relaxed scrollbar-thin border border-border/30">
                    {getBundledTestNames(pkg) || 'No tests allocated.'}
                  </div>
                </div>
              </div>

              {/* Bottom pricing row */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                <div>
                  {pkg.discountedPrice ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-primary">₹{pkg.discountedPrice}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{pkg.price}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-black text-foreground">₹{pkg.price}</span>
                  )}
                </div>
                <button 
                  onClick={() => openEditDrawer(pkg)}
                  className="p-2 rounded-lg border border-border hover:border-primary hover:text-primary bg-card shadow-sm transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Drawer System */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Scrim */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
              onClick={() => setIsDrawerOpen(false)}
            />
            
            {/* Workspace Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-background border-l border-border z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border bg-card flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-primary tracking-widest uppercase">Construct Master</div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editingPackage ? 'Edit Package Bundle' : 'Create Wellness Package'}
                  </h2>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-foreground">Package Display Name *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Full Body Health Checkup"
                      className="w-full p-2.5 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Billing Code *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. PKG-FBHC"
                      className="w-full p-2.5 bg-card border border-input rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Package Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Covers 30 metabolic limits..."
                      className="w-full p-2.5 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Select Tests Grid */}
                <div className="space-y-3 border border-border bg-card rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-primary uppercase flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" /> Select Laboratory Tests ({selectedTestIds.length} picked)
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {tests.map(test => {
                      const isPicked = selectedTestIds.includes(test.id);
                      return (
                        <button
                          type="button"
                          key={test.id}
                          onClick={() => handleToggleTestSelection(test.id)}
                          className={cn(
                            "p-2.5 text-left border rounded-lg text-xs transition-all flex justify-between items-center",
                            isPicked 
                              ? "bg-primary/5 border-primary font-bold text-primary" 
                              : "border-border hover:border-primary/40 bg-background text-foreground"
                          )}
                        >
                          <span className="truncate max-w-[160px]">{test.name}</span>
                          {isPicked ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground shrink-0">₹{test.discountedPrice || test.price}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Financials Calculator Box */}
                <div className="space-y-4 bg-muted/50 border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border text-xs text-muted-foreground">
                    <span>Sum of Single Test Tariffs:</span>
                    <span className="font-bold text-foreground">₹{calculateIndividualTotal()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1">
                        Base Package Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                        <input 
                          required
                          type="number" 
                          placeholder="1200"
                          className="w-full pl-7 p-2.5 bg-card border border-input rounded-lg text-sm font-bold outline-none"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        Discounted Special Offer
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm font-medium">₹</span>
                        <input 
                          type="number" 
                          placeholder="999"
                          className="w-full pl-7 p-2.5 bg-card border border-emerald-200 text-emerald-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                          value={discountedPrice}
                          onChange={(e) => setDiscountedPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {price && parseFloat(price) > calculateIndividualTotal() && calculateIndividualTotal() > 0 && (
                    <div className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] p-2.5 rounded-lg flex gap-2">
                      <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Warning: Package price is higher than buying the bundled tests individually (₹{calculateIndividualTotal()}).</span>
                    </div>
                  )}
                </div>

                {/* Drawer Sticky Footer Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <button 
                    type="button" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Save className="h-4 w-4" /> Commit Package
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
