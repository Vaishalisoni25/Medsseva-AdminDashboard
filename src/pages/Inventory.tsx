import React, { useState, useEffect } from 'react';
import { useInventoryQuery, useInventoryTransactionsQuery, useInventorySuppliersQuery, useInventoryAnalyticsQuery } from '@/hooks/useAdminQueries';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import {
  fetchInventoryItems,
  fetchTransactions,
  fetchAnalytics,
  fetchSuppliers,
  createInventoryItem,
  recordStockIn,
  recordStockOut,
  recordAdjustment,
} from '../redux/slices/inventorySlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Calendar,
  ShieldAlert,
  X,
  Check,
  PackageSearch,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../components/Toast';

export const InventoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, transactions, analytics, loading, saving, error } = useAppSelector(state => state.inventory);
  const { user } = useAppSelector(state => state.auth);
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'reagents' | 'consumables'>('reagents');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [opType, setOpType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED'>('STOCK_IN');
  const [reason, setReason] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newItemType, setNewItemType] = useState('REAGENT');
  const [newUnit, setNewUnit] = useState('');
  const [newMinThreshold, setNewMinThreshold] = useState(0);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newPurchaseCost, setNewPurchaseCost] = useState('');

 useInventoryQuery({});
  useInventoryTransactionsQuery({});
  useInventoryAnalyticsQuery();
  useInventorySuppliersQuery();
  useEffect(() => {
    if (error) toastError(error);
  }, [error]);

  const reagents = items.filter(i => i.itemType === 'REAGENT' || i.itemType === 'CHEMICAL' || i.itemType === 'TEST_KIT');
  const consumables = items.filter(i => i.itemType === 'CONSUMABLE' || i.itemType === 'COLLECTION_KIT');

  const lowStockCount = analytics?.lowStock ?? 0;
  const outOfStockCount = analytics?.outOfStock ?? 0;
  const totalLowItems = lowStockCount + outOfStockCount;

  const handleSubmitOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryItemId || quantity <= 0) return;

    const payload = { inventoryItemId, quantity, reason, referenceNumber, remarks };
    let result: any;

    if (opType === 'STOCK_IN') {
      result = await dispatch(recordStockIn(payload));
    } else if (opType === 'STOCK_OUT') {
      result = await dispatch(recordStockOut(payload));
    } else {
      result = await dispatch(recordAdjustment({ ...payload, transactionType: opType }));
    }

    if (result.meta.requestStatus === 'fulfilled') {
      success('Stock operation recorded successfully.');
      dispatch(fetchTransactions({}));
      dispatch(fetchAnalytics());
      setIsStockModalOpen(false);
      setInventoryItemId('');
      setQuantity(1);
      setReason('');
      setReferenceNumber('');
      setRemarks('');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(createInventoryItem({
      sku: newSku,
      name: newName,
      category: newCategory,
      itemType: newItemType,
      unit: newUnit,
      minThreshold: newMinThreshold,
      expiryDate: newExpiryDate || undefined,
      purchaseCost: newPurchaseCost ? parseFloat(newPurchaseCost) : undefined,
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      success('Inventory item added successfully.');
      setIsAddItemOpen(false);
      setNewSku(''); setNewName(''); setNewCategory(''); setNewUnit('');
      setNewMinThreshold(0); setNewExpiryDate(''); setNewPurchaseCost('');
      dispatch(fetchAnalytics());
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="h-7 w-7 text-teal-600" /> Reagents & Consumables Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Tightly coupled logistics manager mapping clinical diagnostics runs to laboratory asset pools automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddItemOpen(true)}
            className="px-4 py-2 border border-[#006D6F] text-[#006D6F] rounded-lg text-xs font-black flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="px-4 py-2 bg-[#006D6F] hover:bg-[#004B4D] text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md"
          >
            <Plus className="h-4 w-4" /> Record Stock Audit
          </button>
        </div>
      </div>

      {totalLowItems > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start text-amber-800">
          <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 animate-bounce" />
          <div>
            <div className="text-sm font-extrabold tracking-tight uppercase">Low Laboratory Capacity Alert</div>
            <p className="text-xs font-medium opacity-90 mt-0.5">
              There are {totalLowItems} critical chemical packs/vials nearing depletion limiters. Perform outward PO releases to prevent TAT lag.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-teal-50 rounded-bl-[50px] flex items-center justify-center">
            <Boxes className="h-6 w-6 text-teal-600 mr-[-10px] mt-[-10px]" />
          </div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Registered Reagents</h3>
          <div className="text-3xl font-black text-foreground mt-2">{reagents.length} <span className="text-xs text-muted-foreground font-bold">Chemical Skus</span></div>
          <div className="text-[10px] font-bold text-teal-600 bg-teal-50 w-max px-2 py-0.5 rounded mt-3">Tightly Coupled with CBC / HbA1c Runs</div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-50 rounded-bl-[50px] flex items-center justify-center">
            <PackageSearch className="h-6 w-6 text-indigo-600 mr-[-10px] mt-[-10px]" />
          </div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Active Consumables</h3>
          <div className="text-3xl font-black text-foreground mt-2">{consumables.length} <span className="text-xs text-muted-foreground font-bold">Pack Items</span></div>
          <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 w-max px-2 py-0.5 rounded mt-3">Vials, Needle Gauges & Microswabs</div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden border-l-4 border-l-amber-500">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-50 rounded-bl-[50px] flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-600 mr-[-10px] mt-[-10px]" />
          </div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Restock Thresholds</h3>
          <div className="text-3xl font-black text-amber-600 mt-2">{totalLowItems} <span className="text-xs text-muted-foreground font-bold">Breached</span></div>
          <div className="text-[10px] font-bold text-amber-600 bg-amber-50 w-max px-2 py-0.5 rounded mt-3">Auto-reorder triggers pending</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex border-b bg-muted/30 select-none">
            <button
              onClick={() => setActiveTab('reagents')}
              className={cn("px-6 py-4 text-xs font-black border-b-2 tracking-wider uppercase transition-all flex items-center gap-2", activeTab === 'reagents' ? "border-[#006D6F] text-[#006D6F] bg-card" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              <Boxes className="h-4 w-4" /> 1. Reagents Matrix
            </button>
            <button
              onClick={() => setActiveTab('consumables')}
              className={cn("px-6 py-4 text-xs font-black border-b-2 tracking-wider uppercase transition-all flex items-center gap-2", activeTab === 'consumables' ? "border-[#006D6F] text-[#006D6F] bg-card" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              <PackageSearch className="h-4 w-4" /> 2. Phlebotomy Consumables
            </button>
          </div>

       {loading ? (
            <div className="overflow-x-auto animate-pulse">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {[1, 2, 3, 4, 5].map(i => (
                      <th key={i} className="px-6 py-3">
                        <div className="h-2.5 bg-muted rounded w-20" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="h-3.5 bg-muted rounded w-36 mb-1.5" />
                        <div className="h-2.5 bg-muted rounded w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-muted rounded w-20" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-4 bg-muted rounded w-12 ml-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 bg-muted rounded w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-muted rounded w-20" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b">
                  {activeTab === 'reagents' ? (
                    <tr>
                      <th className="px-6 py-3">Reagent Sku</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3 text-right">Available Stock</th>
                      <th className="px-6 py-3">Expiry Node</th>
                      <th className="px-6 py-3">Threshold Class</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-3">Consumable Item</th>
                      <th className="px-6 py-3">Unit Type</th>
                      <th className="px-6 py-3 text-right">Global Stock</th>
                      <th className="px-6 py-3">Min Threshold</th>
                      <th className="px-6 py-3">Capacity Status</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y text-xs font-medium">
                  {activeTab === 'reagents' ? (
                    reagents.map(r => (
                      <tr key={r.id} className="hover:bg-muted/10">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-800">{r.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{r.sku} • {r.supplier?.name || r.manufacturer || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{r.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-extrabold font-mono text-slate-800">{r.currentStock}</span>
                          <span className="text-[10px] font-black text-slate-400 ml-1">{r.unit}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('en-IN') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                            r.stockStatus === 'IN_STOCK' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            r.stockStatus === 'EXPIRED' ? "bg-gray-100 text-gray-600 border-gray-300" :
                            "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          )}>
                            {r.stockStatus?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    consumables.map(c => (
                      <tr key={c.id} className="hover:bg-muted/10">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-800">{c.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{c.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">{c.itemType}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-extrabold font-mono text-slate-800">{c.currentStock}</span>
                          <span className="text-[10px] font-black text-slate-400 ml-1">{c.unit}</span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-500">
                          {c.minThreshold} {c.unit}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                            c.stockStatus === 'IN_STOCK' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {c.stockStatus?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="xl:col-span-4 bg-card border rounded-2xl p-5 shadow-sm flex flex-col h-[500px]">
          <h3 className="text-sm font-black flex items-center gap-2 border-b pb-3 uppercase tracking-wider text-slate-700 mb-3">
            <History className="h-4 w-4 text-slate-500" /> Stock Action Log
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin pr-1">
            {transactions.map(tx => (
              <div key={tx.id} className="border rounded-xl p-3 flex gap-3 items-start bg-muted/20">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5",
                  tx.transactionType === 'STOCK_IN' || tx.transactionType === 'TRANSFER_IN'
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                    : "bg-amber-50 border-amber-100 text-amber-600"
                )}>
                  {tx.transactionType === 'STOCK_IN' || tx.transactionType === 'TRANSFER_IN'
                    ? <ArrowUpRight className="h-4 w-4" />
                    : <ArrowDownRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div className="text-xs font-black text-slate-800 truncate">{tx.inventoryItem?.name || '-'}</div>
                    <div className="text-[10px] font-black text-slate-500 whitespace-nowrap">
                      {['STOCK_IN', 'TRANSFER_IN'].includes(tx.transactionType) ? '+' : '-'}{tx.quantity}
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase truncate">Ref: {tx.referenceNumber || '-'}</p>
                  {tx.remarks && <p className="text-[10px] font-medium italic text-slate-600 mt-1 leading-relaxed">"{tx.remarks}"</p>}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                    <span className="text-[8px] font-black bg-white text-slate-500 border px-1.5 py-0.5 rounded uppercase">{tx.transactionType}</span>
                    <span className="text-[9px] font-bold text-slate-400">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isStockModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setIsStockModalOpen(false)} className="fixed inset-0 bg-slate-950 z-[90] cursor-pointer backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="fixed inset-0 m-auto h-max max-w-lg w-full bg-background rounded-2xl border border-border z-[100] shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-[#006D6F] text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-teal-100" />
                  <h3 className="text-base font-black tracking-tight">Manual Stock Operation Audit</h3>
                </div>
                <button onClick={() => setIsStockModalOpen(false)} className="hover:bg-white/10 p-1 rounded text-teal-100"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSubmitOperation} className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-black">Operation Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGED', 'EXPIRED'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setOpType(t)}
                        className={cn("px-3 py-1.5 rounded text-xs font-black border transition-all",
                          opType === t ? "bg-[#006D6F] text-white border-[#006D6F]" : "border-border text-muted-foreground hover:text-foreground"
                        )}>
                        {t.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black">Operation Quantity *</label>
                    <input required type="number" min={1} className="w-full p-2 border text-sm rounded font-mono" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black">Reference Number</label>
                    <input type="text" placeholder="e.g. PO-82739" className="w-full p-2 border text-sm rounded" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">Target Inventory SKU *</label>
                  <select required className="w-full p-2 border text-sm rounded bg-card font-medium" value={inventoryItemId} onChange={e => setInventoryItemId(e.target.value)}>
                    <option value="">-- Select Laboratory Asset --</option>
                    <optgroup label="Reagents / Chemicals / Test Kits">
                      {reagents.map(r => <option key={r.id} value={r.id}>{r.name} ({r.currentStock} {r.unit})</option>)}
                    </optgroup>
                    <optgroup label="Consumables / Collection Kits">
                      {consumables.map(c => <option key={c.id} value={c.id}>{c.name} ({c.currentStock} {c.unit})</option>)}
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">Reason</label>
                  <input type="text" placeholder="Reason for this operation" className="w-full p-2 border text-sm rounded" value={reason} onChange={e => setReason(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">Remarks / Narrative</label>
                  <textarea className="w-full p-2 border text-sm rounded min-h-[70px]" placeholder="Internal justification notes..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-xs border font-bold rounded">Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2 text-xs bg-[#006D6F] text-white font-black rounded flex items-center gap-1 shadow hover:bg-[#004B4D] disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Commit Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddItemOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setIsAddItemOpen(false)} className="fixed inset-0 bg-slate-950 z-[90] cursor-pointer backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="fixed inset-0 m-auto h-max max-w-lg w-full bg-background rounded-2xl border border-border z-[100] shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-[#006D6F] text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-teal-100" />
                  <h3 className="text-base font-black tracking-tight">Add Inventory Item</h3>
                </div>
                <button onClick={() => setIsAddItemOpen(false)} className="hover:bg-white/10 p-1 rounded text-teal-100"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black">SKU *</label>
                    <input required type="text" className="w-full p-2 border text-sm rounded font-mono" value={newSku} onChange={e => setNewSku(e.target.value)} placeholder="e.g. CBC-RGT-01" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black">Item Type *</label>
                    <select required className="w-full p-2 border text-sm rounded bg-card" value={newItemType} onChange={e => setNewItemType(e.target.value)}>
                      <option value="REAGENT">Reagent</option>
                      <option value="CONSUMABLE">Consumable</option>
                      <option value="CHEMICAL">Chemical</option>
                      <option value="COLLECTION_KIT">Collection Kit</option>
                      <option value="TEST_KIT">Test Kit</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">Item Name *</label>
                  <input required type="text" className="w-full p-2 border text-sm rounded" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Hematology CBC Reagent Pack" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black">Category *</label>
                    <input required type="text" className="w-full p-2 border text-sm rounded" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Hematology" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black">Unit *</label>
                    <input required type="text" className="w-full p-2 border text-sm rounded" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="e.g. Kits, Units, Liters" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black">Min Threshold</label>
                    <input type="number" min={0} className="w-full p-2 border text-sm rounded" value={newMinThreshold} onChange={e => setNewMinThreshold(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black">Purchase Cost (₹)</label>
                    <input type="number" min={0} className="w-full p-2 border text-sm rounded" value={newPurchaseCost} onChange={e => setNewPurchaseCost(e.target.value)} placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">Expiry Date</label>
                  <input type="date" className="w-full p-2 border text-sm rounded" value={newExpiryDate} onChange={e => setNewExpiryDate(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddItemOpen(false)} className="px-4 py-2 text-xs border font-bold rounded">Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2 text-xs bg-[#006D6F] text-white font-black rounded flex items-center gap-1 shadow hover:bg-[#004B4D] disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Add Item
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