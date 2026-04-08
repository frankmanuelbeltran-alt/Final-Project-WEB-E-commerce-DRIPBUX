import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Package, Truck, CheckCircle2, Clock, ArrowLeft, MapPin, Coins } from 'lucide-react';
import { motion } from 'motion/react';

interface Order {
  id: number;
  status: string;
  total_robux: number;
  shipping_fee: number;
  created_at: string;
  items: any[];
  tracking: any[];
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  const stages = [
    { status: 'Pending', icon: Clock, label: 'Order Placed' },
    { status: 'Packed', icon: Package, label: 'Packed' },
    { status: 'Shipped', icon: Truck, label: 'Shipped' },
    { status: 'Out for Delivery', icon: Truck, label: 'Out for Delivery' },
    { status: 'Delivered', icon: CheckCircle2, label: 'Delivered' },
  ];

  const currentStageIndex = stages.findIndex(s => s.status.toLowerCase() === order?.status.toLowerCase());

  if (loading) return <div className="flex items-center justify-center h-[60vh]">Loading...</div>;
  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" className="group" onClick={() => navigate('/profile')}>
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Orders
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.id.toString().padStart(5, '0')}</h1>
          <p className="text-zinc-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <Badge className="rounded-full px-6 py-1.5 text-sm bg-zinc-900 text-white">
          {order.status}
        </Badge>
      </div>

      {/* Tracking Timeline */}
      <Card className="border-none bg-white shadow-sm rounded-3xl p-8">
        <div className="relative flex justify-between items-start max-w-2xl mx-auto">
          {stages.map((stage, i) => {
            const isCompleted = i <= currentStageIndex;
            const isCurrent = i === currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.status} className="flex flex-col items-center z-10 w-1/5">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                  ${isCompleted ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}
                  ${isCurrent ? 'ring-4 ring-zinc-100' : ''}
                `}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`
                  text-[10px] uppercase tracking-widest mt-4 font-bold text-center
                  ${isCompleted ? 'text-zinc-900' : 'text-zinc-400'}
                `}>
                  {stage.label}
                </span>
                {i < stages.length - 1 && (
                  <div className="absolute top-6 left-[10%] w-[80%] h-[2px] bg-zinc-100 -z-0">
                    <div 
                      className="h-full bg-zinc-900 transition-all duration-1000" 
                      style={{ width: `${Math.max(0, Math.min(100, (currentStageIndex / (stages.length - 1)) * 100))}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-xl">Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <Card key={item.id} className="border-none bg-white shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex items-center space-x-4">
                  <img src={item.image_url} className="w-16 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-grow">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-zinc-500">Size: {item.size} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>{(item.price_at_purchase * item.quantity).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-6">
          <Card className="border-none bg-white shadow-sm rounded-3xl p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span>{(order.total_robux - order.shipping_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Shipping</span>
                  <span>{order.shipping_fee.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <div className="flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>{order.total_robux.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-bold">Updates</h3>
              <div className="space-y-4">
                {order.tracking.map((update, i) => (
                  <div key={i} className="flex space-x-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-zinc-900 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{update.status}</p>
                      <p className="text-zinc-500 text-xs">{new Date(update.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
