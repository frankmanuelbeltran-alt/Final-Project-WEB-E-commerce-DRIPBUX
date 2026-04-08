"""Authentication Routes for DripBux"""
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, Cart, Address
from forms import RegistrationForm, LoginForm, AddressForm
from extensions import db

auth_bp = Blueprint('auth', __name__, template_folder='templates/auth')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=generate_password_hash(form.password.data),
            robux_balance=1000
        )
        db.session.add(user)
        db.session.commit()

        cart = Cart(user_id=user.id)
        db.session.add(cart)
        db.session.commit()

        flash('Registration successful! Welcome to DripBux. You received 1000 Robux!', 'success')
        login_user(user)
        return redirect(url_for('main.index'))

    return render_template('auth/register.html', form=form)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()

        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user, remember=form.remember.data)
            if not user.cart:
                cart = Cart(user_id=user.id)
                db.session.add(cart)
                db.session.commit()

            next_page = request.args.get('next')
            flash(f'Welcome back, {user.username}!', 'success')
            return redirect(next_page if next_page else url_for('main.index'))
        else:
            flash('Invalid username or password.', 'danger')

    return render_template('auth/login.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.index'))

@auth_bp.route('/profile')
@login_required
def profile():
    addresses = Address.query.filter_by(user_id=current_user.id).all()
    orders = current_user.orders
    transactions = current_user.transactions[-10:]
    return render_template('auth/profile.html', 
                         addresses=addresses, 
                         orders=orders,
                         transactions=transactions)

@auth_bp.route('/profile/address/add', methods=['GET', 'POST'])
@login_required
def add_address():
    form = AddressForm()
    if form.validate_on_submit():
        if form.is_default.data:
            Address.query.filter_by(user_id=current_user.id).update({'is_default': False})

        address = Address(
            user_id=current_user.id,
            full_name=form.full_name.data,
            phone=form.phone.data,
            address_line1=form.address_line1.data,
            address_line2=form.address_line2.data or '',
            city=form.city.data,
            postal_code=form.postal_code.data,
            is_default=form.is_default.data
        )
        db.session.add(address)
        db.session.commit()
        flash('Address added successfully!', 'success')
        return redirect(url_for('auth.profile'))

    return render_template('auth/add_address.html', form=form)

@auth_bp.route('/profile/address/<int:address_id>/delete', methods=['POST'])
@login_required
def delete_address(address_id):
    address = Address.query.get_or_404(address_id)
    if address.user_id != current_user.id:
        flash('Access denied.', 'danger')
        return redirect(url_for('auth.profile'))

    db.session.delete(address)
    db.session.commit()
    flash('Address deleted.', 'info')
    return redirect(url_for('auth.profile'))

@auth_bp.route('/earn-robux', methods=['POST'])
@login_required
def earn_robux():
    amount = request.form.get('amount', 500, type=int)
    current_user.add_robux(amount, "Earned via test button")
    db.session.commit()
    flash(f'Added {amount} Robux to your balance!', 'success')
    return redirect(url_for('auth.profile'))
