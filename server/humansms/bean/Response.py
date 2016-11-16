# coding=utf-8

class Response(object):
    CODE = ""
    DESCRIPTION = ""
    
    def setCode(self, code):
        self.CODE = code
        
    def getCode(self):
        return self.CODE;
    
    def setDescription(self, decription):
        self.DESCRIPTION = decription
    
    def getDescription(self):
        return self.DESCRIPTION
        