import os
import logging
import datetime
from flask import request, send_from_directory, render_template
from flask.ext.bcrypt import Bcrypt

from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from werkzeug import secure_filename
import json
import simplejson
from PIL import Image

from app import app
from models import *
from services import *
from social import *

from const import *

# encryption
bcrypt = Bcrypt(app)

# Set up logger
logging.basicConfig(filename='api_log.txt', level=logging.DEBUG,
                    format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)

# On production, maybe consider changing these to "static"
UPLOAD_FOLDER = '/uploads'
IMAGE_FOLDER = '/uploads/images'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['IMAGE_FOLDER'] = IMAGE_FOLDER

app.template_folder='..'

PHONE_VERIFY_CODE = 7890


@app.route('/')
def return_mobile_app():
    return render_template('index.html')


@app.route('/me/<path:uid>')
def getUserInfo(uid):
    try:
        user = User.query.filter(User.id == uid).one()
        account = Account.query.filter(Account.uid == uid).one()
    except:
        session.rollback()
        return json.dumps({"error": "We are unable to fetch your account info"}), 200, {'contentType': 'Application/JSON'}

    return simplejson.dumps({
        "id": user.id,
        "balance": account.balance,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "image": user.image,
        "email": user.email,
        "phoneNum": user.phoneNum,
        "username": user.username
        }), 200, {'contentType': 'Application/JSON'}


@app.route('/me/<int:uid>/photo/group/<int:gid>', methods=['POST', 'OPTIONS'])
@app.route('/me/<int:uid>/photo', methods=['POST', 'OPTIONS'])
def update_user_photo(uid, gid=None):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    try:
        user = User.query.filter(User.id == uid).one()
    except:
        return json.dumps({"error": "User with id %d cannot be found " % uid}), 404, {'contentType': 'Application/JSON'}

    if gid:
        group = Group.query.filter(Group.id == gid).first()
        # Reassign user to this group
        user = group

    photo = request.files['photos']
    timestamp = datetime.datetime.now()

    # TODO:
    # Add a bit more security here
    curdir = os.getcwd()
    secure_name = str(timestamp) + secure_filename(photo.filename)
    imageLoc = os.path.join(curdir + app.config['IMAGE_FOLDER'], secure_name)
    try:
        photo.save(imageLoc)
        user.image = app.config['IMAGE_FOLDER'] + '/' + secure_name
        user.save()
        logger.info("Photo saved for user %d " % uid)
        optimize_image(imageLoc)
    except:
        logger.error("Photo cannot be saved for user %d " % uid)
        return json.dumps({"error": "Photo cannot be saved for user %d " % uid}), 404, {'contentType': 'Application/JSON'}

    return json.dumps({"success": True})


@app.route('/me/<int:uid>/profile', methods=['POST', 'PUT', 'OPTIONS'])
def update_user_profile(uid):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    try:
        user = User.query.filter(User.id == uid).one()
    except:
        return json.dumps({"error": "User with id %s cannot be found " % str(uid)}), 404, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    for key, val in data.items():
        print "Key: %s, Val: %s" % (key, str(val))
        try:
            setattr(user, key, val)
            user.save()
        except IntegrityError:
            session.rollback()
            return json.dumps({'error': 'emailExists'}), 500, {'contentType': 'Application/JSON'}
        except:
            session.rollback()
            return json.dumps({'error': 'cantSaveProfile'})

    return json.dumps({"success": True})


def optimize_image(imgloc):
    image = Image.open(imgloc)
    try:
        image.save(imgloc, quality=20, optimize=True)
        return True
    except:
        return False


@app.route('/uploads/images/<path:photoname>')
def get_image(photoname):
    curdir = os.getcwd()

    return send_from_directory(curdir + app.config['IMAGE_FOLDER'], photoname)


@app.route('/uploads/users/<path:uid>')
def get_image_by_id(uid):
    # an alternative to get user's image
    user = User.query.filter(User.id == uid).first()
    print "[Debug] Get user %s portrait image" % str(uid)
    print user.image
    filename = user.image.replace('/uploads/images/', '')
    print "filename is " + filename
    return get_image(filename)


@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    # TODO: make login more logical
    if "login" in data and data["login"]:
        try:
            user = User.query.filter(User.email == data["email"]).first()
            if bcrypt.check_password_hash(user.password, data["password"]):
                return json.dumps({"id": user.id}), 200, {'contentType': 'Application/JSON'}
            else:
                logger.error("User %s tried to log in with wrong password" % str(user.id))
                return json.dumps({"error": "Your password is incorrect"}), 500, {'contentType': 'Application/JSON'}
        except:
            session.rollback()
            return json.dumps({"error": "Username or password incorrect"}), 404, {'contentType': 'Application/JSON'}

    # Register instead
    exist_user = User.query.filter(User.email == data['email']).first()

    if exist_user:
        return json.dumps({"error": "userExists"}), 500, {'contentType': 'Application/JSON'}

    try:
        new_user = User(
                    data['firstName'],
                    data['lastName'],
                    data['email'],
                    bcrypt.generate_password_hash(data['password']),
                    data['phoneNum'],
                    data['cpf']
                    )
        new_user.username = generate_username(data['firstName'] + " " + data['lastName'])
        new_user = new_user.save()
        logger.info('User %s %s successfully created' % (new_user.firstName, new_user.lastName))
        # Create new account as user registers
        new_account = Account(uid = new_user.id)
        try:
            new_account.save()
            logger.info('Acount for user id %d successfully created' % new_user.id)
            # Use default verification code if phone num verification not available
            code = generate_phone_verification_code(new_user.phoneNum)
            if code:
                new_user.update_phone_code(code)
            else:
                new_user.update_phone_code(PHONE_VERIFY_CODE)

            return json.dumps({"id": new_user.id}), 200, {'contentType': 'Application/JSON'}

        except:
            return json.dumps({"error": "Please fill out all the required info"}), 500, {'contentType': 'Application/JSON'}

    except:
        session.rollback()
        return json.dumps({"error": "Please fill out all the required info"}), 200, {'contentType': 'Application/JSON'}


