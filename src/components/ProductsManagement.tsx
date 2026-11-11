"use client";

import React, { useState, useMemo } from "react";
import { Product } from "@/types";
import { formatRupiah, getProductTheme } from "@/lib/format";
import { playBeep } from "@/lib/audio";
import {
  Plus,
  Search,
  FolderPlus,
  Image as ImageIcon,
  X,
  Trash2,
} from "lucide-react";

interface ProductsManagementProps {
  products: Product[];
  categories: { id: string; nama: string; count: number }[];
  onRefresh: () => void;
}

export function ProductsManagement({
  products,
  categories,
  onRefresh,
}: ProductsManagementProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockAddAmount, setStockAddAmount] = useState<number>(10);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  const [formName, setFormName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formStock, setFormStock] = useState<number>(0);
  const [formPhoto, setFormPhoto] = useState<string>("");
  const [formVariants, setFormVariants] = useState<{ nama: string; harga: number }[]>([
    { nama: "Reguler", harga: 0 },
  ]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

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

  const openAddForm = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory(categories[0]?.nama || "Umum");
    setFormStock(0);
    setFormPhoto("");
    setFormVariants([{ nama: "Reguler", harga: 0 }]);
    setFormError("");
    setIsFormOpen(true);
    playBeep();
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.nama);
    setFormCategory(p.kategori);
    setFormStock(p.stok);
    setFormPhoto(p.foto || "");
    setFormVariants(
      p.varian.length > 0
        ? p.varian.map((v) => ({ nama: v.nama, harga: v.harga }))
        : [{ nama: "Reguler", harga: 0 }]
    );
    setFormError("");
    setIsFormOpen(true);
    playBeep();
  };

  const openStockModal = (p: Product) => {
    setStockProduct(p);
    setStockAddAmount(10);
    setIsStockModalOpen(true);
    playBeep();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 400 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormPhoto(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Nama produk wajib diisi");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        id: editingProduct?.id,
        nama: formName.trim(),
        kategori: formCategory,
        stok: formStock,
        foto: formPhoto,
        varian: formVariants,
      };

      const res = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setIsFormOpen(false);
      onRefresh();
      playBeep();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan produk");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Hapus produk "${p.nama}"?`)) return;

    try {
      const res = await fetch(`/api/products?id=${p.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setIsFormOpen(false);
      onRefresh();
      playBeep();
    } catch (e: any) {
      alert(e.message || "Gagal menghapus produk");
    }
  };

  const handleSaveStock = async () => {
    if (!stockProduct) return;
    try {
      const res = await fetch("/api/products/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stockProduct.id,
          delta: stockAddAmount,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setIsStockModalOpen(false);
      onRefresh();
      playBeep();
    } catch (e: any) {
      alert(e.message || "Gagal memperbarui stok");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newCategoryName.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setNewCategoryName("");
      onRefresh();
      playBeep();
    } catch (e: any) {
      alert(e.message || "Gagal menambah kategori");
    }
  };

  const handleDeleteCategory = async (cat: { id: string; nama: string; count: number }) => {
    if (cat.count > 0) {
      alert(`Kategori "${cat.nama}" masih digunakan oleh ${cat.count} produk.`);
      return;
    }
    if (!confirm(`Hapus kategori "${cat.nama}"?`)) return;

    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onRefresh();
      playBeep();
    } catch (e: any) {
      alert(e.message || "Gagal menghapus kategori");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 lg:p-8 pb-36">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            Produk &amp; Stok
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Katalog produk, manajemen varian harga, dan pengaturan kategori
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsCategoryModalOpen(true);
              playBeep();
            }}
            className="px-4 py-2.5 rounded-full bg-card shadow-xs text-foreground hover:bg-muted font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-primary" />
            <span>Kategori</span>
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="px-5 py-2.5 rounded-full bg-primary text-white hover:opacity-90 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-black/10"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (No outlines) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("Semua");
              playBeep();
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
              selectedCategory === "Semua"
                ? "bg-primary text-white shadow-xs"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCategory(c.nama);
                playBeep();
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                selectedCategory === c.nama
                  ? "bg-primary text-white shadow-xs"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {c.nama} ({c.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-card shadow-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>
      </div>

      {/* Products Grid / Cards (Clean borderless surface ladder) */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-36 sm:pb-40">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-3xl shadow-xs">
            <p className="font-bold text-sm text-foreground">Tidak ada produk ditemukan</p>
            <p className="text-xs mt-1">Coba sesuaikan kata kunci atau buat produk baru.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const theme = getProductTheme(p.nama, p.kategori);
            const isLow = p.stok <= 5;
            const isOut = p.stok <= 0;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-3xl bg-card shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-muted/40">
                    {p.foto ? (
                      <img src={p.foto} alt={p.nama} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-2xl ${theme.bg}`}>
                        {theme.icon}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-foreground truncate">{p.nama}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-muted/60 text-[10px] font-semibold text-muted-foreground">
                        {p.kategori}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs">
                      {p.varian.map((v, i) => (
                        <span key={i} className="text-muted-foreground text-[11px]">
                          {v.nama}: <b className="text-primary tabular-nums">{formatRupiah(v.harga)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums ${
                      isOut
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : isLow
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isOut ? "Habis" : `Stok: ${p.stok}`}
                  </span>

                  <button
                    type="button"
                    onClick={() => openStockModal(p)}
                    className="px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-xs font-bold cursor-pointer"
                  >
                    + Stok
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditForm(p)}
                    className="px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ubah
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Spacer Fisik Bawah agar tidak tertutup Bottom Nav */}
        <div className="h-32 w-full shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Add / Edit Product Modal (No outlines) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 sm:p-7 shadow-2xl animate-pop-in my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-foreground">
                {editingProduct ? "Ubah Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-semibold mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Misal: Kopi Susu Aren"
                  className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.nama}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground tabular-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Foto Produk
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {formPhoto ? (
                      <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {formPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormPhoto("")}
                        className="text-[11px] text-red-500 hover:underline block"
                      >
                        Hapus foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground">Varian &amp; Harga</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormVariants([...formVariants, { nama: "Large", harga: 0 }])
                    }
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Varian
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {formVariants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama varian"
                        value={v.nama}
                        onChange={(e) => {
                          const next = [...formVariants];
                          next[i].nama = e.target.value;
                          setFormVariants(next);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Harga (Rp)"
                        value={v.harga || ""}
                        onChange={(e) => {
                          const next = [...formVariants];
                          next[i].harga = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setFormVariants(next);
                        }}
                        className="w-28 px-3 py-1.5 text-xs rounded-xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground tabular-nums font-bold"
                      />
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...formVariants];
                            next.splice(i, 1);
                            setFormVariants(next);
                          }}
                          className="p-1 text-muted-foreground hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct)}
                    className="px-4 py-2.5 rounded-full text-red-500 hover:bg-red-500/10 text-xs font-bold mr-auto cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-muted/60 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-xs hover:opacity-90 shadow-md shadow-black/10 cursor-pointer"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Stock Modal */}
      {isStockModalOpen && stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs bg-card rounded-3xl p-6 shadow-2xl animate-pop-in">
            <h4 className="font-black text-base text-foreground mb-0.5">Tambah Stok</h4>
            <p className="text-xs text-muted-foreground mb-4">{stockProduct.nama}</p>

            <div className="space-y-3 mb-5">
              <input
                type="number"
                min="1"
                value={stockAddAmount}
                onChange={(e) => setStockAddAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-4 py-2.5 rounded-2xl bg-muted/40 font-black text-xl text-foreground tabular-nums text-center focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStockAddAmount(amt)}
                    className="py-1.5 rounded-xl bg-muted/50 text-xs font-bold hover:bg-muted"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-muted/60 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                className="flex-1 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl animate-pop-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-black text-base text-foreground">Kelola Kategori</h4>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4 pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/40 text-xs"
                >
                  <span className="font-semibold text-foreground">
                    {c.nama}{" "}
                    <span className="text-[10px] text-muted-foreground">({c.count} produk)</span>
                  </span>
                  <button
                    type="button"
                    disabled={c.count > 0}
                    onClick={() => handleDeleteCategory(c)}
                    className={`p-1 rounded-md ${
                      c.count > 0
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-red-500 hover:bg-red-500/10 cursor-pointer"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Kategori baru..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-full bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 cursor-pointer shrink-0"
              >
                Tambah
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-muted/60 text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
