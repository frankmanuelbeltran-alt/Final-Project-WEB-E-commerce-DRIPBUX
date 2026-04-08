"""
Main Routes for DripBux
Homepage, about page, and public product browsing.
"""
from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import current_user
from models import Product, Review
from forms import SearchForm
from sqlalchemy import or_

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Homepage with featured products and categories."""
    featured_products = Product.query.filter_by(is_active=True).order_by(Product.created_at.desc()).limit(8).all()
    shirts = Product.query.filter_by(category='shirts', is_active=True).limit(4).all()
    hoodies = Product.query.filter_by(category='hoodies', is_active=True).limit(4).all()
    pants = Product.query.filter_by(category='pants', is_active=True).limit(4).all()
    accessories = Product.query.filter_by(category='accessories', is_active=True).limit(4).all()

    return render_template('index.html',
                         featured_products=featured_products,
                         shirts=shirts,
                         hoodies=hoodies,
                         pants=pants,
                         accessories=accessories)

@main_bp.route('/about')
def about():
    """About page with project information."""
    return render_template('about.html')

@main_bp.route('/search', methods=['GET', 'POST'])
def search():
    """Search products with filters and sorting."""
    form = SearchForm(request.args)
    query = request.args.get('query', '')
    category = request.args.get('category', 'all')
    sort_by = request.args.get('sort_by', 'newest')

    products_query = Product.query.filter_by(is_active=True)

    if query:
        products_query = products_query.filter(
            or_(Product.name.ilike(f'%{query}%'), Product.description.ilike(f'%{query}%'))
        )

    if category and category != 'all':
        products_query = products_query.filter_by(category=category)

    if sort_by == 'price_low':
        products_query = products_query.order_by(Product.price_robux.asc())
    elif sort_by == 'price_high':
        products_query = products_query.order_by(Product.price_robux.desc())
    else:
        products_query = products_query.order_by(Product.created_at.desc())

    products = products_query.all()

    return render_template('search.html', products=products, form=form,
                         query=query, category=category, sort_by=sort_by)

@main_bp.route('/product/<int:product_id>')
def product_detail(product_id):
    """Product detail page with reviews and related items."""
    product = Product.query.get_or_404(product_id)

    if not product.is_active:
        flash('This product is no longer available.', 'warning')
        return redirect(url_for('main.index'))

    reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()
    related_products = Product.query.filter(
        Product.category == product.category,
        Product.id != product.id,
        Product.is_active == True
    ).limit(4).all()

    in_wishlist = False
    if current_user.is_authenticated:
        from models import Wishlist
        in_wishlist = Wishlist.query.filter_by(user_id=current_user.id, product_id=product_id).first() is not None

    return render_template('product_detail.html', product=product, reviews=reviews,
                         related_products=related_products, in_wishlist=in_wishlist)
