CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_nama_unique` ON `categories` (`nama`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`nama` text NOT NULL,
	`harga` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`kategori` text NOT NULL,
	`stok` integer DEFAULT 0 NOT NULL,
	`foto` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`nama` text DEFAULT 'ShrimpCashier' NOT NULL,
	`alamat` text DEFAULT '',
	`telp` text DEFAULT '',
	`footer` text DEFAULT 'Terima kasih sudah berbelanja!',
	`rekening` text DEFAULT '',
	`theme_primary` text DEFAULT '#f97316',
	`theme_surface` text DEFAULT '#1a1c22',
	`custom_palettes` text DEFAULT '[]',
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`product_id` text NOT NULL,
	`nama` text NOT NULL,
	`varian` text NOT NULL,
	`harga` integer NOT NULL,
	`qty` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`waktu` text NOT NULL,
	`kasir_id` text,
	`kasir_nama` text NOT NULL,
	`subtotal` integer NOT NULL,
	`diskon` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`metode` text NOT NULL,
	`bayar` integer NOT NULL,
	`kembali` integer NOT NULL,
	`status` text DEFAULT 'selesai' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`kasir_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`nama_lengkap` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);