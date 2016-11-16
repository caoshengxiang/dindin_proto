# coding=utf-8
from humansms.bean.Message import Message
from humansms.bean.MultipleQuery import MultipleQuery
from humansms.bean.SimpleQuery import SimpleQuery
from humansms.config.mainConfig import MainConfig
from humansms.service.base.HumanBaseService import HumanBaseService
from humansms.util.HumanConnectionHelper import HumanConnectionHelper

# Classe de envio multiplo, classe filha de HumanBaseService
# responsavel por montar a requisi��o 
class QueryService(HumanBaseService):
    
    response = HumanConnectionHelper()
    config = MainConfig()
    
    def __init__(self, accountPar, codePar):
        # Construtor que seta na classe pai HumanBaseService a conta e o código de acesso
        HumanBaseService.__init__(self, accountPar, codePar)

    def querySimpleStatus(self, id):
        
        query = SimpleQuery()
        query.setAccount(self.getAccount())
        query.setCode(self.getCode())
        query.setId(id)
        return self.response.getResponse(self.querySimple(query));
    
    def listReceivedSMS(self):
        msg = Message()
        msg.setAccount(self.getAccount())
        msg.setCode(self.getCode())
        msg.setDispatch(self.config.receivedConfig()["dispatch"])
        return self.response.getResponse(self.cancelSimple(msg));
    
    def queryMultipleStatus(self, idList):
        ids = ';'.join(idList)
        query = MultipleQuery()
        query.setAccount(self.getAccount())
        query.setCode(self.getCode())
        query.setIdList(ids)
        return self.response.getResponse(self.queryMultiple(query));            
            
            