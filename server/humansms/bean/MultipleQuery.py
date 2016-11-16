# coding=utf-8
from humansms.bean.QueryStatus import QueryStatus
from humansms.config.mainConfig import MainConfig

class MultipleQuery(QueryStatus):
    DISTPACH_STATUS_MULTIPLE = ""
    ID_LIST = ""

    def __init__(self):
        config = MainConfig()
        DISTPACH_STATUS_MULTIPLE = config.queryMultipleConfig()["dispatch"]
        self.setDispatch(DISTPACH_STATUS_MULTIPLE)
        
    def setIdList(self, idList):
        self.ID_LIST = idList
    
    def getIdList(self):
        return self.ID_LIST

    def getAsArray(self):
        param = {}
        param["account"] = self.getAccount()
        param["code"] = self.getCode()
        param["dispatch"] = self.getDispatch()
        param["idList"] = self.getIdList()
        return param