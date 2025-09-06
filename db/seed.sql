-- Seed data for EcoFinds

-- Insert categories
INSERT OR IGNORE INTO categories (name, description, icon) VALUES
('Electronics', 'Electronic devices and components', 'smartphone'),
('Clothing', 'Fashion and apparel items', 'shirt'),
('Books', 'Books, magazines, and educational materials', 'book'),
('Furniture', 'Home and office furniture', 'sofa'),
('Sports', 'Sports equipment and accessories', 'activity'),
('Toys', 'Toys and games for all ages', 'toy'),
('Beauty', 'Beauty and personal care products', 'sparkles'),
('Home & Garden', 'Home improvement and gardening items', 'home'),
('Automotive', 'Car parts and automotive accessories', 'car'),
('Art & Crafts', 'Art supplies and craft materials', 'palette');

-- Insert demo users (password is 'password123' hashed)
INSERT OR IGNORE INTO users (username, email, password_hash) VALUES
('eco_enthusiast', 'eco@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('green_seller', 'green@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('recycle_master', 'recycle@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('sustainable_living', 'sustainable@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert demo products
INSERT OR IGNORE INTO products (title, description, price, category_id, seller_id, image_url) VALUES
('Vintage Wooden Bookshelf', 'Beautiful reclaimed wood bookshelf in excellent condition. Perfect for eco-conscious book lovers.', 89.99, 4, 1, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'),
('Organic Cotton T-Shirt', '100% organic cotton t-shirt, gently used. Size M, various colors available.', 15.50, 2, 2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
('Solar Phone Charger', 'Portable solar charger for phones and small devices. Great for outdoor adventures.', 45.00, 1, 3, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'),
('Bamboo Kitchen Utensils Set', 'Complete set of bamboo kitchen utensils. Eco-friendly and durable.', 24.99, 8, 1, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'),
('Yoga Mat (Eco-Friendly)', 'Non-toxic, biodegradable yoga mat. Lightly used, excellent condition.', 35.00, 5, 2, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'),
('Children''s Wooden Blocks', 'Handcrafted wooden building blocks. Safe, non-toxic, and educational.', 28.75, 6, 3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Natural Skincare Bundle', 'Collection of natural, cruelty-free skincare products. Most items 80% full.', 42.00, 7, 4, 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400'),
('Bicycle Repair Kit', 'Complete bicycle maintenance kit. Help reduce car usage!', 18.50, 9, 1, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'),
('Watercolor Paint Set', 'Professional watercolor paints in eco-friendly packaging.', 32.99, 10, 2, 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400'),
('LED Desk Lamp', 'Energy-efficient LED desk lamp with adjustable brightness.', 55.00, 1, 3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('Compost Bin', 'Indoor compost bin for kitchen scraps. Perfect for apartment living.', 67.50, 8, 4, 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2f6c5?w=400'),
('Hiking Backpack', 'Lightweight, durable hiking backpack. Great for eco-adventures.', 75.00, 5, 1, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400');