@app.route('/transfer', methods=['POST', 'OPTIONS'])
def transfer():
    """
    Expect:
        data = {
            "from": array of from ids,
            "to": array of to ids,
            "amount": <float>, will parse into <Decimal>,
            "note": <str>,
            "type_en": <"payment" or "charge"
         }
    :return:
    """
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    # Note:
    # If is group payment, get group members IDs
    # And also flag each transaction below by adding groupid
    group_transfer = False
    gid = None

    if data["type_en"] == "payment":
        # if payment, it should have only one id in "from"
        if data["group_trans"] == "true" or data["group_trans"] is True:
            group_transfer = True
            gid = int(data["to"][0])
            group = Group.query.filter(Group.id == gid).first()
            data["to"] = group.get_members_id()

        errors = []
        for toid in data["to"]:
            # TODO: make sure fromid account has enough balance
            # create a new transaction for each individual payment
            trans = Transaction()
            trans.fromid = int(data["from"])
            trans.toid = int(toid)
            trans.amount = data["amount"]
            trans.type_en = "payment"
            trans.note = data["note"]
            if group_transfer:
                # This helps to get group flag later on
                trans.groupid = gid
            try:
                user = User.query.filter(User.id == trans.fromid).first()
                if not user.has_enough_balance:
                    # user will not have enough balance for anyone left
                    logger.info("User %d tries to make payment with insufficient balance to user %d", trans.fromid, trans.toid)
                    break
            except:
                session.rollback()
                logger.error("Error occured when checking user available balance, uid %d", trans.fromid)

            try:
                trans.getNames()
                trans.execute()
            except:
                logger.error("Transaction from %d to %d is unable to be executed" % (trans.fromid, trans.toid))
                session.rollback()
                errors.append("Your payment to %d failed." % trans.toid)

        if len(errors) > 0:
            return json.dumps({"error": '\n'.join(errors)}), 500, {"contentType": "Application/JSON"}
        else:
            return simplejson.dumps({"success": True}), 200, {"contentType": "Application/JSON"}

    elif data["type_en"] == "charge":
        # if charge, it should have only one id in "to"
        if data["group_trans"] == "true" or data["group_trans"] is True:
            group_transfer = True
            gid = int(data["from"][0])
            group = Group.query.filter(Group.id == gid).first()
            data["from"] = group.get_members_id()

        errors = []
        for fromid in data["from"]:
            # create a new transaction for each individual charge
            trans = Transaction()
            trans.fromid = int(fromid)
            trans.toid = int(data["to"])
            trans.amount = data["amount"]
            trans.type_en = "charge"
            trans.note = data["note"]
            if group_transfer:
                # This helps to get group flag later on
                trans.groupid = gid

            try:
                trans.getNames()
                trans.save()
            except:
                logger.error("Transaction from %d to %d is unable to be executed" % (trans.fromid, trans.toid))
                session.rollback()
                errors.append("Your charge to %d failed" % trans.fromid)

        if len(errors) > 0:
            return json.dumps({"error": '\n'.join(errors)}), 500, {"contentType": "Application/JSON"}
        else:
            return simplejson.dumps({"success": True}), 200, {"contentType": "Application/JSON"}


@app.route('/transfer/<path:trans_id>', methods=['PUT', 'OPTIONS'])
def finish_transfer(trans_id):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)
    transaction = Transaction.query.filter(Transaction.id == trans_id).first()

    if not transaction:
        logger.error('A non-existing transaction is tried to execute')
        return json.dumps({'error': 'Non-existing transaction.'}), 404, {'contentType': 'Application/JSON'}

    if data["action"] == "reject":
        transaction.mark_rejected()
    else:
        try:
            transaction.execute()
            logger.info('Transaction completed, id: ' + str(transaction.id))
        except:
            session.rollback()
            logger.error('Unable to finish this transaction, id: ' + str(transaction.id))
            return json.dumps({'error': 'Unable to finish this transaction, id: ' + str(transaction.id)}), 500, {'contentType': 'Application/JSON'}

    return simplejson.dumps({
        "success": True,
        "amount": transaction.amount,
        "timestamp": transaction.updated_at.strftime('%s'),
        "id": transaction.id,
        "fromID": transaction.fromid,
        "fromName": transaction.fromName,
        "toID": transaction.toid,
        "toName": transaction.toName,
        "status": transaction.status,
        "type_en": transaction.type_en,
        "groupName": transaction.get_group_name()
        }), 200, {'contentType': 'Application/JSON'}


