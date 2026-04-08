import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Coins, Package, MapPin, Clock, ChevronRight, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, addrRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/user/addresses')
        ]);
        const ordersData = await ordersRes.json();
        const addrData = await addrRes.json();
        setOrders(ordersData);
        setAddresses(addrData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEarnRobux = async () => {
    const res = await fetch('/api/user/earn-robux', { method: 'POST' });
    if (res.ok) {
      toast.success('Earned 500 Robux!');
      refreshUser();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'packed': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'out for delivery': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-3xl bg-white shadow-sm">
        <div className="w-24 h-24 rounded-full bg-zinc-900 text-white flex items-center justify-center text-3xl font-bold">
          {user?.username.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-grow text-center md:text-left space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{user?.username}</h1>
          <p className="text-zinc-500">{user?.role === 'admin' ? 'Administrator' : 'Fashion Enthusiast'}</p>
        </div>
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-zinc-50 border border-zinc-100 min-w-[200px]">
          <div className="flex items-center space-x-2 text-2xl font-bold">
            <Coins className="w-6 h-6 text-amber-500" />
            <span>{user?.robux_balance.toLocaleString()}</span>
          </div>
          <Button onClick={handleEarnRobux} variant="outline" size="sm" className="rounded-full w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Earn Robux
          </Button>
        </div>
      </section>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto rounded-full p-1 bg-zinc-100">
          <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Orders</TabsTrigger>
          <TabsTrigger value="addresses" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="pt-8">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Package className="w-12 h-12 text-zinc-200 mx-auto" />
              <p className="text-zinc-500">No orders found yet.</p>
              <Button variant="link" onClick={() => navigate('/')}>Go shopping</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="border-none bg-white shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/tracking/${order.id}`)}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-bold">Order #{order.id.toString().padStart(5, '0')}</p>
                          <div className="flex items-center space-x-4 text-sm text-zinc-500 mt-1">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center font-bold text-zinc-900">
                              <Coins className="w-3 h-3 mr-1 text-amber-500" />
                              {order.total_robux.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={`rounded-full px-4 py-1 border-none ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-zinc-300" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <Card key={addr.id} className="border-none bg-white shadow-sm rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-zinc-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-zinc-500" />
                    </div>
                    <Badge variant="outline" className="rounded-full">Default</Badge>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{addr.full_name}</p>
                    <p className="text-zinc-500 mt-1">{addr.address}</p>
                    <p className="text-zinc-500">{addr.city}, {addr.postal_code}</p>
                    <p className="text-zinc-500 mt-2 flex items-center text-sm">
                      <Clock className="w-3 h-3 mr-2" />
                      {addr.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-2 border-dashed border-zinc-200 bg-transparent shadow-none rounded-2xl flex items-center justify-center p-12 cursor-pointer hover:border-zinc-400 transition-colors">
              <div className="text-center space-y-2">
                <PlusCircle className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="font-bold text-zinc-400">Add New Address</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
