# DripBux

A full-stack Flask e-commerce simulation for selling clothing items with Robux as mock currency.

## Created By
**Frank Manuel Beltran**
- Admin Username: `frankmanuelbeltran_alt`

## About
DripBux is a Flask-based e-commerce simulation where users buy real clothing like shirts, hoodies, pants, and accessories. Users pay using a mock Robux balance, then go through a realistic checkout process including shipping info and delivery tracking.

## Tech Stack

### Backend
- Flask (Python)
- Flask-Login for authentication
- Flask-SQLAlchemy for ORM
- Flask-WTF for forms
- Flask-Migrate for database migrations

### Frontend
- HTML5 with Jinja2 templating
- Bootstrap 5
- JavaScript

### Database
- SQLite

## Features

### Authentication
- User registration with 1000 Robux starting balance
- Secure login/logout with session management
- Password hashing with Werkzeug

### User System
- Profile page with Robux balance display
- Saved shipping addresses
- Order history
- Transaction logs
- Earn Robux button (for testing)

### Product System
- Product listing with categories (shirts, hoodies, pants, accessories)
- Product detail pages with multiple images
- Size selection with stock tracking
- Reviews and ratings

### Cart & Checkout
- Add to cart with size selection
- Update quantities
- Multi-step checkout:
  1. Shipping information
  2. Delivery method selection (Standard/Express)
  3. Payment with Robux
  4. Order confirmation

### Order Tracking
- Realistic tracking stages:
  - Pending
  - Packed
  - Shipped
  - Out for delivery
  - Delivered
- Timeline visualization
- Delivery simulation

### Admin Panel
- Dashboard with statistics
- Product management (CRUD)
- Order management with status updates
- User management with Robux adjustment
- Promo code management
- Review moderation

### Extra Features
- Wishlist system
- Ratings and reviews
- Promo codes with discounts
- Low stock alerts
- Search and filtering

## Installation

1. Clone or download the project:
```bash
cd DripBux
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the application:
```bash
python app.py
```

6. Open your browser and go to `http://localhost:5000`


## Project Structure
```
DripBux/
├── app.py                 # Main application file
├── extensions.py          # DB extension SQALchemy               
├── models.py              # Database models
├── forms.py               # WTForms classes
├── requirements.txt       # Python dependencies
├── routes/
│   ├── auth.py           # Authentication routes
│   ├── main.py           # Main/public routes
│   ├── shop.py           # Shopping/orders routes
│   └── admin.py          # Admin panel routes
├── templates/
│   ├── base.html         # Base template
│   ├── index.html        # Homepage
│   ├── about.html        # About page
│   ├── search.html       # Product search
│   ├── product_detail.html
│   ├── auth/             # Auth templates
│   ├── shop/             # Shop templates
│   └── admin/            # Admin templates
├── static/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Product images
└── migrations/           # Database migrations
```

## License
This project is for educational purposes only.
