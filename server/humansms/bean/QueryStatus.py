# coding=utf-8

class QueryStatus(object):
    ACCOUNT = ""
    CODE = ""
    DISPATCH = ""
    
    def setAccount(self, account):
        self.ACCOUNT = account
    
    def getAccount(self):
        return self.ACCOUNT
    
    def setCode(self, code):
        self.CODE = code
    
    def getCode(self):
        return self.CODE    
    
    def setDispatch(self, dispach):
        self.DISPATCH = dispach
    
    def getDispatch(self):
        return self.DISPATCH    

        