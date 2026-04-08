import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Coins, Truck, CreditCard, CheckCircle2, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, refreshCart } = useCart();
  const { user, refreshUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryOption, setDeliveryOption] = useState('standard');
  
  // New Address Form
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    if (items.length === 0 && step !== 4) navigate('/cart');
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const res = await fetch('/api/user/addresses');
    if (res.ok) {
      const data = await res.json();
      setAddresses(data);
      if (data.length > 0) setSelectedAddressId(data[0].id);
    }
  };

  const shippingFee = deliveryOption === 'express' ? 150 : 50;
  const finalTotal = total + shippingFee;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/user/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAddress),
    });
    if (res.ok) {
      toast.success('Address saved');
      fetchAddresses();
      setStep(1);
    }
  };

  const handlePlaceOrder = async () => {
    if (user!.robux_balance < finalTotal) {
      toast.error('Insufficient Robux balance');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddressId,
          shippingFee,
          items,
          totalRobux: finalTotal
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Order placed successfully!');
        await refreshCart();
        await refreshUser();
        setStep(4);
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center z-10">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors
                ${step >= s ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-500'}
              `}>
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              <span className={`text-[10px] uppercase tracking-widest mt-2 font-bold ${step >= s ? 'text-zinc-900' : 'text-zinc-400'}`}>
                {s === 1 ? 'Shipping' : s === 2 ? 'Delivery' : 'Payment'}
              </span>
            </div>
          ))}
          <div className="absolute top-5 left-0 w-full h-[2px] bg-zinc-200 -z-0">
            <div 
              className="h-full bg-zinc-900 transition-all duration-500" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">Shipping Details</h2>
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    <RadioGroup value={selectedAddressId?.toString()} onValueChange={(v) => setSelectedAddressId(parseInt(v))}>
                      {addresses.map((addr) => (
                        <div key={addr.id} className={`
                          relative flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all cursor-pointer
                          ${selectedAddressId === addr.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}
                        `}>
                          <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} />
                          <Label htmlFor={`addr-${addr.id}`} className="flex-grow cursor-pointer">
                            <p className="font-bold">{addr.full_name}</p>
                            <p className="text-sm text-zinc-500">{addr.address}, {addr.city} {addr.postal_code}</p>
                            <p className="text-sm text-zinc-500">{addr.phone}</p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => setAddresses([])}>
                      Add New Address
                    </Button>
                    <Button className="w-full h-12 rounded-xl bg-zinc-900" onClick={() => setStep(2)}>
                      Continue to Delivery
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input required value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input required value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input required value={newAddress.postalCode} onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl bg-zinc-900">Save & Continue</Button>
                  </form>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">Delivery Option</h2>
                <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="space-y-4">
                  <div className={`
                    flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer
                    ${deliveryOption === 'standard' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}
                  `}>
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="cursor-pointer">
                        <p className="font-bold">Standard Delivery</p>
                        <p className="text-sm text-zinc-500">3-5 business days</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1 font-bold">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>50</span>
                    </div>
                  </div>
                  <div className={`
                    flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer
                    ${deliveryOption === 'express' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}
                  `}>
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="cursor-pointer">
                        <p className="font-bold">Express Delivery</p>
                        <p className="text-sm text-zinc-500">1-2 business days</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1 font-bold">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>150</span>
                    </div>
                  </div>
                </RadioGroup>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-[2] h-12 rounded-xl bg-zinc-900" onClick={() => setStep(3)}>Continue to Payment</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">Payment</h2>
                <div className="p-6 rounded-3xl bg-zinc-900 text-white space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-zinc-400 uppercase tracking-widest font-bold">Current Balance</p>
                    <div className="flex items-center space-x-2 text-xl font-bold">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <span>{user?.robux_balance.toLocaleString()}</span>
                    </div>
                  </div>
                  <Separator className="bg-zinc-800" />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-zinc-400 uppercase tracking-widest font-bold">Order Total</p>
                    <div className="flex items-center space-x-2 text-xl font-bold text-amber-500">
                      <Coins className="w-5 h-5" />
                      <span>{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center space-x-2 text-xs text-zinc-400">
                      <CreditCard className="w-4 h-4" />
                      <p>Mock Robux Payment - Secure Simulation</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep(2)}>Back</Button>
                  <Button 
                    className="flex-[2] h-12 rounded-xl bg-zinc-900" 
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Pay ${finalTotal.toLocaleString()} Robux`}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-12"
              >
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Order Confirmed!</h2>
                  <p className="text-zinc-500">Your drip is on the way. Check your profile for updates.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="rounded-xl h-12 px-8 bg-zinc-900" onClick={() => navigate('/profile')}>View Orders</Button>
                  <Button variant="outline" className="rounded-xl h-12 px-8" onClick={() => navigate('/')}>Continue Shopping</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        {step < 4 && (
          <div className="space-y-6">
            <Card className="border-none bg-white shadow-sm rounded-3xl p-6">
              <h3 className="font-bold mb-4">Order Summary</h3>
              <div className="space-y-4">
                <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center space-x-3 text-sm">
                      <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-grow">
                        <p className="font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.size} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-1 font-bold">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span>{(item.price_robux * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span>{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Shipping</span>
                    <span>{shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <div className="flex items-center space-x-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
