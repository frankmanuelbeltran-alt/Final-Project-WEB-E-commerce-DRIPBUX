"""Shop Routes for DripBux"""
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_required, current_user
from extensions import db
from models import (Product, ProductSize, Cart, CartItem, Order, OrderItem, 
                    OrderTracking, Address, Wishlist, Review, PromoCode)
from forms import AddressForm, DeliveryForm, PaymentForm, ReviewForm
from datetime import datetime
import random
import string

shop_bp = Blueprint('shop', __name__, template_folder='templates/shop')

def generate_order_number():
    while True:
        order_num = 'DRB-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Order.query.filter_by(order_number=order_num).first():
            return order_num

@shop_bp.route('/cart')
@login_required
def view_cart():
    cart = current_user.cart
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.session.add(cart)
        db.session.commit()

    for item in cart.items:
        if item.quantity > item.size.stock:
            item.quantity = item.size.stock
            flash(f'Updated {item.product.name} quantity due to stock changes.', 'warning')
    db.session.commit()

    return render_template('shop/cart.html', cart=cart)

@shop_bp.route('/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    product_id = request.form.get('product_id', type=int)
    size_id = request.form.get('size_id', type=int)
    quantity = request.form.get('quantity', 1, type=int)

    if not product_id or not size_id:
        flash('Invalid product or size selection.', 'danger')
        return redirect(url_for('main.index'))

    product = Product.query.get_or_404(product_id)
    size = ProductSize.query.get_or_404(size_id)

    if size.stock < quantity:
        flash(f'Sorry, only {size.stock} items available in stock.', 'warning')
        return redirect(url_for('main.product_detail', product_id=product_id))

    cart = current_user.cart
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.session.add(cart)
        db.session.commit()

    cart_item = CartItem.query.filter_by(
        cart_id=cart.id,
        product_id=product_id,
        size_id=size_id
    ).first()

    if cart_item:
        new_quantity = cart_item.quantity + quantity
        if new_quantity > size.stock:
            flash(f'Cannot add more. Stock limit: {size.stock}', 'warning')
        else:
            cart_item.quantity = new_quantity
            flash(f'Updated {product.name} ({size.size}) quantity in cart.', 'success')
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            size_id=size_id,
            quantity=quantity
        )
        db.session.add(cart_item)
        flash(f'Added {product.name} ({size.size}) to cart!', 'success')

    db.session.commit()
    return redirect(url_for('shop.view_cart'))

@shop_bp.route('/cart/update', methods=['POST'])
@login_required
def update_cart():
    item_id = request.form.get('item_id', type=int)
    quantity = request.form.get('quantity', type=int)

    cart_item = CartItem.query.get_or_404(item_id)

    if cart_item.cart.user_id != current_user.id:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    if quantity <= 0:
        db.session.delete(cart_item)
        db.session.commit()
        return jsonify({
            'success': True,
            'removed': True,
            'cart_total': current_user.cart.get_subtotal(),
            'item_count': current_user.cart.get_total_items()
        })

    if quantity > cart_item.size.stock:
        return jsonify({
            'success': False,
            'error': f'Maximum available: {cart_item.size.stock}'
        })

    cart_item.quantity = quantity
    db.session.commit()

    return jsonify({
        'success': True,
        'item_subtotal': cart_item.get_subtotal(),
        'cart_total': current_user.cart.get_subtotal(),
        'item_count': current_user.cart.get_total_items()
    })

@shop_bp.route('/cart/remove/<int:item_id>', methods=['POST'])
@login_required
def remove_from_cart(item_id):
    cart_item = CartItem.query.get_or_404(item_id)

    if cart_item.cart.user_id != current_user.id:
        flash('Unauthorized action.', 'danger')
        return redirect(url_for('shop.view_cart'))

    db.session.delete(cart_item)
    db.session.commit()
    flash('Item removed from cart.', 'info')
    return redirect(url_for('shop.view_cart'))

