import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask.ext.cors import CORS


app = Flask(__name__)
app.config.from_pyfile('config.py')
db = SQLAlchemy(app)
cors = CORS(app)  # https://flask-cors.readthedocs.org/en/latest/
logging.basicConfig(filename='site_log.txt', level=logging.DEBUG,
                    format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)

@app.errorhandler(404)
def page_not_found(e):
    print e
    logger.error('404 Error')
    return '<h1>404: Page Not Found</h1>'

@app.errorhandler(500)
def internal_error(e):
    print e
    logger.error('500 Error')
    return '<h1>500: Internal Server Error'

if __name__ == '__main__':
    app.run(port=8001, debug=True)