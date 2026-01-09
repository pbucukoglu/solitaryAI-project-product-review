// Demo datasets for offline-first experience
// Realistic product and review data across multiple categories

export const demoProducts = [
  {
    id: 1,
    name: "MacBook Pro 16\"",
    description: "Powerful laptop with M3 Pro chip, perfect for professionals and creators.",
    category: "Electronics",
    price: 2499.99,
    averageRating: 4.7,
    reviewCount: 342,
    imageUrls: [
      "https://picsum.photos/seed/macbook-pro/400/300.jpg",
      "https://picsum.photos/seed/macbook-pro-2/400/300.jpg",
      "https://picsum.photos/seed/macbook-pro-3/400/300.jpg"
    ]
  },
  {
    id: 2,
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling headphones with exceptional sound quality.",
    category: "Electronics",
    price: 399.99,
    averageRating: 4.8,
    reviewCount: 521,
    imageUrls: [
      "https://picsum.photos/seed/sony-headphones/400/300.jpg",
      "https://picsum.photos/seed/sony-headphones-2/400/300.jpg"
    ]
  },
  {
    id: 3,
    name: "Nike Air Max 270",
    description: "Comfortable running shoes with excellent cushioning and modern design.",
    category: "Sports & Outdoors",
    price: 150.00,
    averageRating: 4.3,
    reviewCount: 189,
    imageUrls: [
      "https://picsum.photos/seed/nike-air-max/400/300.jpg",
      "https://picsum.photos/seed/nike-air-max-2/400/300.jpg"
    ]
  },
  {
    id: 4,
    name: "The Great Gatsby",
    description: "Classic American literature by F. Scott Fitzgerald.",
    category: "Books",
    price: 12.99,
    averageRating: 4.5,
    reviewCount: 89,
    imageUrls: [
      "https://picsum.photos/seed/great-gatsby/400/300.jpg"
    ]
  },
  {
    id: 5,
    name: "Instant Pot Duo 7-in-1",
    description: "Multi-cooker that pressure cooks, slow cooks, rice cooks, and more.",
    category: "Home & Kitchen",
    price: 79.99,
    averageRating: 4.6,
    reviewCount: 412,
    imageUrls: [
      "https://picsum.photos/seed/instant-pot/400/300.jpg",
      "https://picsum.photos/seed/instant-pot-2/400/300.jpg"
    ]
  },
  {
    id: 6,
    name: "Levi's 501 Original Jeans",
    description: "Classic straight-fit jeans, timeless style and durable construction.",
    category: "Clothing",
    price: 59.99,
    averageRating: 4.2,
    reviewCount: 267,
    imageUrls: [
      "https://picsum.photos/seed/levis-jeans/400/300.jpg",
      "https://picsum.photos/seed/levis-jeans-2/400/300.jpg"
    ]
  },
  {
    id: 7,
    name: "iPad Air",
    description: "Versatile tablet with M1 chip, perfect for work and entertainment.",
    category: "Electronics",
    price: 599.99,
    averageRating: 4.7,
    reviewCount: 445,
    imageUrls: [
      "https://picsum.photos/seed/ipad-air/400/300.jpg",
      "https://picsum.photos/seed/ipad-air-2/400/300.jpg"
    ]
  },
  {
    id: 8,
    name: "Yoga Mat Premium",
    description: "Extra thick, non-slip exercise mat for yoga and fitness routines.",
    category: "Sports & Outdoors",
    price: 29.99,
    averageRating: 4.4,
    reviewCount: 156,
    imageUrls: [
      "https://picsum.photos/seed/yoga-mat/400/300.jpg"
    ]
  },
  {
    id: 9,
    name: "Atomic Habits",
    description: "Practical guide to building good habits and breaking bad ones.",
    category: "Books",
    price: 14.99,
    averageRating: 4.8,
    reviewCount: 623,
    imageUrls: [
      "https://picsum.photos/seed/atomic-habits/400/300.jpg"
    ]
  },
  {
    id: 10,
    name: "Coffee Maker Deluxe",
    description: "Programmable coffee maker with thermal carafe and auto-brew.",
    category: "Home & Kitchen",
    price: 89.99,
    averageRating: 4.1,
    reviewCount: 198,
    imageUrls: [
      "https://picsum.photos/seed/coffee-maker/400/300.jpg",
      "https://picsum.photos/seed/coffee-maker-2/400/300.jpg"
    ]
  },
  {
    id: 11,
    name: "Winter Jacket",
    description: "Warm, waterproof winter jacket with hood and multiple pockets.",
    category: "Clothing",
    price: 129.99,
    averageRating: 4.5,
    reviewCount: 334,
    imageUrls: [
      "https://picsum.photos/seed/winter-jacket/400/300.jpg",
      "https://picsum.photos/seed/winter-jacket-2/400/300.jpg"
    ]
  },
  {
    id: 12,
    name: "Samsung Galaxy Watch",
    description: "Smartwatch with health tracking, GPS, and smartphone integration.",
    category: "Electronics",
    price: 299.99,
    averageRating: 4.3,
    reviewCount: 278,
    imageUrls: [
      "https://picsum.photos/seed/galaxy-watch/400/300.jpg",
      "https://picsum.photos/seed/galaxy-watch-2/400/300.jpg"
    ]
  }
];