@app.route('/transfer-from-bank', methods=['PUT', 'POST', 'OPTIONS'])
def transfer_from_bank():
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    default_account = get_default_payment_method(int(data["from"]))
    errors = []

    # Throw error is no default account
    if not default_account:
        error_msg = "No default account for %d " % int(data["from"])
        logger.error(error_msg)
        errors.append(error_msg)
    else:
        total_amount = data["amount"] * len(data["to"])
        # Throw error if default account has not enough balance

        if not default_account.has_enough_balance(total_amount):
            error_msg = "Not enough balance for user %d in default account" % int(data["from"])
            logger.error(error_msg)
            errors.append(error_msg)
        else:
            if default_account.subtract_balance(total_amount):
                try:
                    user_account = Account.query.filter(Account.uid == int(data["from"])).first()
                    # First reload user with the balance from their banks/credit cards
                    user_account.add_balance(total_amount)
                except:
                    logger.error("Transaction from %d is unable to be executed, but user bank has already been charged" % int(data["from"]))
                    return json.dumps({"error": 'There was a problem processing your transaction. Please contact customer service.'}), 500, {"contentType": "Application/JSON"}

            else:
                logger.error("User %d bank is unable to be charged" % int(data["from"]))

            # Once use account is fully loaded
            for toid in data["to"]:
                # Two steps:
                # - if user has enough balance in bank, but not enough in Dindin
                #   account
                #   - reload that amount from bank/credit card, when success
                #       - execute payment (kind of like the "charge" transaction)
                trans = Transaction()
                trans.fromid = int(data["from"])
                trans.toid = int(toid)
                trans.amount = data["amount"]
                trans.type_en = "payment"
                trans.note = data["note"]

                try:
                    trans.getNames()
                    trans.save()
                    # Todo:
                    # This step will not be completed unless the money
                    # is successfully reloaded to user's Dindin account
                    # Especially for the case of credit card
                    trans.execute()

                except:
                    logger.error("Transaction from %d to %d is unable to be executed" % (trans.fromid, trans.toid))
                    session.rollback()
                    errors.append("Your payment to %d failed." % trans.toid)

    if len(errors) > 0:
        return json.dumps({"error": '\n'.join(errors)}), 500, {"contentType": "Application/JSON"}
    else:
        return simplejson.dumps({"success": True}), 200, {"contentType": "Application/JSON"}


def get_name_by_id(uid):
    # Use for users only
    u = User.query.filter(User.id == uid).first()
    if u:
        return "%s %s" % (u.firstName, u.lastName)
    else:
        return ""


def returnActivities(**kwargs):
    data = []
    trans_query = Transaction.query

    if "filter" in kwargs:
        if kwargs["filter"] == "pending":
            # Pending feed
            activities = trans_query.filter(
                (Transaction.fromid == kwargs["uid"])   |
                (Transaction.toid == kwargs["uid"])
            ).filter(
                Transaction.status == "pending",
                Transaction.type_en != "withdraw").order_by(desc('updated_at')).all()

        elif kwargs["filter"] == "me":
            # Personal feed
            activities = trans_query.filter(
                (Transaction.fromid == kwargs["uid"])   |
                (Transaction.toid == kwargs["uid"])
            ).filter(
                Transaction.status != "pending").order_by(desc('updated_at')).limit(30).all()

            # Pre-pend confirmation related notifications

            friend_requests = Friendship.query.filter(
                (Friendship.uid2 == int(kwargs["uid"])),
                Friendship.status == 0
                ).all()

            for fr in friend_requests:
                fromid = fr.uid1
                toid = fr.uid2
                u = User.query.filter(User.id == fromid).first()

                data.append({
                    "id":       fr.id,
                    "fromID":   fromid,
                    "fromName": get_name_by_id(fromid),
                    "toID":     toid,
                    "toName":   get_name_by_id(toid),
                    "status":   "",
                    "timestamp": fr.updated_at.strftime('%s'),
                    "type_en":  "friend_request",
                    "note":     "",
                    "image":    u.image,
                    "likes":    [],
                    "comments": [],
                    "groupTrans": False,
                    "groupName":  "",
                    "groupID":    ""
                })


        elif kwargs["filter"] == "friends":
            # Connection/Friends feed
            # Join friends table with transactions table
            # TODO: make algorithm better
            uid = int(kwargs["uid"])

            myFriendship = Friendship.query.filter(
                (Friendship.uid1 == uid)  |
                (Friendship.uid2 == uid)).all()
            friends = []
            for m in myFriendship:
                if m.uid1 != uid and m.uid1 not in friends:
                    friends.append(m.uid1)
                elif m.uid2 != uid and m.uid2 not in friends:
                    friends.append(m.uid2)

            activities = trans_query.filter(
                    (Transaction.fromid.in_(friends)) |
                    (Transaction.toid.in_(friends))).filter(
                        Transaction.type_en != "withdraw",
                        Transaction.status == "completed"
                    ).limit(30).all()
        else:
            # Public feed (everyone has the same)
            activities = trans_query.filter(
                Transaction.status == 'completed',
                Transaction.type_en != 'withdraw'
            ).order_by(desc('updated_at')).limit(30).all()
    else:
        # Don't know what to do with this scenario, maybe for admins?
        activities = trans_query.order_by(desc('updated_at')).limit(30).all()

    # TODO:
    # if we need to query each user here, we might as well remove
    # all user related from transaction data model
    # activity_user_table = session.query(Transaction, User).filter(
    #     (Transaction.fromid == User.id) |
    #     (Transaction.toid == User.id)).order_by(desc('transaction.updated_at')).limit(10).all()
    for a in activities:
        if (a.type_en == "payment"):
            u = User.query.filter(User.id == a.fromid).first()
        else:
            u = User.query.filter(User.id == a.toid).first()

        trans = {
            "id": a.id,
            "fromID": a.fromid,
            "fromName": a.fromName,
            "toID": a.toid,
            "toName": a.toName,
            "status": a.status,
            "timestamp": a.updated_at.strftime('%s'),
            "type_en": a.type_en,
            "note": a.note,
            "image": u.image,
            "likes": a.get_likes(),
            "comments": a.get_commenters(),
            "groupTrans": True if a.groupid else False,
            "groupName": a.get_group_name(),
            "groupID": a.groupid
        }

        # ONLY return amount for non-public transactions
        if "filter" in kwargs:
            if kwargs["filter"] != "public" and kwargs["filter"] != "friends":
                trans["amount"] = a.amount

        data.append(trans)


    return simplejson.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/activities/<path:filter>/u/<path:uid>')
