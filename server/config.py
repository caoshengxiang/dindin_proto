from local_settings import *

# from app import ap
DEBUG = local_settings['debug']

# Configuration for Database
SQLALCHEMY_DATABASE_URI = local_settings['SQLALCHEMY_DATABASE_URI']
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Configuration for development environment
SECRET_KEY = local_settings['SECRET_KEY']
SECURITY_PASSWORD_SALT = local_settings['SECURITY_PASSWORD_SALT']