export const demoReviews = {
  1: [ // MacBook Pro reviews
    {
      id: 101,
      reviewerName: "Alex Chen",
      rating: 5,
      comment: "Absolutely incredible machine. The M3 Pro chip handles everything I throw at it without breaking a sweat. Battery life is amazing too.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      deviceId: "demo-device-001"
    },
    {
      id: 102,
      reviewerName: "Sarah Johnson",
      rating: 4,
      comment: "Great laptop overall. The screen is beautiful and performance is stellar. My only complaint is the price, but you get what you pay for.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      deviceId: "demo-device-002"
    },
    {
      id: 103,
      reviewerName: "Mike Wilson",
      rating: 5,
      comment: null, // Rating-only review
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      deviceId: "demo-device-003"
    },
    {
      id: 104,
      reviewerName: "Emma Davis",
      rating: 4,
      comment: "Perfect for my development work. The keyboard feels great and the trackpad is precise.",
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
      deviceId: "demo-device-004"
    }
  ],
  2: [ // Sony headphones reviews
    {
      id: 201,
      reviewerName: "David Lee",
      rating: 5,
      comment: "Best noise cancellation I've ever experienced. The sound quality is pristine and they're comfortable for long sessions.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      deviceId: "demo-device-005"
    },
    {
      id: 202,
      reviewerName: "Lisa Wang",
      rating: 5,
      comment: "Worth every penny. I use these for flights and they completely block out engine noise.",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      deviceId: "demo-device-006"
    },
    {
      id: 203,
      reviewerName: "Tom Brown",
      rating: 4,
      comment: "Great sound quality. Battery lasts forever. Only minor issue is they can get a bit warm after extended use.",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      deviceId: "demo-device-007"
    }
  ],
  3: [ // Nike shoes reviews
    {
      id: 301,
      reviewerName: "Chris Martinez",
      rating: 4,
      comment: "Very comfortable for daily wear. The air max cushioning really makes a difference.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      deviceId: "demo-device-008"
    },
    {
      id: 302,
      reviewerName: "Jordan Taylor",
      rating: 5,
      comment: "Perfect fit and great style. I wear these everywhere and they still look brand new.",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      deviceId: "demo-device-009"
    },
    {
      id: 303,
      reviewerName: "Amy Chen",
      rating: 4,
      comment: null,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      deviceId: "demo-device-010"
    }
  ],
  4: [ // Great Gatsby reviews
    {
      id: 401,
      reviewerName: "Rachel Green",
      rating: 5,
      comment: "A timeless masterpiece. Fitzgerald's prose is absolutely beautiful. Every time I read it, I discover something new.",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      deviceId: "demo-device-011"
    },
    {
      id: 402,
      reviewerName: "Mark Thompson",
      rating: 4,
      comment: "Classic American literature. The symbolism and themes are still relevant today.",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      deviceId: "demo-device-012"
    }
  ],
  5: [ // Instant Pot reviews
    {
      id: 501,
      reviewerName: "Jennifer Liu",
      rating: 5,
      comment: "This has revolutionized my cooking! I can make meals in minutes that used to take hours. So versatile.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      deviceId: "demo-device-013"
    },
    {
      id: 502,
      reviewerName: "Robert Kim",
      rating: 4,
      comment: "Great for busy families. The yogurt function is amazing. Only wish it was a bit larger.",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      deviceId: "demo-device-014"
    },
    {
      id: 503,
      reviewerName: "Maria Garcia",
      rating: 5,
      comment: null,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      deviceId: "demo-device-015"
    }
  ],
  6: [ // Levi's jeans reviews
    {
      id: 601,
      reviewerName: "Kevin Park",
      rating: 4,
      comment: "Classic fit that never goes out of style. The denim quality is excellent.",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      deviceId: "demo-device-016"
    },
    {
      id: 602,
      reviewerName: "Sophie Turner",
      rating: 4,
      comment: "Perfect everyday jeans. They fit true to size and are very comfortable.",
      createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 days ago
      deviceId: "demo-device-017"
    }
  ],
  7: [ // iPad Air reviews
    {
      id: 701,
      reviewerName: "Daniel White",
      rating: 5,
      comment: "Incredibly powerful for a tablet. The M1 chip makes this feel like a laptop replacement.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      deviceId: "demo-device-018"
    },
    {
      id: 702,
      reviewerName: "Olivia Brown",
      rating: 5,
      comment: "Perfect for drawing and note-taking. The screen is gorgeous and battery life is excellent.",
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
      deviceId: "demo-device-019"
    }
  ],
  8: [ // Yoga mat reviews
    {
      id: 801,
      reviewerName: "Nina Patel",
      rating: 4,
      comment: "Great thickness and grip. Doesn't slip even during intense sessions.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      deviceId: "demo-device-020"
    },
    {
      id: 802,
      reviewerName: "Carlos Rodriguez",
      rating: 5,
      comment: "Best yoga mat I've owned. The extra thickness really helps with my knees.",
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days ago
      deviceId: "demo-device-021"
    }
  ],
  9: [ // Atomic Habits reviews
    {
      id: 901,
      reviewerName: "James Miller",
      rating: 5,
      comment: "Life-changing book. The practical advice is easy to implement and actually works.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      deviceId: "demo-device-022"
    },
    {
      id: 902,
      reviewerName: "Emily Zhang",
      rating: 5,
      comment: "This book helped me completely transform my daily routines. Highly recommend!",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      deviceId: "demo-device-023"
    }
  ],
  10: [ // Coffee maker reviews
    {
      id: 1001,
      reviewerName: "Frank Anderson",
      rating: 4,
      comment: "Makes great coffee and the thermal carafe keeps it hot for hours. Programming is easy.",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      deviceId: "demo-device-024"
    },
    {
      id: 1002,
      reviewerName: "Helen Wong",
      rating: 4,
      comment: "Good value for the price. Wish the carafe was larger but otherwise very happy.",
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days ago
      deviceId: "demo-device-025"
    }
  ],
  11: [ // Winter jacket reviews
    {
      id: 1101,
      reviewerName: "Steve Cooper",
      rating: 5,
      comment: "Kept me warm in -20°C weather. Completely waterproof and well-designed.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      deviceId: "demo-device-026"
    },
    {
      id: 1102,
      reviewerName: "Laura Mitchell",
      rating: 4,
      comment: "Great jacket for winter. The hood is excellent and pockets are very useful.",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      deviceId: "demo-device-027"
    }
  ],
  12: [ // Galaxy Watch reviews
    {
      id: 1201,
      reviewerName: "Ryan Foster",
      rating: 4,
      comment: "Great health tracking features. The GPS is accurate for runs. Battery could be better.",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      deviceId: "demo-device-028"
    },
    {
      id: 1202,
      reviewerName: "Michelle Lee",
      rating: 4,
      comment: "Very stylish and functional. Works seamlessly with my Samsung phone.",
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      deviceId: "demo-device-029"
    }
  ]
};

// Helper function to get reviews for a product
export const getDemoReviewsByProductId = (productId) => {
  return demoReviews[productId] || [];
};

// Helper function to add a review to demo data
export const addDemoReview = (productId, review) => {
  if (!demoReviews[productId]) {
    demoReviews[productId] = [];
  }
  const newReview = {
    ...review,
    id: Date.now(), // Simple timestamp-based ID
    createdAt: new Date().toISOString(),
  };
  demoReviews[productId].unshift(newReview); // Add to beginning
  
  // Update product's rating and count
  const product = demoProducts.find(p => p.id === productId);
  if (product) {
    const reviews = demoReviews[productId];
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    product.reviewCount = reviews.length;
  }
  
  return newReview;
};