def showActivitiesWithFilter(filter, uid):
    return returnActivities(filter=filter, uid=uid)


@app.route('/activities')
def showActivities():
    return returnActivities(filter="public")


@app.route('/activities/<path:trans_id>')
def get_activity(trans_id):
    a = Transaction.query.filter(Transaction.id == trans_id).first()
    if not a:
        return json.dumps({"success": False}), 404, {'contentType': 'Application/JSON'}

    if (a.type_en == "payment"):
        u = User.query.filter(User.id == a.fromid).first()
    else:
        u = User.query.filter(User.id == a.toid).first()

    data = {
        "id": a.id,
        "fromID": a.fromid,
        "fromName": a.fromName,
        "toID": a.toid,
        "toName": a.toName,
        "status": a.status,
        "timestamp": a.updated_at.strftime('%s'),
        "type_en": a.type_en,
        "note": a.note,
        "image": u.image,
        "likes": a.get_likes(),
        "comments": a.get_commenters()
    }

    if 'user_id' in request.args:
        uid = int(request.args['user_id'])
        if uid == a.fromid or uid == a.toid:
            data['amount'] = a.amount

    return simplejson.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/users')
def showUsers():
    data = []
    if 'query' in request.args:
        query_arg = request.args['query']
        _query_arg = request.args['query'].split(' ')
        if len(_query_arg) > 1:
            fname = _query_arg[0]
            lname = _query_arg[-1]
            users = User.query.filter(
                User.firstName.ilike("%" + fname + "%"),
                User.lastName.ilike("%" + lname + "%")
                ).all()
        else:
            # If only one arg, reassign
            _query_arg = query_arg
            # TODO:
            # Make _query_arg = "%" + query_arg + "%" ?
            users = User.query.filter(
                User.firstName.ilike("%" + _query_arg + "%")  |
                User.lastName.ilike("%" + _query_arg + "%")   |
                User.email.ilike("%" + _query_arg + "%")      |
                User.username.ilike("%" + _query_arg + "%")
                ).all()
            # TODO: only searchable for a particular user?
            # Don't show group results when users are trying to create
            # groups

        if 'nogroup' not in request.args:
            # TODO: Show only the groups that users are part of
            if 'user_id' in request.args:
                uid = int(request.args['user_id'])
                groups = Group.query.filter(
                    Group.name.ilike("%" + query_arg + "%"),
                    Group.status != 0).all()
                for g in groups:
                    if g.has_member(uid) or g.uid == uid:
                        data.append({
                            "firstName": g.name,
                            "id": g.id,
                            "group": True,
                            "image": g.image
                            })

        # Append user data to return dataset
        for u in users:
            data.append({
                "firstName": u.firstName,
                "lastName": u.lastName,
                "id": u.id,
                "image": u.image,
                "username": u.username
                })

    elif 'ids' in request.args:
        ids = json.loads(request.args['ids'])
        for _id in ids:
            u = User.query.filter(User.id == int(_id)).first()
            if not u:
                continue
            data.append({
                "firstName": u.firstName,
                "lastName": u.lastName,
                "id": _id,
                "image": u.image,
                "username": u.username
                })

    return json.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/u/<int:uid>/recipients/recent')
def show_recent_users(uid):
    trans = Transaction.query.filter(
        (Transaction.fromid == uid) |
        (Transaction.toid == uid)).order_by(
        Transaction.created_at.desc()).limit(20).all()
    recipients = []
    for t in trans:
        if t.fromid == uid and t.toid not in recipients:
            recipients.append(t.toid)
        elif t.toid == uid and t.fromid not in recipients:
            recipients.append(t.fromid)
    out_data = []
    for r in recipients:
        out_data.append(json.loads(showUser(r)[0]))

    return json.dumps(out_data), 200, {'contentType': 'Application/JSON'}


