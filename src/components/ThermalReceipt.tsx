"use client";

import React from "react";
import { Transaction, StoreSettings } from "@/types";
import { formatRupiah, formatDateTime } from "@/lib/format";

interface ThermalReceiptProps {
  transaction: Transaction | null;
  settings: StoreSettings;
}

export function ThermalReceipt({ transaction, settings }: ThermalReceiptProps) {
  if (!transaction) return null;

  return (
    <div id="thermal-receipt" className="hidden print:block text-black bg-white">
      <div className="text-center mb-2 pb-1 border-b border-dashed border-black">
        <h2 className="font-bold text-sm uppercase tracking-wide">{settings.nama || "ShrimpCashier"}</h2>
        {settings.alamat && <p className="text-[10px] leading-tight">{settings.alamat}</p>}
        {settings.telp && <p className="text-[10px] leading-tight">Telp: {settings.telp}</p>}
      </div>

      <div className="text-[10px] mb-2 pb-1 border-b border-dashed border-black leading-tight">
        <div className="flex justify-between">
          <span>No: {transaction.id}</span>
          <span>{transaction.metode.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu:</span>
          <span>{formatDateTime(transaction.waktu)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{transaction.kasir_nama}</span>
        </div>
      </div>

      <div className="text-[10px] mb-2 pb-1 border-b border-dashed border-black">
        {transaction.items.map((item, idx) => (
          <div key={idx} className="mb-1 leading-tight">
            <div className="font-medium">
              {item.nama} {item.varian && item.varian !== "Reguler" ? `(${item.varian})` : ""}
            </div>
            <div className="flex justify-between pl-2">
              <span>{item.qty} x {formatRupiah(item.harga)}</span>
              <span className="font-semibold">{formatRupiah(item.qty * item.harga)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] mb-2 pb-1 border-b border-dashed border-black leading-tight">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatRupiah(transaction.subtotal)}</span>
        </div>
        {transaction.diskon > 0 && (
          <div className="flex justify-between text-black">
            <span>Diskon:</span>
            <span>-{formatRupiah(transaction.diskon)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span>{formatRupiah(transaction.total)}</span>
        </div>
        <div className="flex justify-between pt-1">
          <span>Bayar ({transaction.metode.toUpperCase()}):</span>
          <span>{formatRupiah(transaction.bayar)}</span>
        </div>
        {transaction.metode === "tunai" && (
          <div className="flex justify-between">
            <span>Kembali:</span>
            <span>{formatRupiah(transaction.kembali)}</span>
          </div>
        )}
      </div>

      <div className="text-center text-[9px] pt-1 leading-tight italic">
        <p>{settings.footer || "Terima kasih atas kunjungan Anda!"}</p>
        <p className="mt-1 text-[8px] text-gray-500">Dicetak via ShrimpCashier</p>
      </div>
    </div>
  );
}
