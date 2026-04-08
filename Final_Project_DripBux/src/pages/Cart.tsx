import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ShoppingBag, Trash2, Plus, Minus, Coins, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { items, total, removeItem, addToCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-zinc-300" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-zinc-500">Looks like you haven't added any drip yet.</p>
        </div>
        <Button onClick={() => navigate('/')} className="rounded-full px-8">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold tracking-tight mb-12">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-none bg-white shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center space-x-6">
                    <div className="w-24 h-32 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-500">Size: <span className="font-bold text-zinc-900">{item.size}</span></p>
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center space-x-3 bg-zinc-100 rounded-lg p-1">
                          <button 
                            onClick={() => addToCart(item.product_id, item.size, -1)}
                            disabled={item.quantity <= 1}
                            className="p-1 hover:bg-white rounded-md disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => addToCart(item.product_id, item.size, 1)}
                            className="p-1 hover:bg-white rounded-md transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-1.5 font-bold">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>{(item.price_robux * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="border-none bg-white shadow-sm rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <div className="flex items-center space-x-1 font-bold">
                  <Coins className="w-3 h-3 text-amber-500" />
                  <span>{total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Shipping</span>
                <span className="font-bold text-green-600">Calculated at next step</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <div className="flex items-center space-x-1.5">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span>{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <Button 
              className="w-full h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 mt-8 text-lg font-bold group"
              onClick={() => navigate('/checkout')}
            >
              Checkout
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>

          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 flex items-start space-x-4">
            <div className="p-2 bg-amber-100 rounded-full">
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-900">Robux Payment</p>
              <p className="text-amber-700">This is a simulation. No real money will be charged. Robux will be deducted from your mock balance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
