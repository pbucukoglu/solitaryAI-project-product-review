# Product Images Guide

## Current Implementation

The database stores product images as a JSON array in the `image_urls` column (TEXT[] in PostgreSQL). Each product has 4-5 image URLs that are displayed in a horizontal gallery on the product detail screen.

## Image Requirements

For a realistic e-commerce experience, each product should have **consistent multi-angle images** showing the **SAME product** from different angles:

1. **Front view** - Main product shot
2. **Side view** - Left or right profile
3. **Back view** - Rear of the product
4. **45-degree angle** - Three-quarter view
5. **Close-up detail** (optional) - Highlight specific features

### Image Quality Standards

- **Photorealistic** - High-quality product photography
- **E-commerce style** - White or neutral background
- **No logos or brand names** visible on products
- **Consistent** - Same product, same color, same design across all angles
- **Mobile-optimized** - Suitable for mobile app display (800px width recommended)

## Current Limitation

The current migration (`V6__Update_products_with_multi_angle_images.sql`) uses generic product photography from Unsplash. These images may show **similar** products but not necessarily the **exact same product** from different angles.

## Solutions for Production

### Option 1: Professional Product Photography
- Hire a product photographer
- Shoot each product from multiple angles
- Upload to your own CDN or image hosting service
- Update database with your image URLs

### Option 2: AI-Generated Images
Use AI image generation with consistent prompts:

**Example for iPhone 15 Pro:**
```
Prompt 1: "iPhone 15 Pro front view, white background, product photography, e-commerce style"
Prompt 2: "iPhone 15 Pro side view, white background, product photography, e-commerce style"
Prompt 3: "iPhone 15 Pro back view, white background, product photography, e-commerce style"
Prompt 4: "iPhone 15 Pro 45-degree angle, white background, product photography, e-commerce style"
Prompt 5: "iPhone 15 Pro close-up detail, white background, product photography, e-commerce style"
```

**Tools:**
- Midjourney
- DALL-E 3
- Stable Diffusion
- Leonardo.ai

**Important:** Use the same seed/model settings to ensure consistency.

### Option 3: Stock Photo Sets
Some stock photo sites offer product photography sets:
- **Shutterstock** - Search for "product photography set"
- **Getty Images** - Professional product photo sets
- **Adobe Stock** - Curated product photography

### Option 4: Product Photography Services
- **Product photography studios** - Professional services
- **Fiverr/Upwork** - Freelance product photographers
- **3D rendering services** - For consistent virtual product images

## Database Structure

Images are stored as a PostgreSQL TEXT[] array:

```sql
image_urls TEXT[]  -- Array of image URLs
```

Example:
```sql
image_urls = '["https://example.com/product-front.jpg", 
               "https://example.com/product-side.jpg", 
               "https://example.com/product-back.jpg", 
               "https://example.com/product-45deg.jpg", 
               "https://example.com/product-detail.jpg"]'
```

## Updating Images

### Via DBeaver

1. Connect to the database (see `DBeaver_Connection_Guide.md`)
2. Navigate to `products` table
3. Edit the `image_urls` column for a product
4. Enter JSON array format: `["url1", "url2", "url3", "url4", "url5"]`
5. Save changes

### Via SQL Migration

Create a new migration file:
```sql
-- V7__Update_product_images_with_real_photography.sql
UPDATE products 
SET image_urls = '["url1", "url2", "url3", "url4", "url5"]' 
WHERE name = 'Product Name';
```

### Via Backend API (Future Enhancement)

You could add an admin endpoint to update product images, but this is currently out of scope.

## Mobile App Display

The mobile app (`ProductDetailScreen.js`) already supports:
- Horizontal image gallery with swipe navigation
- Thumbnail navigation below main image
- Image indicator (e.g., "1 / 5")
- Proper image loading and caching

No changes needed to the mobile app - it will automatically display all images from the `imageUrls` array.

## Image URL Format

Current implementation uses Unsplash URLs with parameters:
```
https://images.unsplash.com/photo-{ID}?w=800&fit=crop&q=80
```

For your own images, use any HTTPS URL:
```
https://your-cdn.com/products/iphone-15-pro/front.jpg
https://your-cdn.com/products/iphone-15-pro/side.jpg
https://your-cdn.com/products/iphone-15-pro/back.jpg
https://your-cdn.com/products/iphone-15-pro/45deg.jpg
https://your-cdn.com/products/iphone-15-pro/detail.jpg
```

## Best Practices

1. **Consistent naming** - Use a clear naming convention (front, side, back, 45deg, detail)
2. **CDN hosting** - Use a CDN for fast image delivery
3. **Optimization** - Compress images for mobile (800-1200px width, WebP format if possible)
4. **Backup** - Keep original high-resolution images
5. **Metadata** - Consider storing image metadata (alt text, captions) if needed in the future

## Testing

After updating images:
1. Restart backend to apply migration
2. Clear mobile app cache
3. Navigate to product detail screen
4. Verify all images load correctly
5. Test image gallery swipe functionality
6. Check thumbnail navigation

## Notes

- Current images are for **development/demo purposes only**
- For production, replace with actual product photography
- All current images are from royalty-free sources (Unsplash)
- No copyright issues with current implementation
- Images are suitable for mobile app display

