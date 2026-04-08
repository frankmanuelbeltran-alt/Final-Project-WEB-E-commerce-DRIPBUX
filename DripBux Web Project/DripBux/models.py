"""
Database Models for DripBux
Defines all SQLAlchemy models for users, products, orders, and tracking.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from extensions import db

class User(UserMixin, db.Model):
    """User model with authentication and Robux balance."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    robux_balance = db.Column(db.Integer, default=1000)  # Starting balance
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    addresses = db.relationship('Address', backref='user', lazy=True, cascade='all, delete-orphan')
    cart = db.relationship('Cart', backref='user', uselist=False, cascade='all, delete-orphan')
    orders = db.relationship('Order', backref='user', lazy=True, cascade='all, delete-orphan')
    wishlist_items = db.relationship('Wishlist', backref='user', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'

    def has_sufficient_robux(self, amount):
        """Check if user has enough Robux balance."""
        return self.robux_balance >= amount

    def deduct_robux(self, amount, description="Purchase"):
        """Deduct Robux from user balance and log transaction."""
        if self.has_sufficient_robux(amount):
            self.robux_balance -= amount
            transaction = Transaction(
                user_id=self.id,
                amount=-amount,
                description=description,
                type='debit'
            )
            db.session.add(transaction)
            return True
        return False

    def add_robux(self, amount, description="Added Robux"):
        """Add Robux to user balance and log transaction."""
        self.robux_balance += amount
        transaction = Transaction(
            user_id=self.id,
            amount=amount,
            description=description,
            type='credit'
        )
        db.session.add(transaction)
        return True

class Address(db.Model):
    """Shipping address model for users."""
    __tablename__ = 'addresses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address_line1 = db.Column(db.String(255), nullable=False)
    address_line2 = db.Column(db.String(255))
    city = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    """Product model for clothing items."""
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False, index=True)  # shirts, hoodies, pants, accessories
    price_robux = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(255))
    additional_images = db.Column(db.JSON)  # List of additional image URLs
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sizes = db.relationship('ProductSize', backref='product', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='product', lazy=True, cascade='all, delete-orphan')
    order_items = db.relationship('OrderItem', backref='product', lazy=True)

    def get_average_rating(self):
        """Calculate average rating from reviews."""
        if not self.reviews:
            return 0
        return sum(r.rating for r in self.reviews) / len(self.reviews)

    def is_in_stock(self):
        """Check if any size is in stock."""
        return any(size.stock > 0 for size in self.sizes)

    def get_lowest_price_size(self):
        """Get size with lowest price (for display)."""
        return min(self.sizes, key=lambda x: x.price_modifier) if self.sizes else None

class ProductSize(db.Model):
    """Product size variant with stock tracking."""
    __tablename__ = 'product_sizes'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    size = db.Column(db.String(10), nullable=False)  # XS, S, M, L, XL, XXL
    stock = db.Column(db.Integer, default=0)
    price_modifier = db.Column(db.Integer, default=0)  # Additional cost for this size

    def get_total_price(self):
        """Calculate total price including size modifier."""
        return self.product.price_robux + self.price_modifier

class Cart(db.Model):
    """Shopping cart model - one per user."""
    __tablename__ = 'carts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = db.relationship('CartItem', backref='cart', lazy=True, cascade='all, delete-orphan')

    def get_total_items(self):
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items)

    def get_subtotal(self):
        """Calculate subtotal of all items."""
        return sum(item.get_subtotal() for item in self.items)

    def clear_cart(self):
        """Remove all items from cart."""
        for item in self.items:
            db.session.delete(item)

class CartItem(db.Model):
    """Individual item in shopping cart."""
    __tablename__ = 'cart_items'

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    size_id = db.Column(db.Integer, db.ForeignKey('product_sizes.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    product = db.relationship('Product')
    size = db.relationship('ProductSize')

    def get_subtotal(self):
        """Calculate subtotal for this item."""
        return (self.product.price_robux + self.size.price_modifier) * self.quantity

class Order(db.Model):
    """Order model for completed purchases."""
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    total_robux = db.Column(db.Integer, nullable=False)
    shipping_fee = db.Column(db.Integer, default=0)
    discount_amount = db.Column(db.Integer, default=0)
    final_total = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, packed, shipped, out_for_delivery, delivered, cancelled
    shipping_address = db.Column(db.JSON, nullable=False)  # Snapshot of address at order time
    delivery_type = db.Column(db.String(20), default='standard')  # standard, express
    promo_code = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    tracking = db.relationship('OrderTracking', backref='order', lazy=True, cascade='all, delete-orphan', order_by='OrderTracking.timestamp.desc()')

    def get_current_status(self):
        """Get latest tracking status."""
        if self.tracking:
            return self.tracking[0].status
        return self.status

    def get_estimated_delivery(self):
        """Calculate estimated delivery date based on delivery type."""
        from datetime import timedelta
        if self.delivery_type == 'express':
            return self.created_at + timedelta(days=2)
        return self.created_at + timedelta(days=5)

class OrderItem(db.Model):
    """Individual item within an order."""
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    size = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_time = db.Column(db.Integer, nullable=False)  # Price when ordered

    def get_subtotal(self):
        """Calculate subtotal for this order item."""
        return self.price_at_time * self.quantity

class OrderTracking(db.Model):
    """Order tracking timeline entries."""
    __tablename__ = 'order_tracking'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))
    location = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_customer_visible = db.Column(db.Boolean, default=True)

class Wishlist(db.Model):
    """User wishlist items."""
    __tablename__ = 'wishlists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    product = db.relationship('Product')

    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='unique_wishlist_item'),)

class Review(db.Model):
    """Product reviews and ratings."""
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'))  # Optional: verify purchase
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    title = db.Column(db.String(100))
    comment = db.Column(db.Text)
    is_verified_purchase = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='unique_user_product_review'),)

class Transaction(db.Model):
    """Robux transaction history."""
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)  # Positive for credit, negative for debit
    type = db.Column(db.String(20), nullable=False)  # credit, debit
    description = db.Column(db.String(255))
    reference_type = db.Column(db.String(50))  # order, adjustment, bonus
    reference_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PromoCode(db.Model):  
    """Promotional codes for discounts."""
    __tablename__ = 'promo_codes'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    discount_percent = db.Column(db.Integer, default=0)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    discount_amount = db.Column(db.Integer, default=0)  # Fixed amount off
    min_order_value = db.Column(db.Integer, default=0)
    max_uses = db.Column(db.Integer)
    current_uses = db.Column(db.Integer, default=0)
    valid_from = db.Column(db.DateTime, default=datetime.utcnow)
    valid_until = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    def is_valid(self):
        """Check if promo code is currently valid."""
        now = datetime.utcnow()
        if not self.is_active:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_uses and self.current_uses >= self.max_uses:
            return False
        return True

    def calculate_discount(self, order_total):
        """Calculate discount amount for given order total."""
        if order_total < self.min_order_value:
            return 0
        if self.discount_amount:
            return min(self.discount_amount, order_total)
        if self.discount_percent:
            return int(order_total * (self.discount_percent / 100))
        return 0
