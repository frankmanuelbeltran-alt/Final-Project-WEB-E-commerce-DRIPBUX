import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Coins, ShoppingBag, ArrowLeft, Check, Truck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price_robux: number;
  image_url: string;
  sizes: { id: number; size: string; stock: number }[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data);
        if (data.sizes.length > 0) setSelectedSize(data.sizes[0].size);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product!.id, selectedSize, 1);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]">Loading...</div>;
  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-8 group" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to shop
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100"
        >
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Info Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col space-y-8"
        >
          <div className="space-y-4">
            <Badge variant="outline" className="rounded-full px-4 py-1 uppercase tracking-widest text-[10px] font-bold">
              {product.category}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center space-x-2 text-2xl font-bold">
              <Coins className="w-6 h-6 text-amber-500" />
              <span>{product.price_robux.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-zinc-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Select Size</label>
              <button className="text-xs font-medium underline text-zinc-400">Size Guide</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  disabled={s.stock === 0}
                  onClick={() => setSelectedSize(s.size)}
                  className={`
                    w-14 h-14 rounded-xl border-2 flex items-center justify-center font-bold transition-all
                    ${selectedSize === s.size 
                      ? 'border-zinc-900 bg-zinc-900 text-white' 
                      : 'border-zinc-200 hover:border-zinc-400 text-zinc-600'}
                    ${s.stock === 0 ? 'opacity-30 cursor-not-allowed bg-zinc-100' : ''}
                  `}
                >
                  {s.size}
                </button>
              ))}
            </div>
            {product.sizes.find(s => s.size === selectedSize)?.stock! < 10 && (
              <p className="text-xs text-amber-600 font-medium">
                Only {product.sizes.find(s => s.size === selectedSize)?.stock} left in stock!
              </p>
            )}
          </div>

          <div className="pt-4 space-y-4">
            <Button 
              size="lg" 
              className="w-full h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 text-lg font-bold"
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? 'Adding...' : (
                <>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Add to Cart
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center space-x-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <Truck className="w-5 h-5 text-zinc-400" />
                <div className="text-xs">
                  <p className="font-bold">Fast Delivery</p>
                  <p className="text-zinc-500">2-4 business days</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <ShieldCheck className="w-5 h-5 text-zinc-400" />
                <div className="text-xs">
                  <p className="font-bold">Secure Payment</p>
                  <p className="text-zinc-500">Mock Robux system</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 space-y-4">
            <h4 className="font-bold uppercase tracking-wider text-xs text-zinc-500">Details & Material</h4>
            <ul className="space-y-2">
              {['100% Premium Cotton', 'Reinforced stitching', 'Ethically sourced', 'Machine washable'].map((item, i) => (
                <li key={i} className="flex items-center text-sm text-zinc-600">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
