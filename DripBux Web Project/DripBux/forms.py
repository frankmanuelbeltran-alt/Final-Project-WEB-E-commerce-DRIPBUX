"""
WTForms for DripBux
All form classes for validation and CSRF protection.
"""

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField, IntegerField, TextAreaField, SelectField, BooleanField, HiddenField, FileField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length, NumberRange, Optional, ValidationError
from models import User, PromoCode

class RegistrationForm(FlaskForm):
    """User registration form with validation."""
    username = StringField('Username', validators=[
        DataRequired(),
        Length(min=3, max=80, message='Username must be between 3 and 80 characters')
    ])
    email = EmailField('Email', validators=[
        DataRequired(),
        Email(message='Please enter a valid email address')
    ])
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=6, message='Password must be at least 6 characters long')
    ])
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(),
        EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Create Account')

    def validate_username(self, username):
        """Check if username is already taken."""
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username is already taken. Please choose another.')

    def validate_email(self, email):
        """Check if email is already registered."""
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email is already registered. Please use another or login.')

class LoginForm(FlaskForm):
    """User login form."""
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class AddressForm(FlaskForm):
    """Shipping address form for checkout."""
    full_name = StringField('Full Name', validators=[
        DataRequired(),
        Length(max=100)
    ])
    phone = StringField('Phone Number', validators=[
        DataRequired(),
        Length(min=10, max=20, message='Please enter a valid phone number')
    ])
    address_line1 = StringField('Address Line 1', validators=[
        DataRequired(),
        Length(max=255)
    ])
    address_line2 = StringField('Address Line 2 (Optional)', validators=[
        Optional(),
        Length(max=255)
    ])
    city = StringField('City', validators=[
        DataRequired(),
        Length(max=100)
    ])
    postal_code = StringField('Postal Code', validators=[
        DataRequired(),
        Length(max=20)
    ])
    is_default = BooleanField('Save as default address')
    submit = SubmitField('Save Address')

class DeliveryForm(FlaskForm):
    """Delivery method selection form."""
    delivery_type = SelectField('Delivery Method', choices=[
        ('standard', 'Standard Delivery (5-7 days) - 50 Robux'),
        ('express', 'Express Delivery (2-3 days) - 150 Robux')
    ], validators=[DataRequired()])
    promo_code = StringField('Promo Code (Optional)', validators=[Optional()])
    submit = SubmitField('Continue to Payment')

    def validate_promo_code(self, promo_code):
        """Validate promo code if provided."""
        if promo_code.data:
            code = promo_code.data.upper().strip()
            promo = PromoCode.query.filter_by(code=code).first()
            if not promo:
                raise ValidationError('Invalid promo code.')
            if not promo.is_valid():
                raise ValidationError('This promo code has expired or reached its usage limit.')

class PaymentForm(FlaskForm):
    """Payment confirmation form (Robux)."""
    confirm_payment = BooleanField('I confirm I want to complete this purchase', validators=[DataRequired()])
    submit = SubmitField('Complete Purchase')

class ProductForm(FlaskForm):
    """Admin product creation/editing form."""
    name = StringField('Product Name', validators=[DataRequired(), Length(max=150)])
    description = TextAreaField('Description', validators=[Optional()])
    category = SelectField('Category', choices=[
        ('shirts', 'Shirts'),
        ('hoodies', 'Hoodies'),
        ('pants', 'Pants'),
        ('accessories', 'Accessories')
    ], validators=[DataRequired()])
    price_robux = IntegerField('Base Price (Robux)', validators=[
        DataRequired(),
        NumberRange(min=1, message='Price must be at least 1 Robux')
    ])
    image = FileField('Main Product Image')
    is_active = BooleanField('Active', default=True)
    submit = SubmitField('Save Product')

class ProductSizeForm(FlaskForm):
    """Form for adding product sizes."""
    size = SelectField('Size', choices=[
        ('XS', 'XS'),
        ('S', 'S'),
        ('M', 'M'),
        ('L', 'L'),
        ('XL', 'XL'),
        ('XXL', 'XXL')
    ], validators=[DataRequired()])
    stock = IntegerField('Stock Quantity', validators=[
        DataRequired(),
        NumberRange(min=0, message='Stock cannot be negative')
    ])
    price_modifier = IntegerField('Price Modifier (Robux)', default=0)
    submit = SubmitField('Add Size')

class ReviewForm(FlaskForm):
    """Product review form."""
    rating = SelectField('Rating', choices=[
        ('5', '5 Stars - Excellent'),
        ('4', '4 Stars - Very Good'),
        ('3', '3 Stars - Good'),
        ('2', '2 Stars - Fair'),
        ('1', '1 Star - Poor')
    ], validators=[DataRequired()])
    title = StringField('Review Title', validators=[Optional(), Length(max=100)])
    comment = TextAreaField('Your Review', validators=[Optional()])
    submit = SubmitField('Submit Review')

class PromoCodeForm(FlaskForm):
    """Admin promo code creation form."""
    code = StringField('Code', validators=[DataRequired(), Length(max=20)])
    discount_percent = IntegerField('Discount Percentage', validators=[Optional(), NumberRange(0, 100)])
    discount_amount = IntegerField('Discount Amount (Robux)', validators=[Optional(), NumberRange(min=0)])
    min_order_value = IntegerField('Minimum Order Value', default=0)
    max_uses = IntegerField('Maximum Uses', validators=[Optional()])
    valid_days = IntegerField('Valid for (days)', validators=[Optional()])
    submit = SubmitField('Create Code')

class CartUpdateForm(FlaskForm):
    """Form for updating cart quantities via AJAX."""
    item_id = HiddenField('Item ID', validators=[DataRequired()])
    quantity = IntegerField('Quantity', validators=[
        DataRequired(),
        NumberRange(min=0, message='Quantity must be 0 or more')
    ])

class SearchForm(FlaskForm):
    """Product search form."""
    query = StringField('Search', validators=[DataRequired()])
    category = SelectField('Category', choices=[
        ('all', 'All Categories'),
        ('shirts', 'Shirts'),
        ('hoodies', 'Hoodies'),
        ('pants', 'Pants'),
        ('accessories', 'Accessories')
    ], default='all')
    sort_by = SelectField('Sort By', choices=[
        ('newest', 'Newest First'),
        ('price_low', 'Price: Low to High'),
        ('price_high', 'Price: High to Low'),
        ('popular', 'Most Popular')
    ], default='newest')
    submit = SubmitField('Search')
