"""
DripBux - Flask E-Commerce Simulation
A complete clothing store with Robux currency, shipping, and delivery tracking.
Created by: Frank Manuel Beltran
"""

from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from extensions import db
import os

login_manager = LoginManager()
migrate = Migrate()
csrf = CSRFProtect()

def create_app():
    """Application factory pattern for creating Flask app instance."""
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dripbux-dev-secret-key-2024')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///dripbux.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'images', 'products')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)

    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'

    from models import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from routes.auth import auth_bp
    from routes.main import main_bp
    from routes.shop import shop_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(main_bp)
    app.register_blueprint(shop_bp, url_prefix='/shop')
    app.register_blueprint(admin_bp, url_prefix='/admin')

    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
        print(f"📁 Created upload directory: {app.config['UPLOAD_FOLDER']}")

    with app.app_context():
        db.create_all()
        create_admin_user()

    return app

def create_admin_user():
    """Create default admin user if it doesn't exist."""
    from models import User
    from werkzeug.security import generate_password_hash

    admin = User.query.filter_by(username='frankmanuelbeltran_alt').first()
    if not admin:
        admin = User(
            username='frankmanuelbeltran_alt',
            email='admin@dripbux.com',
            password_hash=generate_password_hash('admin123'),
            robux_balance=999999,
            is_admin=True
        )
        db.session.add(admin)   
        db.session.commit()
        print("✅ Admin user created: frankmanuelbeltran_alt / admin123")

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)