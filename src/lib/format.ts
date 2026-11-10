export function formatRupiah(n: number = 0): string {
  return "Rp" + Math.round(n || 0).toLocaleString("id-ID");
}

export function formatDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  return `${dateStr} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateKey(d: Date = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      lines.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    lines.push(row);
  }

  return lines.filter((r) => r.some((c) => c.trim().length > 0));
}

export function escapeCSVCell(v: any): string {
  const str = String(v == null ? "" : v);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}

// Product illustration color mapping and category badge colors
export function getProductTheme(name: string, category: string) {
  const s = `${name} ${category}`.toLowerCase();

  if (/matcha|teh hijau/.test(s)) {
    return { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: "🍵" };
  }
  if (/lemon|jeruk|orange|jus|soda|tea|teh/.test(s)) {
    return { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: "🍹" };
  }
  if (/kopi|coffee|americano|espresso|latte|cappuccino/.test(s)) {
    return { bg: "bg-amber-800/10 text-amber-800 dark:text-amber-200 border-amber-800/20", icon: "☕" };
  }
  if (/cokelat|chocolate|cocoa/.test(s)) {
    return { bg: "bg-orange-800/10 text-orange-700 dark:text-orange-300 border-orange-800/20", icon: "🍫" };
  }
  if (/nasi|rice|gorengan/.test(s)) {
    return { bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", icon: "🍛" };
  }
  if (/mie|noodle|ramen|bakso|soup/.test(s)) {
    return { bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: "🍜" };
  }
  if (/roti|toast|sandwich|bakery/.test(s)) {
    return { bg: "bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 border-yellow-600/20", icon: "🍞" };
  }
  if (/kentang|fries|snack|camilan|pisang/.test(s)) {
    return { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: "🍟" };
  }
  return { bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", icon: "🍽️" };
}