@shop_bp.route('/checkout/shipping', methods=['GET', 'POST'])
@login_required
def checkout_shipping():
    if not current_user.cart or not current_user.cart.items:
        flash('Your cart is empty.', 'warning')
        return redirect(url_for('shop.view_cart'))

    form = AddressForm()
    addresses = Address.query.filter_by(user_id=current_user.id).all()

    if request.method == 'POST':
        selected_address_id = request.form.get('selected_address')
        if selected_address_id:
            address = Address.query.get(selected_address_id)
            if address and address.user_id == current_user.id:
                session['checkout_address'] = {
                    'full_name': address.full_name,
                    'phone': address.phone,
                    'address_line1': address.address_line1,
                    'address_line2': address.address_line2,
                    'city': address.city,
                    'postal_code': address.postal_code
                }
                return redirect(url_for('shop.checkout_delivery'))

        if form.validate_on_submit():
            session['checkout_address'] = {
                'full_name': form.full_name.data,
                'phone': form.phone.data,
                'address_line1': form.address_line1.data,
                'address_line2': form.address_line2.data or '',
                'city': form.city.data,
                'postal_code': form.postal_code.data
            }

            if form.is_default.data:
                Address.query.filter_by(user_id=current_user.id).update({'is_default': False})
                new_address = Address(
                    user_id=current_user.id,
                    full_name=form.full_name.data,
                    phone=form.phone.data,
                    address_line1=form.address_line1.data,
                    address_line2=form.address_line2.data or '',
                    city=form.city.data,
                    postal_code=form.postal_code.data,
                    is_default=True
                )
                db.session.add(new_address)
                db.session.commit()

            return redirect(url_for('shop.checkout_delivery'))

    return render_template('shop/checkout_shipping.html', 
                         form=form, 
                         addresses=addresses,
                         cart=current_user.cart)

@shop_bp.route('/checkout/delivery', methods=['GET', 'POST'])
@login_required
def checkout_delivery():
    if 'checkout_address' not in session:
        flash('Please enter shipping information first.', 'warning')
        return redirect(url_for('shop.checkout_shipping'))

    form = DeliveryForm()
    cart = current_user.cart
    subtotal = cart.get_subtotal()

    if form.validate_on_submit():
        delivery_type = form.delivery_type.data

        if delivery_type == 'express':
            shipping_fee = 68
            delivery_days = 2
        else:
            shipping_fee = 39
            delivery_days = 5

        discount = 0
        if form.promo_code.data:
            promo_code_obj = PromoCode.query.filter_by(
                code=form.promo_code.data.upper().strip()
            ).first()
            if promo_code_obj and promo_code_obj.is_valid():
                discount = promo_code_obj.calculate_discount(subtotal)

        session['checkout_delivery'] = {
            'type': delivery_type,
            'fee': shipping_fee,
            'days': delivery_days,
            'promo_code': form.promo_code.data.upper().strip() if form.promo_code.data else None,
            'discount': discount
        }

        return redirect(url_for('shop.checkout_payment'))

    return render_template('shop/checkout_delivery.html',
                         form=form,
                         cart=cart,
                         subtotal=subtotal,
                         address=session['checkout_address'])

@shop_bp.route('/checkout/payment', methods=['GET', 'POST'])
@login_required
def checkout_payment():
    if 'checkout_address' not in session or 'checkout_delivery' not in session:
        flash('Please complete previous checkout steps.', 'warning')
        return redirect(url_for('shop.checkout_shipping'))

    form = PaymentForm()
    cart = current_user.cart
    subtotal = cart.get_subtotal()
    shipping_fee = session['checkout_delivery']['fee']
    discount = session['checkout_delivery'].get('discount', 0)
    final_total = subtotal + shipping_fee - discount

    has_sufficient_funds = current_user.robux_balance >= final_total

    if form.validate_on_submit():
        if not has_sufficient_funds:
            flash('Insufficient Robux balance. Please earn more Robux.', 'danger')
            return redirect(url_for('shop.checkout_payment'))

        if current_user.deduct_robux(final_total, f"Order payment"):
            order = Order(
                user_id=current_user.id,
                order_number=generate_order_number(),
                total_robux=subtotal,
                shipping_fee=shipping_fee,
                discount_amount=discount,
                final_total=final_total,
                status='pending',
                shipping_address=session['checkout_address'],
                delivery_type=session['checkout_delivery']['type'],
                promo_code=session['checkout_delivery'].get('promo_code')
            )
            db.session.add(order)
            db.session.flush()

            for cart_item in cart.items:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=cart_item.product_id,
                    size=cart_item.size.size,
                    quantity=cart_item.quantity,
                    price_at_time=cart_item.product.price_robux + cart_item.size.price_modifier
                )
                db.session.add(order_item)
                cart_item.size.stock -= cart_item.quantity

            tracking = OrderTracking(
                order_id=order.id,
                status='pending',
                description='Order placed successfully. Waiting for seller to pack.',
                location='DripBux Warehouse'
            )
            db.session.add(tracking)

            if session['checkout_delivery'].get('promo_code'):
                promo = PromoCode.query.filter_by(
                    code=session['checkout_delivery']['promo_code']
                ).first()
                if promo:
                    promo.current_uses += 1

            cart.clear_cart()

            session.pop('checkout_address', None)
            session.pop('checkout_delivery', None)

            db.session.commit()

            flash(f'Order placed successfully! Order #{order.order_number}', 'success')
            return redirect(url_for('shop.order_confirmation', order_id=order.id))
        else:
            flash('Payment failed. Please try again.', 'danger')

    return render_template('shop/checkout_payment.html',
                         form=form,
                         cart=cart,
                         subtotal=subtotal,
                         shipping_fee=shipping_fee,
                         discount=discount,
                         final_total=final_total,
                         balance=current_user.robux_balance,
                         has_sufficient_funds=has_sufficient_funds)

