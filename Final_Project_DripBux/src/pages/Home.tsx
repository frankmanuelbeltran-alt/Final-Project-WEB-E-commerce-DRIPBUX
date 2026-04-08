import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price_robux: number;
  image_url: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = categoryFilter 
    ? products.filter(p => p.category === categoryFilter)
    : products;

  const categories = ['All', 'Hoodies', 'Shirts', 'Pants', 'Accessories', 'Footwear'];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden bg-zinc-900 flex items-center px-12">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://picsum.photos/seed/fashion-hero/1200/600" 
            alt="Hero" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none"
          >
            DRIP DIFFERENT.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-300"
          >
            Premium streetwear for the digital age. Shop the latest collections and pay with Robux.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-full px-8">
              Shop New Arrivals
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="flex flex-wrap gap-2 justify-center">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={ (categoryFilter === cat.toLowerCase() || (!categoryFilter && cat === 'All')) ? 'default' : 'outline' }
            className="rounded-full px-6"
            onClick={() => {
              const url = cat === 'All' ? '/' : `/?category=${cat.toLowerCase()}`;
              window.history.pushState({}, '', url);
              // Trigger search params update
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          >
            {cat}
          </Button>
        ))}
      </section>

      {/* Product Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {categoryFilter ? categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1) : 'All Collections'}
          </h2>
          <p className="text-zinc-500">{filteredProducts.length} items</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-[4/5] bg-zinc-200 rounded-2xl" />
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
