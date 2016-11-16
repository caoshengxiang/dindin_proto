from models import *
from social import *

users = User.query.all()
for u in users:
    u.username = generate_username(u.firstName + " " + u.lastName)
    try:
        u.save()
        print "[Success] User %d successfully updated username" % u.id
    except:
        session.rollback()
        print "[Fail]    User %d failed update username" % u.id