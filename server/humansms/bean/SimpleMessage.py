# coding=utf-8
from humansms.bean.Message import Message
from humansms.config.mainConfig import MainConfig

class SimpleMessage(Message):
    DISTPACH_SIMPLE = ""
    MESSAGE = ""
    FROM = ""
    MOBILE = ""
    ID = ""
    SCHEDULE = ""
    
    def __init__(self):
        config = MainConfig()
        DISTPACH_SIMPLE = config.sendSimpleConfig()["dispatch"]
        self.setDispatch(DISTPACH_SIMPLE)
            
    def setMessage(self, msg):
        self.MESSAGE = msg
    
    def getMessage(self):
        return self.MESSAGE
    
    def setFrom(self, fromPar):
        self.FROM = fromPar
    
    def getFrom(self):
        return self.FROM
    
    def setMobile(self, mobile):
        self.MOBILE = mobile
    
    def getMobile(self):
        return self.MOBILE
    
    def setId(self, id):
        self.ID = id
    
    def getId(self):
        return self.ID
    
    def setSchedule(self, schedule):
        self.SCHEDULE = schedule
    
    def getSchedule(self):
        return self.SCHEDULE
    
    def getAsArray(self):
        param = {}
        param["account"] = self.getAccount()
        param["code"] = self.getCode()
        param["dispatch"] = self.getDispatch()
        
        if(self.getMessage() != ""):
            param["msg"] = self.getMessage()
        if(self.getMobile() != ""):
            param["to"] = self.getMobile()
        if(self.getFrom() != ""):
            param["from"] = self.getFrom()
        if(self.getId() != ""):
            param["id"] = self.getId()
        if(self.getSchedule() != ""):            
            param["schedule"] = self.getSchedule()
        if(self.getSchedule() != ""):            
            param["callback"] = self.getSchedule()
            
        return param
    

    