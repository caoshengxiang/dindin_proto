# coding=utf-8
from humansms.bean.Message import Message
from humansms.config.mainConfig import MainConfig

class MultipleMessage(Message):
    DISTPACH_MULTIPLE = ""
    TYPE = ""
    TYPE_A = "A"
    TYPE_B = "B"
    TYPE_C = "C"
    TYPE_D = "D"
    TYPE_E = "E"
    LIST = ""
        
    def __init__(self):
        config = MainConfig()
        DISTPACH_MULTIPLE = config.sendMultipleConfig()["dispatch"]
        self.setDispatch(DISTPACH_MULTIPLE)
        self.TYPE = self.TYPE_C
        
    def setType(self, type):
        self.TYPE = type
    
    def getType(self):
        return self.TYPE
    
    def setList(self, list):
        self.LIST = list
        
    def getList(self):
        return self.LIST
    
    def getAsArray(self):
        param = {}
        param["account"] = self.getAccount()
        param["code"] = self.getCode()
        param["dispatch"] = self.getDispatch()
        param["type"] = self.getType()
        if(self.getList() != ""):
            param["list"] = self.getList()
        if(self.getCallBack() != ""):
            param["callbackOption"] = self.getCallBack()
        return param 
        