@app.route('/user/<path:uid>')
def showUser(uid):
    user = User.query.filter(User.id == uid).first()
    try:
        data = {
            "firstName": user.firstName,
            "lastName": user.lastName,
            "id": user.id,
            "image": user.image,
            "email": user.email,
            "phoneNum": user.phoneNum,
            "friendsCount": user.get_friends_count(),
            "username": user.username
        }
        if 'verifyFriends' in request.args:
            fid = int(request.args['verifyFriends'])
            friendship = Friendship.query.filter(
                (Friendship.uid1 == uid) & (Friendship.uid2 == fid) |
                (Friendship.uid1 == fid) & (Friendship.uid2 == uid),
                Friendship.status == 1
                ).first()
            if friendship:
                data["alreadyFriends"] = True
        return json.dumps(data), 200, {'contentType': 'Application/JSON'}
    except:
        return json.dumps({
            "error": "We are unable to get data for this user"
            }), 404, {'contentType': 'Application/JSON'}


@app.route('/banks')
def showBanks():
    data = []
    banks = Bank.query.all()
    for bank in banks:
        data.append({
            "bankName": bank.name,
            "bankID": bank.id
        })

    return json.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/u/<path:uid>/accounts/new', methods=['POST', 'OPTIONS'])
def addAccount(uid):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    new_bank_account = BankAccount()
    new_bank_account.uid = int(uid)
    new_bank_account.bank_id = int(data['bankID'])
    new_bank_account.account = data['account']
    new_bank_account.password= bcrypt.generate_password_hash(data['password'])

    try:
        new_bank_account.save()
        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error('Unable to save account info num: %s' % uid)
        return json.dumps({}), 500, {'contentType': 'Application/JSON'}


@app.route('/u/<path:uid>/creditcards/new', methods=['POST', 'OPTIONS'])
def add_credit_card(uid):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    new_card = CreditCard()

    try:
        number = Bcrypt.generate_password_hash(bcrypt, data['number'])
        four_d = data['number'][-4:]
        c_code = Bcrypt.generate_password_hash(bcrypt, data['code'])
        exp_date = Bcrypt.generate_password_hash(bcrypt, data['exp_date'])
        h_name = Bcrypt.generate_password_hash(bcrypt, data['holder_name'])
        vendor = data['vendor']

        new_card.add_card(int(uid), number, four_d, exp_date, h_name, c_code, vendor)
        new_card.save()

        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error('Unable to save credit card info num: %s' % uid)
        return json.dumps({}), 500, {'contentType': 'Application/JSON'}


@app.route('/u/<path:uid>/creditcards')
def get_credit_cards(uid):
    cards = CreditCard.query.filter(CreditCard.uid == int(uid)).order_by(
        desc(CreditCard.created_at)).all()
    data = []
    for card in cards:
        data.append({
            'id': card.id,
            'vendor': card.vendor,
            'four_digits': card.four_digits,
            'isDefault': card.is_default
        })

    return json.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/u/<path:uid>/accounts/all')
def get_accounts_and_cards(uid):
    """
    Return all accounts and cards
    """
    data = []

    bank_accounts = BankAccount.query.filter(BankAccount.uid == uid).order_by(
        desc(BankAccount.created_at)).all()
    cards = CreditCard.query.filter(CreditCard.uid == int(uid)).order_by(
        desc(CreditCard.created_at)).all()

    for card in cards:
        data.append({
            'id': card.id,
            'vendor': card.vendor,
            'four_digits': card.four_digits,
            'isDefault': card.is_default
        })

    for account in bank_accounts:
        data.append({
            'id': account.id,
            'bankName': account.get_name(),
            'accountName': account.account,
            'isDefault': account.is_default
        })

    return json.dumps(data), 200, {'contentType': 'Application/JSON'}


def get_default_payment_method(uid):
    default_bank = BankAccount.query.filter(BankAccount.uid == uid,
                                            BankAccount.is_default == True).first()
    default_card = CreditCard.query.filter(CreditCard.uid == uid,
                                           CreditCard.is_default == True).first()
    return default_bank or default_card


@app.route('/u/<path:uid>/makedefault/creditcards/<path:c_id>', methods=['POST', 'OPTIONS'])
def make_card_default(uid, c_id):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    card = CreditCard.query.filter(CreditCard.uid == uid,
                                   CreditCard.id == c_id).first()
    try:
        card.make_default()
        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error("User %s unable to make card default. %s" % (str(uid), str(c_id)))


@app.route('/u/<path:uid>/delete/creditcards/<path:c_id>', methods=['POST', 'OPTIONS'])
def delete_card(uid, c_id):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    card = CreditCard.query.filter(CreditCard.uid == uid,
                                   CreditCard.id == c_id).first()
    try:
        card.delete()
        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error("User %s unable to delete credit card. %s" % (str(uid), str(c_id)))


