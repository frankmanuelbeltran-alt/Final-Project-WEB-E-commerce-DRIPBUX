import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Coins, Package, Users, ShoppingCart, TrendingUp, ChevronRight, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/orders')
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      setStats(statsData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success('Status updated');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]">Loading...</div>;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-zinc-500">
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none bg-white shadow-sm rounded-3xl p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-3xl font-bold">
              <Coins className="w-6 h-6 text-amber-500" />
              <span>{stats?.totalRevenue.toLocaleString()}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-white shadow-sm rounded-3xl p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Total Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.orderCount}</div>
            <p className="text-xs text-zinc-400 mt-2">Across all categories</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-white shadow-sm rounded-3xl p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Total Users</CardTitle>
            <Users className="w-4 h-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.userCount}</div>
            <p className="text-xs text-zinc-400 mt-2">Active members</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-zinc-100 p-1 rounded-full mb-8">
          <TabsTrigger value="orders" className="rounded-full px-8">Orders Management</TabsTrigger>
          <TabsTrigger value="products" className="rounded-full px-8">Product Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="border-none bg-white shadow-sm rounded-3xl overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="font-bold">Order ID</TableHead>
                  <TableHead className="font-bold">Customer</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Total</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <TableCell className="font-medium">#{order.id.toString().padStart(5, '0')}</TableCell>
                    <TableCell>{order.username}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 font-bold">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span>{order.total_robux.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full px-3 py-0.5 border-none ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        onValueChange={(v) => handleUpdateStatus(order.id, v)}
                        defaultValue={order.status}
                      >
                        <SelectTrigger className="w-[180px] ml-auto rounded-xl">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Packed">Packed</SelectItem>
                          <SelectItem value="Shipped">Shipped</SelectItem>
                          <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-3xl border-2 border-dashed border-zinc-200">
            <Package className="w-12 h-12 text-zinc-200" />
            <div className="text-center">
              <p className="font-bold text-zinc-900">Product Management</p>
              <p className="text-sm text-zinc-500">This feature is coming soon in the next update.</p>
            </div>
            <Button variant="outline" className="rounded-xl">Add New Product</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
