"""Admin Routes for DripBux"""
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_required, current_user
from functools import wraps
from extensions import db
from models import User, Product, ProductSize, Order, OrderTracking, PromoCode, Review
from forms import ProductForm, ProductSizeForm, PromoCodeForm
from werkzeug.utils import secure_filename
import os
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, template_folder='templates/admin')

def admin_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if current_user.username != 'frankmanuelbeltran_alt':
            flash('Access denied. Admin privileges required.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/')
@admin_required
def dashboard():
    total_users = User.query.count()
    total_products = Product.query.count()
    total_orders = Order.query.count()
    total_revenue = db.session.query(db.func.sum(Order.final_total)).scalar() or 0
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    pending_orders = Order.query.filter_by(status='pending').count()
    low_stock = ProductSize.query.filter(ProductSize.stock < 5).all()

    return render_template('admin/dashboard.html',
                         total_users=total_users,
                         total_products=total_products,
                         total_orders=total_orders,
                         total_revenue=total_revenue,
                         recent_orders=recent_orders,
                         pending_orders=pending_orders,
                         low_stock=low_stock)

@admin_bp.route('/products')
@admin_required
def products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    return render_template('admin/products.html', products=products)

@admin_bp.route('/products/create', methods=['GET', 'POST'])
@admin_required
def create_product():
    form = ProductForm()

    if form.validate_on_submit():
        product = Product(
            name=form.name.data,
            description=form.description.data,
            category=form.category.data,
            price_robux=form.price_robux.data,
            is_active=form.is_active.data
        )

        if form.image.data:
            filename = secure_filename(form.image.data.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            form.image.data.save(filepath)
            product.image_url = f"images/products/{filename}"

        db.session.add(product)
        db.session.commit()

        flash(f'Product "{product.name}" created successfully!', 'success')
        return redirect(url_for('admin.edit_product_sizes', product_id=product.id))

    return render_template('admin/create_product.html', form=form)

@admin_bp.route('/products/<int:product_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_product(product_id):
    product = Product.query.get_or_404(product_id)
    form = ProductForm(obj=product)

    if form.validate_on_submit():
        product.name = form.name.data
        product.description = form.description.data
        product.category = form.category.data
        product.price_robux = form.price_robux.data
        product.is_active = form.is_active.data

        if form.image.data:
            filename = secure_filename(form.image.data.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            form.image.data.save(filepath)
            product.image_url = f"images/products/{filename}"

        db.session.commit()
        flash('Product updated successfully!', 'success')
        return redirect(url_for('admin.products'))

    return render_template('admin/edit_product.html', form=form, product=product)

@admin_bp.route('/products/<int:product_id>/sizes', methods=['GET', 'POST'])
@admin_required
def edit_product_sizes(product_id):
    product = Product.query.get_or_404(product_id)
    form = ProductSizeForm()

    if form.validate_on_submit():
        existing = ProductSize.query.filter_by(
            product_id=product_id,
            size=form.size.data
        ).first()

        if existing:
            existing.stock = form.stock.data
            existing.price_modifier = form.price_modifier.data
            flash(f'Updated size {form.size.data}!', 'success')
        else:
            size = ProductSize(
                product_id=product_id,
                size=form.size.data,
                stock=form.stock.data,
                price_modifier=form.price_modifier.data
            )
            db.session.add(size)
            flash(f'Added size {form.size.data}!', 'success')

        db.session.commit()
        return redirect(url_for('admin.edit_product_sizes', product_id=product_id))

    return render_template('admin/edit_sizes.html', product=product, form=form)

@admin_bp.route('/products/<int:product_id>/delete', methods=['POST'])
@admin_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    product.is_active = False
    db.session.commit()
    flash(f'Product "{product.name}" has been deactivated.', 'info')
    return redirect(url_for('admin.products'))

@admin_bp.route('/sizes/<int:size_id>/delete', methods=['POST'])
@admin_required
def delete_size(size_id):
    size = ProductSize.query.get_or_404(size_id)
    product_id = size.product_id
    db.session.delete(size)
    db.session.commit()
    flash('Size deleted.', 'info')
    return redirect(url_for('admin.edit_product_sizes', product_id=product_id))

@admin_bp.route('/orders')
@admin_required
def orders():
    status = request.args.get('status', 'all')
    query = Order.query
    if status != 'all':
        query = query.filter_by(status=status)
    orders = query.order_by(Order.created_at.desc()).all()
    return render_template('admin/orders.html', orders=orders, current_status=status)

@admin_bp.route('/orders/<int:order_id>')
@admin_required
def order_detail(order_id):
    order = Order.query.get_or_404(order_id)
    return render_template('admin/order_detail.html', order=order)

@admin_bp.route('/orders/<int:order_id>/status', methods=['POST'])
@admin_required
def update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    new_status = request.form.get('status')
    description = request.form.get('description', '')
    location = request.form.get('location', 'DripBux Warehouse')

    valid_statuses = ['pending', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']

    if new_status in valid_statuses:
        order.status = new_status
        tracking = OrderTracking(
            order_id=order.id,
            status=new_status,
            description=description or f'Order status updated to {new_status}',
            location=location
        )
        db.session.add(tracking)
        db.session.commit()
        flash(f'Order status updated to {new_status}', 'success')
    else:
        flash('Invalid status.', 'danger')

    return redirect(url_for('admin.order_detail', order_id=order_id))

@admin_bp.route('/orders/<int:order_id>/simulate-delivery', methods=['POST'])
@admin_required
def simulate_delivery(order_id):
    order = Order.query.get_or_404(order_id)

    stages = [
        ('packed', 'Your order has been packed and is ready for shipment.', 'DripBux Warehouse'),
        ('shipped', 'Your order has been shipped and is on its way.', 'Distribution Center'),
        ('out_for_delivery', 'Your order is out for delivery today.', f"{order.shipping_address.get('city', 'Local')} Hub"),
        ('delivered', 'Your order has been delivered. Thank you for shopping!', order.shipping_address.get('address_line1', 'Delivery Address'))
    ]

    current_status = order.status
    if current_status == 'pending':
        next_stage = stages[0]
    elif current_status == 'packed':
        next_stage = stages[1]
    elif current_status == 'shipped':
        next_stage = stages[2]
    elif current_status == 'out_for_delivery':
        next_stage = stages[3]
    else:
        flash('Order is already delivered or cancelled.', 'info')
        return redirect(url_for('admin.order_detail', order_id=order_id))

    order.status = next_stage[0]
    tracking = OrderTracking(
        order_id=order.id,
        status=next_stage[0],
        description=next_stage[1],
        location=next_stage[2]
    )
    db.session.add(tracking)
    db.session.commit()

    flash(f'Simulated: Order is now {next_stage[0]}', 'success')
    return redirect(url_for('admin.order_detail', order_id=order_id))

@admin_bp.route('/users')
@admin_required
def users():
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=users)

@admin_bp.route('/users/<int:user_id>/adjust-robux', methods=['POST'])
@admin_required
def adjust_robux(user_id):
    user = User.query.get_or_404(user_id)
    amount = request.form.get('amount', type=int)
    reason = request.form.get('reason', 'Admin adjustment')

    if amount is None:
        flash('Invalid amount.', 'danger')
        return redirect(url_for('admin.users'))

    if amount > 0:
        user.add_robux(amount, reason)
        flash(f'Added {amount} Robux to {user.username}\'s account.', 'success')
    else:
        if user.robux_balance >= abs(amount):
            user.deduct_robux(abs(amount), reason)
            flash(f'Deducted {abs(amount)} Robux from {user.username}\'s account.', 'success')
        else:
            flash('User does not have enough Robux to deduct.', 'danger')
            return redirect(url_for('admin.users'))

    db.session.commit()
    return redirect(url_for('admin.users'))

@admin_bp.route('/promo-codes')
@admin_required
def promo_codes():
    codes = PromoCode.query.order_by(PromoCode.created_at.desc()).all()
    return render_template('admin/promo_codes.html', codes=codes)

@admin_bp.route('/promo-codes/create', methods=['GET', 'POST'])
@admin_required
def create_promo_code():
    form = PromoCodeForm()

    if form.validate_on_submit():
        valid_until = None
        if form.valid_days.data:
            valid_until = datetime.utcnow() + timedelta(days=form.valid_days.data)

        promo = PromoCode(
            code=form.code.data.upper(),
            discount_percent=form.discount_percent.data or 0,
            discount_amount=form.discount_amount.data or 0,
            min_order_value=form.min_order_value.data,
            max_uses=form.max_uses.data,
            valid_until=valid_until
        )
        db.session.add(promo)
        db.session.commit()
        flash(f'Promo code {promo.code} created!', 'success')
        return redirect(url_for('admin.promo_codes'))

    return render_template('admin/create_promo_code.html', form=form)

@admin_bp.route('/promo-codes/<int:code_id>/toggle', methods=['POST'])
@admin_required
def toggle_promo_code(code_id):
    promo = PromoCode.query.get_or_404(code_id)
    promo.is_active = not promo.is_active
    db.session.commit()
    status = 'activated' if promo.is_active else 'deactivated'
    flash(f'Promo code {promo.code} {status}.', 'success')
    return redirect(url_for('admin.promo_codes'))

@admin_bp.route('/reviews')
@admin_required
def reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return render_template('admin/reviews.html', reviews=reviews)

@admin_bp.route('/reviews/<int:review_id>/delete', methods=['POST'])
@admin_required
def delete_review(review_id):
    review = Review.query.get_or_404(review_id)
    db.session.delete(review)
    db.session.commit()
    flash('Review deleted.', 'info')
    return redirect(url_for('admin.reviews'))