@app.route('/u/<path:uid>/accounts')
def getAccounts(uid):
    bank_accounts = BankAccount.query.filter(BankAccount.uid == uid).order_by(
        desc(BankAccount.created_at)).all()
    data = []
    for account in bank_accounts:
        data.append({
            'id': account.id,
            'bankName': account.get_name(),
            'accountName': account.account,
            'isDefault': account.is_default
        })

    return json.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/u/<path:uid>/makedefault/accounts/<path:a_id>', methods=['POST', 'OPTIONS'])
def make_account_default(uid, a_id):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    account = BankAccount.query.filter(BankAccount.uid == uid,
                                       BankAccount.id == a_id).first()
    try:
        account.make_default()
        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error("User %s unable to make account default. %s" % (str(uid), str(a_id)))


@app.route('/u/<path:uid>/delete/accounts/<path:a_id>', methods=['POST', 'OPTIONS'])
def delete_account(uid, a_id):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    account = BankAccount.query.filter(BankAccount.uid == uid,
                                       BankAccount.id == a_id).first()
    try:
        account.delete()
        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error("User %s unable to delete account. %s" % (str(uid), str(a_id)))


@app.route('/u/<path:uid>/account/<path:accountid>', methods=['PUT', 'OPTIONS'])
def updateAccount(uid, accountid):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)
    account = BankAccount.query.filter(
        BankAccount.uid == uid,
        BankAccount.id == accountid
    ).first()
    if not account:
        return json.dumps({}), 404, {'contentType': 'Application/JSON'}
    else:
        for key, val in data.items():
            # TODO: consider password hashing here
            # Or maybe password should not be handled here
            if data[key] != account.__getattribute__(key):
                account.__setattr__(key, data[key])
                try:
                    account.save()
                    return json.dumps({}), 200, {'contentType': 'Application/JSON'}
                except:
                    session.rollback()
                    logger.error('Unable to save bank account info num: %s' % accountid)
                    return json.dumps({}), 500, {'contentType': 'Application/JSON'}


@app.route('/u/<path:uid>/balance/withdraw', methods=['POST', 'OPTIONS'])
def withdrawBalance(uid):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    new_payment = Transaction()
    new_payment.fromid = uid
    new_payment.toid = uid
    bankid = int(data["toBankID"])
    new_payment.amount = data['amount']
    new_payment.type_en = 'withdraw'

    try:
        user_account = Account.query.filter(Account.uid == int(uid)).one()
        asso_bank_account = BankAccount.query.filter(BankAccount.id == bankid).one()
        if asso_bank_account:
            if user_account.subtract_balance(new_payment.amount):
                if asso_bank_account.add_balance(new_payment.amount):
                    # TODO: depending on the bank transfer period, this may not
                    # easily be completed immediately
                    new_payment.status = "completed"
                    new_payment.save()
                else:
                    # NOTE:
                    # If we are unable to transfer amount to user's bank,
                    # we add back that amount as credits
                    user_account.add_balance(new_payment.amount)
                    logger.error("Unable to transfer amount %s to user %s bank" % (str(new_payment.amount), str(uid)))
                    raise
            else:
                logger.error("Unable to subtract amount %s from user %s account" % (str(new_payment.amount), str(uid)))
                raise

        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error('Unable to withdraw money for user %s with bank account: %s' % (uid, data['toBankID']))
        return json.dumps({}), 500, {'contentType': 'Application/JSON'}


@app.route('/u/<path:uid>/phone/verify/<path:phone_code>')
def verify_phone(uid, phone_code):
    user = User.query.filter(User.id == int(uid)).first()
    if not user:
        return json.dumps({}), 404, {'contentType': 'Application/JSON'}

    if int(phone_code) == user.phone_veri_code or int(phone_code) == PHONE_VERIFY_CODE:
        return json.dumps({"success": True}), 200, {'contentType': 'Application/JSON'}
    else:
        return json.dumps({}), 404, {'contentType': 'Application/JSON'}


"""
Social functions
Possibly moved to: social.py
"""


@app.route('/friendship/new', methods=['POST', 'OPTIONS'])
def create_new_friendship():
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)
    # data should have uid1, uid2 in it
    friendship = Friendship()
    friendship.uid1 = int(data["uid1"])
    friendship.uid2 = int(data["uid2"])
    # TODO:
    # Friendship needs to be approved.

    try:
        friendship.save()
        logger.info("Friendship between %s and %s is saved" % (str(friendship.uid1), str(friendship.uid2)))
        return json.dumps({"success": True}), 200, {'contentType': 'Application/JSON'}
    except:
        logger.error("Friendship between %s and %s cannot saved" % (str(friendship.uid1), str(friendship.uid2)))
        session.rollback()
        return json.dumps({"error": "Your friend request cannot be processed"}), 200, {'contentType': 'Application/JSON'}


@app.route('/friendship/confirm/u1/<int:uid1>/u2/<int:uid2>', methods=['POST', 'OPTIONS'])
def confirm_friendship(uid1, uid2):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    friendship = Friendship.query.filter(Friendship.uid1 == uid1,
        Friendship.uid2 == uid2).all()
    if not friendship:
        return json.dumps({"success": False, "error": "NoFriendshipFound"})
    else:
        try:
            for fr in friendship:
                if fr.status == 1:
                    continue
                else:
                    fr.mark_confirmed()
            return json.dumps({"success": True})
        except:
            logger.error("Unable to confirm friendship between user %d and user %d" % (uid1, uid2))
            session.rollback()
            return json.dumps({"success": False, "error": "friendshipConfirmFailed"}), 500, {'contentType': 'Application/JSON'}


