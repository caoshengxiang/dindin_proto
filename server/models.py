import datetime
import logging
from decimal import Decimal
from app import db

from sqlalchemy import desc

session = db.session

# Override with the "db." prefix, minimum code change?
Base = db.Model
Column = db.Column
String = db.String
Integer = db.Integer
DateTime = db.DateTime
Boolean = db.Boolean
Text = db.Text
ForeignKey = db.ForeignKey
Numeric = db.Numeric


logging.basicConfig(filename='db_log.txt', level=logging.DEBUG,
                    format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)


class CommonFuncMixin(object):
    created_at = Column(DateTime(), default=datetime.datetime.now)
    updated_at = Column(DateTime(), default=datetime.datetime.now)

    def __repr__(self):
        return "<Obj {}>".format(self.id)

    def save(self):
        session.add(self)
        session.commit()
        self.updated_at = datetime.datetime.now()
        return self

    def updated(self):
        self.updated_at = datetime.datetime.now()
        self.save()

    def delete(self):
        session.delete(self)
        session.commit()


class User(CommonFuncMixin, Base):
    __tablename__ = 'site_user'

    id = Column(Integer(), primary_key=True)
    cpf = Column(String(20), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    firstName = Column(String(150), nullable=False)
    lastName = Column(String(150), nullable=False)
    phoneNum = Column(String(20), nullable=False, unique=True)
    image = Column(String(150), default="/static/img/user_default.jpg")
    phone_veri_code = Column(Integer())
    username = Column(String(150), unique=True)

    def __init__(self, firstName, lastName, email, password, phoneNum, cpf):
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.password = password
        self.phoneNum = phoneNum
        self.cpf = cpf

    def update_image(self, new_path):
        # only save relative folder path to the uploads folder
        self.image = new_path
        return self.updated()

    def has_enough_balance(self, amount):
        account = Account.query.filter(Account.uid == self.id).first()
        try:
            if account.balance > amount:
                return True
            else:
                return False
        except:
            session.rollback()
            logger.error("Querying user account balance, uid %d", self.id)

    def update_phone_code(self, code):
        self.phone_veri_code = code
        try:
            self.save()
        except:
            session.rollback()
            logger.error("Unable to update user phone verification code uid: %d", self.id)

    def get_friends_count(self):
        return Friendship.query.filter(
            (Friendship.uid1 == self.id) |
            (Friendship.uid2 == self.id)).count()

    def __repr__(self):
        return "<user {}>".format(self.id)


class Friendship(CommonFuncMixin, Base):
    __tablename__ = 'friendship'

    id = Column(Integer(), primary_key=True)
    uid1 = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    uid2 = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    # status: 0 - not confirmed, 1 - confirmed, -1 - rejected
    status = Column(Integer(), nullable=False, default=0)

    def mark_confirmed(self):
        self.status = 1
        self.save()
        return self

    def mark_rejected(self):
        self.status = -1
        self.save()
        return self


class Account(CommonFuncMixin, Base):
    __tablename__ = 'account'

    id = Column(Integer(), primary_key=True)
    uid = Column(Integer(), ForeignKey('site_user.id'))
    balance = Column(Numeric(12, 2), default=0.00, nullable=False)

    def __init__(self, uid):
        self.uid = uid

        self.save()

    def add_balance(self, amount):
        self.balance += Decimal(amount)
        try:
            self.save()
            return True
        except:
            session.rollback()
            logger.error('Balance cannot be added to user ' + str(self.uid))
            return False

    def subtract_balance(self, amount):
        if self.balance > Decimal(amount):
            self.balance -= Decimal(amount)
        else:
            return False
        try:
            self.save()
            return True
        except:
            session.rollback()
            logger.error('Balance cannot be subtracted from user ' + str(self.uid))
            return False


class Transaction(CommonFuncMixin, Base):
    __tablename__ = 'transaction'

    id = Column(Integer(), primary_key=True)
    fromid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    fromName = Column(String(150))
    toid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    toName = Column(String(150))
    amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    note = Column(String(500))
    type_en = Column(String(20))
    status = Column(String(20), nullable=False, default='pending')
    groupid = Column(Integer(), ForeignKey('group.id'))
    # use this field to add a note to admin
    # i.e. Use doesn't have enough balance and this transaction is completed
    # with default bank/credit card account
    note_to_admin = Column(Text())

    def getNames(self):
        fromU = User.query.filter(User.id == self.fromid).one()
        toU = User.query.filter(User.id == self.toid).one()

        self.fromName = fromU.firstName + ' ' + fromU.lastName
        self.toName = toU.firstName + ' ' + toU.lastName

        return self

    def execute(self):
        # TODO:
        # Add a flag, make sure rejected transactions will never be able
        # to be executed any more
        if self.status == 'rejected':
            return False

        # TODO: add a flag so that no transactions will be
        # processed without permission
        # And no previous transactions can be reprocessed

        if self.type_en == 'withdraw':
            from_account = Account.query.filter(Account.uid == self.fromid).one()
            to_account = BankAccount.query.filter(BankAccount.id == self.toid).one()

        else:
            from_account = Account.query.filter(Account.uid == self.fromid).one()
            to_account = Account.query.filter(Account.uid == self.toid).one()

        # TODO:
        # At the moment, we distinguish transaction and reload with
        # whether or not fromid == toid
        # But will need to change that in the future

        if from_account.subtract_balance(self.amount):
            to_account.add_balance(self.amount)
        else:
            logger.error('Unable to perform transaction from account: %d to account: ' % (from_account.id, self.toid) )
            return False

        try:
            from_account.save()
            logger.info('Account 1 successfully updated by amount %s' % self.amount)
            try:
                to_account.save()
                # TODO:
                # ONlY save a transaction if it is complete
                self.getNames()
                self.save()
                self.mark_complete()
                logger.info('Account 2 successfully updated, new balance %s' % to_account.balance)
            except:
                logger.info('Account 2 unable to be updated')
                return False
        except:
            logger.error('Account 1 unable to be updated')
            return False

        return self

    def mark_complete(self):
        self.status = 'completed'
        self.save()

        return self

    def mark_rejected(self):
        self.status = 'rejected'
        self.save()

        return self

    def get_likes(self):
        likes_trans_id = Likes.query.filter(Likes.trans_id == self.id).all()
        user_ids = [like.uid for like in likes_trans_id]

        return user_ids

    def get_comments(self):
        comments_users = session.query(Comments, User).filter(
            Comments.uid == User.id,
            Comments.trans_id == self.id).order_by(desc(Comments.created_at)).all()

        comments = [{
                "comment": comment[0].text,
                "fullName": comment[1].firstName + comment[1].lastName[0],
                "image": comment[1].image
            } for comment in comments_users]

        return comments

    def get_commenters(self):
        comments = Comments.query.filter(Comments.trans_id == self.id).all()
        user_ids = [comment.uid for comment in comments]

        return user_ids

    def get_group_name(self):
        if not self.groupid:
            return ""

        group = Group.query.filter(Group.id == self.groupid).first()
        if group:
            return group.name
        else:
            return ""

# Payment is not needed any more
# class Payment(CommonFuncMixin, Base):
#     __tablename__ = 'payment'

#     id = Column(Integer(), primary_key=True)
#     # TODO: need to query balance from the gateway API
#     from_account_id = Column(Integer(), ForeignKey('bank_account.id'), nullable=False)
#     toid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
#     amount = Column(Numeric(10, 2), nullable=False, default=0.00)

#     def __init__(self, from_account_id, toid, amount):
#         self.from_account_id = from_account_id
#         self.toid = toid
#         self.amount = amount

#     def execute(self):
#         # TODO: Make sure checking the balance to see if user has enought
#         # money in bank to pay
#         try:
#             user_account = Account.query.filter(Account.uid == self.toid).one()
#             user_account.balance += self.amount

#             self.save()
#             logger.info('Successfully loaded amount %s for user %s' % (str(self.amount), str(self.toid)) )
#             return self

#         except:
#             session.rollback()
#             return logger.error('Account 1 unable to be updated' )


class Bank(CommonFuncMixin, Base):
    __tablename__ = 'bank'

    id = Column(Integer(), primary_key=True)
    name = Column(String(150), nullable=False)
    # set connection to gateways from here?


class BankAccount(CommonFuncMixin, Base):
    __tablename__ = 'bank_account'

    id = Column(Integer(), primary_key=True)
    uid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    # TODO: needs hashed
    bank_id = Column(Integer(), ForeignKey('bank.id'), nullable=False)
    account = Column(String(150), nullable=False)
    password = Column(String(150), nullable=False)
    is_default = Column(Boolean(), nullable=False, default=False)

    def make_default(self):
        if self.is_default:
            return self
        else:
            u_bank_accounts = BankAccount.query.filter(BankAccount.uid == self.uid).all()
            u_credit_cards = CreditCard.query.filter(CreditCard.uid == self.uid).all()

            for account in u_bank_accounts:
                account.is_default = False
                account.save()
            for card in u_credit_cards:
                card.is_default = False
                card.save()

            self.is_default = True
            self.save()
        return self

    def get_name(self):
        bank = Bank.query.filter(Bank.id == self.bank_id).one()

        return bank.name

    def subtract_balance(self, amount):
        # TODO:
        # Assume unlimited balance in your bank
        # self.balance -= amount;
        # try:
        #     self.save()
        #     return True
        # except:
        #     session.rollback()
        #     logger.error('Balance cannot be added to user ' + str(self.uid))
        #     return False
        return True

    def add_balance(self, amount):
        """
        TODO: Need to use third party api to transfer money to bank
        """
        return True


    def has_enough_balance(self, amount):
        # TODO: Use real api call for this
        if amount > 8000:
            return False
        else:
            return True


class CreditCard(CommonFuncMixin, Base):
    __tablename__ = 'credit_card'
    """
    Note:
    All these data must be hashed except vendor and last 4 digits
    """

    id = Column(Integer(), primary_key=True)
    uid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    # Hashed
    number = Column(String(150), nullable=False)
    exp_date = Column(String(150), nullable=False)
    code = Column(String(150), nullable=False)
    # Unhashed
    name = Column(String(150), nullable=False)
    four_digits = Column(String(30), nullable=False)
    vendor = Column(String(150), nullable=False)
    is_default = Column(Boolean(), nullable=False, default=False)

    def add_card(self, uid, num, four_d, exp, name, code, vendor):
        # Assuming num, exp, name, code are all properly encrypted
        self.number = num
        self.exp_date = exp
        self.code = code
        self.name = name
        self.uid = uid
        self.four_digits = four_d
        self.vendor = vendor

    def validate_credit_card(self):
        """
        TOOD:
            Add this function, may need to use third party tools
            The idea is to validate credit cards when user first add them
        """
        return True

    def make_default(self):
        if self.is_default:
            return self
        else:
            u_bank_accounts = BankAccount.query.filter(BankAccount.uid == self.uid).all()
            u_credit_cards = CreditCard.query.filter(CreditCard.uid == self.uid).all()

            for account in u_bank_accounts:
                account.is_default = False
                account.save()
            for card in u_credit_cards:
                card.is_default = False
                card.save()

            self.is_default = True
            self.save()
        return self

    def subtract_balance(self, amount):
        # TODO:
        # This will always set up directly transfer from
        # user's bank account to DIndin's.
        # Assume unlimited balance in your bank
        # self.balance -= amount;
        # try:
        #     self.save()
        #     return True
        # except:
        #     session.rollback()
        #     logger.error('Balance cannot be added to user ' + str(self.uid))
        #     return False
        return True

    def has_enough_balance(self, amount):
        if amount > 8000:
            return False
        else:
            return True


class Likes(CommonFuncMixin, Base):
    __tablename__ = 'likes'

    id = Column(Integer(), primary_key=True)
    uid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    trans_id = Column(Integer(), ForeignKey('transaction.id'), nullable=False)


class Comments(CommonFuncMixin, Base):
    __tablename__ = 'comments'

    id = Column(Integer(), primary_key=True)
    uid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    trans_id = Column(Integer(), ForeignKey('transaction.id'), nullable=False)
    text = Column(Text())


class Group(CommonFuncMixin, Base):
    __tablename__ = 'group'

    id = Column(Integer(), primary_key=True)
    # Creator of the group
    name = Column(String(150), nullable=False, unique=True)
    uid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)
    image = Column(String(255))
    # if status is: 0 (meaning inactive), then it should not
    # be able to display or operate on
    # Code: 1: active; 0; inactive
    status = Column(Integer(), nullable=False, default=1)

    def create_group(self, uid, name):
        try:
            self.uid = uid
            self.name = name
            self.save()
            logger.info("Group successfully created by user %d" % (uid))
            return True
        except:
            session.rollback()
            logger.error("Group failed to be created by user %d" % (uid))
            return False

    def add_member(self, uid):
        try:
            uid = int(uid)
            new_membership = MemberShip()
            new_membership.gid = self.id
            new_membership.uid = uid
            new_membership.save()
            logger.info("New member %d added to group %d " % (uid, self.id))
        except:
            session.rollback()
            logger.error("New member %d failed ot be added to group %d " % (uid, self.id))

    def get_members(self):
        try:
            group_members = session.query(User).join(MemberShip).filter(
                MemberShip.gid == self.id,
                User.id == MemberShip.uid).all()
            return group_members
        except:
            session.rollback()
            logger.error("unable to retrieve members for group %d" % self.id)

    def has_member(self, mid):
        return MemberShip.query.filter(MemberShip.uid == mid, MemberShip.gid == self.id).first()

    def get_members_id(self):
        try:
            group_members = session.query(User).join(MemberShip).filter(
                MemberShip.gid == self.id,
                User.id == MemberShip.uid).all()
            return [member.id for member in group_members]
        except:
            session.rollback()
            logger.error("unable to retrieve members for group %d" % self.id)

    def remove_member(self, uid):
        try:
            memship = MemberShip.query.filter(MemberShip.uid == uid, MemberShip.gid == self.id).first()
            if memship:
                memship.delete()
            return True
        except:
            return False

    def deactivate(self):
        self.status = 0
        self.save()

        return self


class MemberShip(CommonFuncMixin, Base):
    __tablename__ = 'membership'

    id = Column(Integer(), primary_key=True)
    gid = Column(Integer(), ForeignKey('group.id'), nullable=False)
    uid = Column(Integer(), ForeignKey('site_user.id'), nullable=False)


# class Notifications(CommonFuncMixin, Base):
#     __tablename__ = 'notifications'

#     id = Column(Integer(), primary_key=True)
#     type_en = Column(String(255), nullable=False)
#     # status: 0 - unread, 1 - read
#     status = Column(Integer(), nullable=False, default=0)
