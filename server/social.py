from models import *
import re


def generate_username(fullname):
    name_parts = fullname.split(" ")
    username = ""
    # construct username with basic elements
    if len(name_parts) > 1:
        fname = name_parts[0]
        lname = name_parts[1]
        username = (fname[0] + lname).lower()
    elif len(name_parts) == 1:
        username = name_parts[0].lower()

    # Make sure username unique
    counter = 0
    existing_usernames = User.query.filter(User.username.ilike("%" + username + "%")).all()
    for user in existing_usernames:
        if username == user.username.lower():
            counter = 1
            continue
        elif username + str(counter) == user.username.lower():
            n = re.search('\d+', user.username)
            if n:
                if counter > n:
                    continue
                else:
                    counter = n

    if counter >= 1:
        username += str(counter)

    return username


