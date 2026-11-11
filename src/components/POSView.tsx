"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Product, ProductVariant, CartItem } from "@/types";
import { formatRupiah, getProductTheme } from "@/lib/format";
import { playBeep, playErrorBuzz } from "@/lib/audio";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Percent,
  ShoppingBag,
  ArrowRight,
  Layers,
  X,
} from "lucide-react";

interface POSViewProps {
  products: Product[];
  categories: { id: string; nama: string; count: number }[];
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
  onOpenPayment: () => void;
  nextTrxNo: number;
}

export function POSView({
  products,
  categories,
  cart,
  onUpdateCart,
  onOpenPayment,
  nextTrxNo,
}: POSViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [discountType, setDiscountType] = useState<"rp" | "persen">("rp");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F2" && cart.length > 0) {
        e.preventDefault();
        onOpenPayment();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, onOpenPayment]);

  const cartStockUsed = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((item) => {
      map[item.pid] = (map[item.pid] || 0) + item.qty;
    });
    return map;
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "Semua" || p.kategori === selectedCategory;
      const matchQuery =
        !searchQuery ||
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kategori.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    const used = cartStockUsed[product.id] || 0;
    if (product.stok - used <= 0) {
      playErrorBuzz();
      return;
    }

    playBeep();
    const existingIndex = cart.findIndex(
      (item) => item.pid === product.id && item.varian === variant.nama
    );

    if (existingIndex > -1) {
      const nextCart = [...cart];
      nextCart[existingIndex].qty += 1;
      onUpdateCart(nextCart);
    } else {
      onUpdateCart([
        ...cart,
        {
          pid: product.id,
          nama: product.nama,
          varian: variant.nama,
          harga: variant.harga,
          qty: 1,
          foto: product.foto,
          kategori: product.kategori,
        },
      ]);
    }
  };

  const handleProductCardClick = (product: Product) => {
    if (product.varian.length === 1) {
      handleAddToCart(product, product.varian[0]);
    } else {
      setVariantModalProduct(product);
      playBeep();
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const item = cart[index];
    const product = products.find((p) => p.id === item.pid);
    const used = cartStockUsed[item.pid] || 0;

    if (delta > 0 && product && product.stok - used <= 0) {
      playErrorBuzz();
      return;
    }

    playBeep();
    const nextCart = [...cart];
    nextCart[index].qty += delta;

    if (nextCart[index].qty <= 0) {
      nextCart.splice(index, 1);
    }
    onUpdateCart(nextCart);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    playBeep();
    onUpdateCart([]);
    setDiscountValue(0);
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === "persen") {
      const pct = Math.min(100, Math.max(0, discountValue));
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const grandTotal = Math.max(0, subtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Product Catalog Section */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top search & category chips */}
        <div className="px-4 lg:px-8 py-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari menu... (tekan /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-full bg-card shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-foreground font-medium transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <span className="text-xs text-muted-foreground font-bold hidden sm:inline-block">
              {filteredProducts.length} Menu Tersedia
            </span>
          </div>

          {/* Category Pills (High Contrast, No outline) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("Semua");
                playBeep();
              }}
              style={selectedCategory === "Semua" ? { backgroundColor: "var(--primary)" } : undefined}
              className={`px-4 py-2 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === "Semua"
                  ? "text-white shadow-md shadow-black/10 scale-102"
                  : "bg-card text-foreground hover:bg-muted shadow-xs"
              }`}
            >
              Semua
              <span
                style={selectedCategory === "Semua" ? { color: "var(--primary)" } : undefined}
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  selectedCategory === "Semua" ? "bg-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {products.length}
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.nama;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.nama);
                    playBeep();
                  }}
                  style={isSelected ? { backgroundColor: "var(--primary)" } : undefined}
                  className={`px-4 py-2 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "text-white shadow-md shadow-black/10 scale-102"
                      : "bg-card text-foreground hover:bg-muted shadow-xs"
                  }`}
                >
                  {cat.nama}
                  <span
                    style={isSelected ? { color: "var(--primary)" } : undefined}
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected ? "bg-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-40 pt-2">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-foreground">Menu tidak ditemukan</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Coba gunakan kata kunci lain atau pilih kategori &quot;Semua&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredProducts.map((p) => {
                const used = cartStockUsed[p.id] || 0;
                const remainingStock = p.stok - used;
                const isOutOfStock = remainingStock <= 0;
                const minPrice = Math.min(...p.varian.map((v) => v.harga));
                const theme = getProductTheme(p.nama, p.kategori);

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleProductCardClick(p)}
                    className={`group relative flex flex-col justify-between p-4 rounded-3xl text-left transition-all duration-200 select-none ${
                      isOutOfStock
                        ? "bg-muted/40 opacity-50 cursor-not-allowed"
                        : "bg-card shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-98 cursor-pointer"
                    }`}
                  >
                    {/* Visual food illustration / photo */}
                    <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden mb-3.5 flex items-center justify-center bg-muted/30">
                      {p.foto ? (
                        <img
                          src={p.foto}
                          alt={p.nama}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${theme.bg}`}
                        >
                          <span className="text-4xl sm:text-5xl">{theme.icon}</span>
                        </div>
                      )}

                      {/* Stock Pill */}
                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                          isOutOfStock
                            ? "bg-red-500 text-white"
                            : remainingStock <= 5
                            ? "bg-amber-500 text-white animate-pulse"
                            : "bg-black/60 text-white"
                        }`}
                      >
                        {isOutOfStock
                          ? "Habis"
                          : remainingStock <= 5
                          ? `Sisa ${remainingStock}`
                          : `Stok ${remainingStock}`}
                      </span>

                      {/* Quantity in cart badge */}
                      {used > 0 && (
                        <span
                          style={{ backgroundColor: "var(--primary)" }}
                          className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-black text-white shadow-md animate-bump"
                        >
                          {used}x
                        </span>
                      )}

                      {/* Multiple variant indicator */}
                      {p.varian.length > 1 && (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {p.varian.length} varian
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-0.5">
                        {p.kategori}
                      </span>
                      <h4 className="font-extrabold text-sm text-foreground line-clamp-1 leading-snug">
                        {p.nama}
                      </h4>
                    </div>

                    {/* Price and Add button */}
                    <div className="flex items-center justify-between mt-3 pt-2">
                      <div>
                        {p.varian.length > 1 && (
                          <span className="text-[10px] text-muted-foreground block -mb-0.5 font-bold">mulai</span>
                        )}
                        <span
                          style={{ color: "var(--primary)" }}
                          className="font-black text-sm tabular-nums"
                        >
                          {formatRupiah(minPrice)}
                        </span>
                      </div>

                      <div
                        style={!isOutOfStock ? { backgroundColor: "var(--primary)" } : undefined}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                          isOutOfStock
                            ? "bg-muted text-muted-foreground"
                            : "text-white shadow-xs group-hover:scale-110"
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Order Ticket (Cart) Panel */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-40 w-full sm:w-96 bg-card flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 ${
          isMobileCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Ticket Header */}
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-foreground tracking-tight">Pesanan</h3>
              <span
                style={{ color: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black"
              >
                #{String(nextTrxNo).padStart(4, "0")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-bold">
              {totalItemsCount} item dalam keranjang
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                title="Kosongkan Pesanan"
                className="p-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden p-2 rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
              <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <h4 className="font-extrabold text-foreground">Pesanan masih kosong</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Ketuk menu di katalog untuk menambahkan pesanan.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.pid}_${item.varian}_${idx}`}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors animate-pop-in"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <h5 className="font-extrabold text-sm text-foreground truncate">{item.nama}</h5>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-bold">
                    <span style={{ color: "var(--primary)" }}>{item.varian}</span>
                    <span>·</span>
                    <span className="tabular-nums">{formatRupiah(item.harga)}</span>
                  </p>
                </div>

                {/* Stepper Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-card rounded-full p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 text-foreground transition-all cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-black text-xs tabular-nums text-foreground">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 text-foreground transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-black text-sm tabular-nums text-foreground min-w-[68px] text-right">
                    {formatRupiah(item.harga * item.qty)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculations and Checkout CTA */}
        <div className="p-5 pb-36 lg:pb-32 space-y-3 bg-muted/20">
          {/* Discount Field */}
          <div className="p-3 rounded-2xl bg-card shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-muted-foreground flex items-center gap-1.5">
                <Percent style={{ color: "var(--primary)" }} className="w-3.5 h-3.5" />
                Diskon Transaksi
              </span>
              <div className="flex bg-muted rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => setDiscountType("rp")}
                  style={discountType === "rp" ? { backgroundColor: "var(--primary)" } : undefined}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    discountType === "rp" ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("persen")}
                  style={discountType === "persen" ? { backgroundColor: "var(--primary)" } : undefined}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    discountType === "persen" ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={discountValue || ""}
                placeholder="0"
                onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-muted/50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-foreground tabular-nums font-bold"
              />
              {discountAmount > 0 && (
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                  -{formatRupiah(discountAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Subtotal and Total */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground font-bold">
              <span>Subtotal</span>
              <span className="tabular-nums font-black text-foreground">
                {formatRupiah(subtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-foreground pt-1">
              <span>Total Tagihan</span>
              <span style={{ color: "var(--primary)" }} className="text-xl font-black tabular-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              playBeep();
              onOpenPayment();
            }}
            style={cart.length > 0 ? { backgroundColor: "var(--primary)" } : undefined}
            className={`w-full py-4 rounded-full font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              cart.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : "text-white active:scale-98 shadow-xl shadow-black/10"
            }`}
          >
            <span>Bayar Sekarang (F2)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Floating Action Cart Bubble for Mobile */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-22 sm:bottom-24 left-4 right-4 z-40 animate-pop-in">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            style={{ backgroundColor: "var(--primary)" }}
            className="w-full text-white py-3.5 px-5 rounded-full shadow-2xl flex items-center justify-between font-black cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                style={{ color: "var(--primary)" }}
                className="w-6 h-6 rounded-full bg-white text-xs flex items-center justify-center font-black"
              >
                {totalItemsCount}
              </span>
              <span>Lihat Pesanan</span>
            </div>
            <span className="text-base tabular-nums font-black">{formatRupiah(grandTotal)}</span>
          </button>
        </div>
      )}

      {/* Variant Selector Popover Modal */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl animate-pop-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Pilih Varian
                </span>
                <h4 className="font-black text-base text-foreground">
                  {variantModalProduct.nama}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {variantModalProduct.varian.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    handleAddToCart(variantModalProduct, v);
                    setVariantModalProduct(null);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-all cursor-pointer group"
                >
                  <span className="font-extrabold text-sm text-foreground">
                    {v.nama}
                  </span>
                  <span style={{ color: "var(--primary)" }} className="font-black text-sm tabular-nums">
                    {formatRupiah(v.harga)}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setVariantModalProduct(null)}
              className="w-full py-3 rounded-full bg-muted/60 text-xs font-black text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
