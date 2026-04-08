import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Account created! Please login.');
        navigate('/login');
      } else {
        toast.error(data.error || 'Registration failed');
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
            <CardTitle className="text-3xl font-bold tracking-tighter">JOIN DRIPBUX</CardTitle>
            <CardDescription className="text-zinc-400">Step into the future of fashion.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="frankmanuelbeltran" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="frank@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <p className="text-center text-sm text-zinc-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-zinc-900 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
