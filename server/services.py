# coding=utf-8
from humansms.service.SimpleMessageService import *
from random import randint
import logging

from local_settings import local_settings

logging.basicConfig(filename='service_log.txt', level=logging.DEBUG,
                    format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)

def generate_phone_verification_code(phone_num):
    verify_code = randint(1000, 9999)

    send = SimpleMessageService(local_settings['BULK_SMS_ACNT'], local_settings['BULK_SMS_PW'])
    message = "Código: %d" % verify_code
    # message = "Let me know if you get this. - Benjamin"
    Responses = send.sendSimpleMsg(message, phone_num)

    if Responses[0].CODE == "000":
        print "[Info] Message successfully sent"
        logger.info("Verification code for phone %s is successfully sent" % phone_num)
        return verify_code
    else:
        print Responses[0].CODE
        print "[Error] Message failed to be sent"
        print "[Debug] Please use default code for this verification"
        logger.info("Verification code sent failed for phone %s " % phone_num)
        return False

# generate_phone_verification_code('5521981398384')
# generate_phone_verification_code('5511989718778')