@app.route('/friendship/reject/u1/<int:uid1>/u2/<int:uid2>', methods=['POST', 'OPTIONS'])
def reject_friendship(uid1, uid2):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    friendship = Friendship.query.filter(Friendship.uid1 == uid1,
        Friendship.uid2 == uid2).all()
    if not friendship:
        return json.dumps({"success": False, "error": "NoFriendshipFound"})
    else:
        try:
            for fr in friendship:
                if fr.status == -1:
                    continue
                else:
                    fr.mark_rejected()
            return json.dumps({"success": True})
        except:
            logger.error("Unable to reject friendship between user %d and user %d" % (uid1, uid2))
            session.rollback()
            return json.dumps({"success": False, "error": "friendshipRejectFailed"}), 500, {'contentType': 'Application/JSON'}


@app.route('/friendship/verify', methods=['POST', 'OPTIONS'])
def verify_friendship():
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)
    friendship = Friendship.query.filter(
            (Friendship.uid1 == data["uid1"]) & (Friendship.uid2 == data["uid2"]) |
            (Friendship.uid1 == data["uid2"]) & (Friendship.uid2 == data["uid1"]),
            Friendship.status == 1
        ).first()
    if friendship:
        return json.dumps({"friends": True}), 200, {'contentType': 'Application/JSON'}
    else:
        return json.dumps({"friends": False}), 200, {'contentType': 'Application/JSON'}


