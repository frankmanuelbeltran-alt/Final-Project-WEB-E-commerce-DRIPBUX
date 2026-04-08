import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Coins } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  price_robux: number;
  image_url: string;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group border-none bg-transparent shadow-none overflow-hidden">
        <CardContent className="p-0 relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-white/90 text-zinc-900 hover:bg-white/90 backdrop-blur-sm border-none">
              {product.category}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start p-4 space-y-1">
          <h3 className="font-semibold text-lg group-hover:text-zinc-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center space-x-1.5 text-zinc-900 font-bold">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>{product.price_robux.toLocaleString()}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