@shop_bp.route('/checkout/confirmation/<int:order_id>')
@login_required
def order_confirmation(order_id):
    order = Order.query.get_or_404(order_id)
    if order.user_id != current_user.id:
        flash('Access denied.', 'danger')
        return redirect(url_for('main.index'))

    return render_template('shop/order_confirmation.html', order=order)

@shop_bp.route('/orders')
@login_required
def order_history():
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return render_template('shop/orders.html', orders=orders)

@shop_bp.route('/order/<int:order_id>')
@login_required
def order_detail(order_id):
    order = Order.query.get_or_404(order_id)
    if order.user_id != current_user.id:
        flash('Access denied.', 'danger')
        return redirect(url_for('main.index'))

    can_review = order.status == 'delivered'

    return render_template('shop/order_detail.html', 
                         order=order,
                         can_review=can_review)

@shop_bp.route('/order/<int:order_id>/review', methods=['GET', 'POST'])
@login_required
def submit_review(order_id):
    order = Order.query.get_or_404(order_id)
    if order.user_id != current_user.id or order.status != 'delivered':
        flash('Cannot review this order.', 'danger')
        return redirect(url_for('shop.order_detail', order_id=order_id))

    form = ReviewForm()
    if form.validate_on_submit():
        for item in order.items:
            existing = Review.query.filter_by(
                user_id=current_user.id,
                product_id=item.product_id
            ).first()

            if not existing:
                review = Review(
                    user_id=current_user.id,
                    product_id=item.product_id,
                    order_id=order.id,
                    rating=int(form.rating.data),
                    title=form.title.data,
                    comment=form.comment.data,
                    is_verified_purchase=True
                )
                db.session.add(review)

        db.session.commit()
        flash('Thank you for your review!', 'success')
        return redirect(url_for('shop.order_detail', order_id=order_id))

    return render_template('shop/submit_review.html', form=form, order=order)

@shop_bp.route('/wishlist')
@login_required
def view_wishlist():
    wishlist_items = Wishlist.query.filter_by(user_id=current_user.id).all()
    return render_template('shop/wishlist.html', wishlist_items=wishlist_items)

@shop_bp.route('/wishlist/add/<int:product_id>', methods=['POST'])
@login_required
def add_to_wishlist(product_id):
    product = Product.query.get_or_404(product_id)

    existing = Wishlist.query.filter_by(
        user_id=current_user.id,
        product_id=product_id
    ).first()

    if existing:
        flash('Item is already in your wishlist.', 'info')
    else:
        wishlist_item = Wishlist(user_id=current_user.id, product_id=product_id)
        db.session.add(wishlist_item)
        db.session.commit()
        flash(f'Added {product.name} to wishlist!', 'success')

    return redirect(url_for('main.product_detail', product_id=product_id))

@shop_bp.route('/wishlist/remove/<int:product_id>', methods=['POST'])
@login_required
def remove_from_wishlist(product_id):
    wishlist_item = Wishlist.query.filter_by(
        user_id=current_user.id,
        product_id=product_id
    ).first_or_404()

    db.session.delete(wishlist_item)
    db.session.commit()
    flash('Removed from wishlist.', 'info')
    return redirect(url_for('shop.view_wishlist'))