@app.route('/social/<path:uid>/like/<path:trans_id>', methods=["POST", "PUT", "OPTIONS"])
def like_transaction(uid, trans_id):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    new_like = Likes()
    new_like.uid = int(uid)
    new_like.trans_id = int(trans_id)

    try:
        already_liked = Likes.query.filter(
            Likes.uid == new_like.uid,
            Likes.trans_id == new_like.trans_id
        ).first()

        if not already_liked:
            new_like.save()
            print "[Debug] Liked"
            print "---------;"
            logger.info("User %s liked transaction %s " % (str(uid), str(trans_id)))
        else:
            '''
            if already liked, then remove the "like" relationship
            to perform an "unlike" action
            '''
            logger.info("User %s unliked transaction %s " % (str(uid), str(trans_id)))
            already_liked.delete()
            print "[Debug] Unliked"
            print "---------;"
        return json.dumps({"success": True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error("An unexpected error occured when user %s tried to like transaction %s " % (str(uid), str(trans_id)))
        return json.dumps({"success": False, "error": MESSAGES["cannot_process"]}), 500, {'contentType': 'Application/JSON'}


@app.route('/social/<path:uid>/comment/<path:trans_id>', methods=["POST", "PUT", "OPTIONS"])
def comment_transaction(uid, trans_id):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    data = json.loads(request.data)

    new_comment = Comments()
    new_comment.uid = uid
    new_comment.trans_id = trans_id
    new_comment.text = data["comment"]

    try:
        # There is no deletion of comments, user can continue
        # commenting on the same transaction
        new_comment.save()
        logger.info("User %s commented on transaction %s " % (str(uid), str(trans_id)))
        print "[Debug] Comment from %s on %s " % (uid, trans_id)
        return json.dumps({"success": True}), 200, {'contentType': 'Application/JSON'}

    except:
        session.rollback()
        logger.error("An unexpected error occured when user %s tried to comment on transaction %s " % (str(uid), str(trans_id)))
        return json.dumps({"success": False, "error": MESSAGES["cannot_process"]}), 500, {'contentType': 'Application/JSON'}


@app.route('/social/comments/<path:trans_id>')
def get_comments(trans_id):
    # Create a joined table using comment and user
    # so that we can get comment text, and user name, image
    a = Transaction.query.filter(Transaction.id == trans_id).first()

    if not a:
        return json.dumps({}), 404, {'contentType': 'Application/JSON'}

    try:
        comments = a.get_comments()

        return json.dumps(comments), 200, {'contentType': 'Application/JSON'}
    except:
        logger.error("Unable to fetch comments for transaction %s" % str(trans_id))
        return json.dumps({}), 500, {'contentType': 'Application/JSON'}


@app.route('/u/<int:uid>/social/groups/create', methods=['POST', 'OPTIONS'])
def create_social_group(uid):
    if request.method == 'OPTIONS':
        return json.dumps({"sucess": True}), 200, {'contentType': 'Application/JSON'}

    user = User.query.filter(User.id == uid).first()
    if not user:
        return json.dumps({}), 404, {'contentType': 'Application/JSON'}

    # example:
    # data = {
    #   "groupName": "a_joyful_group",
    #   "members": [1, 3, 4, 5, 9]
    # }
    data = json.loads(request.data)
    new_group = Group()

    try:
        if not new_group.create_group(uid, data['groupName']):
            return json.dumps({"error": "groupCreationFail"}), 500, {'contentType': 'Application/JSON'}
        try:
            for i in data['members']:
                new_group.add_member(i)
            logger.info("Successfully added members to group %d" % new_group.id)
        except:
            logger.error("Unable to add members for group %d" % new_group.id)
    except:
        logger.error("Unable to create new group by user %d" % uid)
        json.dumps({'error': 'errorCreateGroup'}), 500, {'contentType': 'Application/JSON'}

    return json.dumps({"success": True, "id": new_group.id}), 200, {'contentType': 'Application/JSON'}


@app.route('/u/<int:uid>/social/groups')
def get_social_groups(uid):
    groupsOwn = Group.query.filter(Group.uid == uid, Group.status != 0).all()
    mem_groups_all = MemberShip.query.filter(MemberShip.uid == uid).all()
    groups = [Group.query.filter(Group.id == m.gid, Group.status != 0).first() for m in mem_groups_all]

    data = []
    for g in groups:
        if g:
            data.append({
                "id": g.id,
                "name": g.name,
                "owner": g.uid == uid,
                "image": g.image,
                "created": g.created_at.strftime('%s')
                })

    # TODO: This definitely needs better work
    for g in groupsOwn:
        if g and g not in groups:
            data.append({
                "id": g.id,
                "name": g.name,
                "owner": g.uid == uid,
                "image": g.image,
                "created": g.created_at.strftime('%s')
            })

    return json.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/u/<int:uid>/social/groups/<int:gid>')
def get_group_members(uid, gid):
    group = Group.query.filter(Group.id == gid, Group.status != 0).first()
    # Verify ownership of this group
    if 'verify' in request.args:
        if group.uid != uid:
            return json.dumps({'error': 'notAuthorized'}), 404, {'contentType': 'Application/JSON'}

    if not group:
        return json.dumps([]), 200, {'contentType': 'Application/JSON'}
    group_members = group.get_members()
    data = {"name": group.name, "id": group.id, "members":[], "image": group.image, "count": len(group_members), "owner": group.uid == uid}
    for m in group_members:
        data["members"].append({
            "uid": m.id,
            "firstName": m.firstName,
            "lastName": m.lastName,
            "imageUrl": m.image
        })
    return json.dumps(data), 200, {'contentType': 'Application/JSON'}


@app.route('/u/<int:uid>/social/groups/<int:gid>', methods=['OPTIONS', 'POST', 'PUT'])
def edit_group(uid, gid):
    group = Group.query.filter(Group.id == gid, Group.status != 0, Group.uid == uid).first()
    if not group:
        return json.dumps([]), 200, {'contentType': 'Application/JSON'}
    new_data = json.loads(request.data)
    try:
        group.name = new_data['groupName']
        group.save()

        for mem in new_data['members']:
            mid = int(mem)
            if not group.has_member(mid):
                group.add_member(mid)

    except:
        logger.error('Unable to edit group, id: %d' % gid)
        session.rollback()
    return json.dumps({'success': True, 'id': gid})


@app.route('/u/<int:uid>/social/groups/<int:gid>', methods=['DELETE', 'OPTIONS'])
def deactivate_group(uid, gid):
    group = Group.query.filter(Group.id == gid).first()
    if request.method == 'OPTIONS':
        return True
    if not group:
        return json.dumps([]), 200, {'contentType': 'Application/JSON'}
    try:
        group.deactivate()
        group.name += ' (deactivated)'
        group.save()
        logger.info("Group deactivated, id %d" % gid)
        return json.dumps({'success': True}), 200, {'contentType': 'Application/JSON'}
    except:
        session.rollback()
        logger.error("Unable to deactivate group %d" % gid)
        return json.dumps({'error': 'failDeleteGroup'}), 500, {'contentType': 'Application/JSON'}


@app.route('/u/<int:uid>/social/groups/out/<int:gid>', methods=['POST', 'PUT', 'OPTIONS'])
def leave_group(uid, gid):
    group = Group.query.filter(Group.id == gid).first()
    if request.method == 'OPTIONS':
        return True
    if not group:
        return json.dumps([]), 200, {'contentType': 'Application/JSON'}

    if group.remove_member(uid):
        return json.dumps({'success': True})
    else:
        return json.dumps({'error': 'cantRemoveMember'}), 500, {'contentType': 'Application/JSON'}


@app.route('/u/<int:uid>/notifications')
def get_notifications(uid):
    user = User.query.filter(User.id == uid).first()

    if not user:
       return json.dumps({'error': 'userNotFound'}), 404, {'contentType': 'Application/JSON'}

    # Pending transactions
    # Pending friend requests
    pending_trans_count = Transaction.query.filter(
        (Transaction.fromid == user.id)  |
        (Transaction.toid == user.id)
        ).filter(Transaction.status == 'pending',
                Transaction.type_en != 'withdraw').count()

    requests_count = Friendship.query.filter(
        Friendship.uid2 == uid,
        Friendship.status == 0
    ).count()

    return json.dumps({
        'pending_count': pending_trans_count,
        'request_count': requests_count
        }), 200, {'contentType': 'Application/JSON'}


if __name__ == '__main__':
    app.run(port=8001, debug=True)