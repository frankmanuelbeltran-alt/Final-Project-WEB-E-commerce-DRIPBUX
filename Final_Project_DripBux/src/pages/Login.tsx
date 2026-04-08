import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-8 text-center bg-zinc-900 text-white">
            <CardTitle className="text-3xl font-bold tracking-tighter">DRIPBUX</CardTitle>
            <CardDescription className="text-zinc-400">Welcome back to the drip.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="frankmanuelbeltran_alt" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-zinc-500 hover:underline">Forgot password?</button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="rounded-xl h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-bold"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>
            <p className="text-center text-sm text-zinc-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-zinc-900 hover:underline">
                Join now
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
