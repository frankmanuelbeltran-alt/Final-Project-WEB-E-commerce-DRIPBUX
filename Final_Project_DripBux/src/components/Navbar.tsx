import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, LayoutDashboard, Coins } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tighter text-zinc-900">
          DRIP<span className="text-zinc-500">BUX</span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-sm font-medium hover:text-zinc-500 transition-colors">Shop</Link>
          <Link to="/?category=hoodies" className="text-sm font-medium hover:text-zinc-500 transition-colors">Hoodies</Link>
          <Link to="/?category=shirts" className="text-sm font-medium hover:text-zinc-500 transition-colors">Shirts</Link>
          <Link to="/?category=pants" className="text-sm font-medium hover:text-zinc-500 transition-colors">Pants</Link>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="hidden sm:flex items-center px-3 py-1 bg-zinc-100 rounded-full space-x-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold">{user.robux_balance.toLocaleString()}</span>
            </div>
          )}

          <Link to="/cart" className="relative p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {items.length > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-zinc-900 text-[10px]">
                {items.length}
              </Badge>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-900 text-white text-xs">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-zinc-500">Robux: {user.robux_balance}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => navigate('/register')}>Join</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
