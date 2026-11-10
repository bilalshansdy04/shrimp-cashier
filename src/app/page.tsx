"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Product, StoreSettings, Cashier, CartItem, Transaction } from "@/types";
import { TopHeader } from "@/components/TopHeader";
import { BottomNav } from "@/components/BottomNav";
import { POSView } from "@/components/POSView";
import { ProductsManagement } from "@/components/ProductsManagement";
import { HistoryView } from "@/components/HistoryView";
import { ReportsView } from "@/components/ReportsView";
import { SettingsView } from "@/components/SettingsView";
import { PinLoginModal } from "@/components/PinLoginModal";
import { PaymentModal } from "@/components/PaymentModal";
import { SuccessReceiptModal } from "@/components/SuccessReceiptModal";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { playCashChime, playBeep } from "@/lib/audio";

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<StoreSettings>({
    id: "default",
    nama: "ShrimpCashier",
    alamat: "",
    telp: "",
    footer: "Terima kasih sudah berbelanja!",
    rekening: "",
  });
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [categories, setCategories] = useState<{ id: string; nama: string; count: number }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentCashier, setCurrentCashier] = useState<Cashier | null>(null);

  // App Navigation & POS State
  const [activeTab, setActiveTab] = useState<string>("kasir");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [nextTrxNo, setNextTrxNo] = useState<number>(1);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<Transaction | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/state");
      const json = await res.json();
      if (json.success) {
        setSettings(json.data.settings);
        setCashiers(json.data.cashiers);
        setCategories(json.data.categories);
        setProducts(json.data.products);
        setNextTrxNo((json.data.todaySummary?.trxCount || 0) + 1);

        const savedCashierId = sessionStorage.getItem("shrimpcashier_session");
        if (savedCashierId) {
          const found = json.data.cashiers.find((c: Cashier) => c.id === savedCashierId);
          if (found) setCurrentCashier(found);
        }
      }
    } catch (e) {
      console.error("Error fetching POS state:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleLoginSuccess = (cashier: Cashier) => {
    setCurrentCashier(cashier);
    try {
      sessionStorage.setItem("shrimpcashier_session", cashier.id);
    } catch (e) {}
    playBeep();
  };

  const handleLogout = () => {
    setCurrentCashier(null);
    setCart([]);
    try {
      sessionStorage.removeItem("shrimpcashier_session");
    } catch (e) {}
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const grandTotal = subtotal;

  const handleSubmitTransaction = async ({
    metode,
    bayar,
  }: {
    metode: "tunai" | "qris" | "transfer";
    bayar: number;
  }) => {
    try {
      const payload = {
        items: cart,
        kasir_nama: currentCashier?.nama || "Kasir",
        subtotal,
        diskon: 0,
        total: grandTotal,
        metode,
        bayar,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      playCashChime();
      const newTrx: Transaction = json.data;

      setIsPaymentOpen(false);
      setCompletedTransaction(newTrx);
      setReceiptToPrint(newTrx);
      setCart([]);
      fetchState();
    } catch (err: any) {
      alert(err.message || "Gagal memproses transaksi");
      throw err;
    }
  };

  const handlePrint = (trx?: Transaction) => {
    const target = trx || completedTransaction;
    if (target) {
      setReceiptToPrint(target);
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const handleNewTransaction = () => {
    setCompletedTransaction(null);
    setActiveTab("kasir");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-4 animate-bounce">
          🦐
        </div>
        <h2 className="text-xl font-black tracking-tight">ShrimpCashier</h2>
        <p className="text-xs text-muted-foreground mt-1">Memuat database kasir...</p>
      </div>
    );
  }

  // PIN Login Modal
  if (!currentCashier) {
    return (
      <PinLoginModal
        cashiers={cashiers}
        settings={settings}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground select-none relative">
      {/* Top Header */}
      <TopHeader
        settings={settings}
        currentCashier={currentCashier}
        onLock={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {activeTab === "kasir" && (
          <POSView
            products={products}
            categories={categories}
            cart={cart}
            onUpdateCart={setCart}
            onOpenPayment={handleOpenPayment}
            nextTrxNo={nextTrxNo}
          />
        )}

        {activeTab === "produk" && (
          <ProductsManagement
            products={products}
            categories={categories}
            onRefresh={fetchState}
          />
        )}

        {activeTab === "riwayat" && (
          <HistoryView
            currentCashier={currentCashier}
            onPrintTransaction={(trx) => handlePrint(trx)}
          />
        )}

        {activeTab === "laporan" && <ReportsView />}

        {activeTab === "atur" && (
          <SettingsView
            settings={settings}
            cashiers={cashiers}
            currentCashier={currentCashier}
            onRefreshAll={fetchState}
          />
        )}
      </main>

      {/* Interactive Bottom Navigation Dock */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "produk" || tab === "atur") {
            if (currentCashier.peran !== "admin") {
              alert("Menu ini hanya dapat diakses oleh Admin.");
              return;
            }
          }
          setActiveTab(tab);
        }}
        currentCashier={currentCashier}
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        onLock={handleLogout}
      />

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          cart={cart}
          subtotal={subtotal}
          diskon={0}
          total={grandTotal}
          settings={settings}
          cashierName={currentCashier.nama}
          onClose={() => setIsPaymentOpen(false)}
          onSubmit={handleSubmitTransaction}
        />
      )}

      {/* Success Modal with Confetti */}
      {completedTransaction && (
        <SuccessReceiptModal
          transaction={completedTransaction}
          onPrint={() => handlePrint(completedTransaction)}
          onNewTransaction={handleNewTransaction}
        />
      )}

      {/* Hidden 58mm Thermal Print Layout */}
      <ThermalReceipt transaction={receiptToPrint} settings={settings} />
    </div>
  );
}
