# coding=utf-8
from humansms.bean.SimpleMessage import SimpleMessage
from humansms.config.mainConfig import MainConfig
from humansms.service.base.HumanBaseService import HumanBaseService
from humansms.util.HumanConnectionHelper import HumanConnectionHelper

# Classe de envio multiplo, classe filha de HumanBaseService
# responsavel por montar a requisição 
class SimpleMessageService(HumanBaseService):
    # Tipos de Layout de mensagem, consultar o manual

    response = HumanConnectionHelper()
    config = MainConfig()    
    
    def __init__(self, accountPar, codePar):
        # Construtor que seta na classe pai HumanBaseService a conta e o código de acesso
        HumanBaseService.__init__(self, accountPar, codePar)
        

    def sendSimpleMsg(self, msg_txt, to, fromPar="", id="", schedule="", callback=0):
        msg = SimpleMessage()
        msg.setAccount(self.getAccount())
        msg.setCode(self.getCode())
        msg.setMessage(msg_txt)
        msg.setFrom(fromPar)
        msg.setMobile(to)
        msg.setId(id)
        msg.setCallBack(callback)
        msg.setSchedule(schedule)
        
        return self.response.getResponse(self.sendSimple(msg))
    
    def cancelSMS(self, id):
        msg = SimpleMessage()
        msg.setAccount(self.getAccount())
        msg.setCode(self.getCode())
        msg.setDispatch(self.config.cancelConfig()["dispatch"])
        msg.setId(id)
        return self.response.getResponse(self.cancelSimple(msg));        
        
        