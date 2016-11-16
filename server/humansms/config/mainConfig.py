# coding=utf-8
class MainConfig:
    METHOD_POST = "POST"
    METHOD_GET = "GET"
    PROTOCOL_HTTP = "http"
    PROTOCOL_HTTPS = "https"
    PROTOCOL_FTP = "ftp"

    CHARSET_ISO_8859_1 = "ISO-8859-1"
    CHARSET_UTF_8 = "UTF-8"
    
    def gateWayConfigSend(self):
        conf = {"protocol": MainConfig.PROTOCOL_HTTP,
                "host": "api.zenvia360.com.br",
                "uri": "/GatewayIntegration/msgSms.do",
                "sendMethod": MainConfig.METHOD_POST,
                "ContentType": "application/x-www-form-urlencoded",
                "Accept": "text/plain",
                "charset":  MainConfig.CHARSET_UTF_8,
                "url": MainConfig.PROTOCOL_HTTPS + "://api.zenvia360.com.br/GatewayIntegration/msgSms.do"
                }    
        return conf    
    
    # Método que retorna as configurações do envio multiplo, como url, charset, etc.
    def sendMultipleConfig(self):
        conf = self.gateWayConfigSend()
        conf["dispatch"] = "sendMultiple"
        return conf
    
    def sendSimpleConfig(self):
        conf = self.gateWayConfigSend()
        conf["dispatch"] = "send"
        return conf
    
    def queryMultipleConfig(self):
        conf = self.gateWayConfigSend()        
        conf["dispatch"] = "checkMultiple"
        return conf
    
    def querySimpleConfig(self):
        conf = self.gateWayConfigSend()        
        conf["dispatch"] = "check"
        return conf
        
    def cancelConfig(self):
        conf = self.gateWayConfigSend()        
        conf["dispatch"] = "cancel"
        return conf    
    
    def receivedConfig(self):
        conf = self.gateWayConfigSend()        
        conf["dispatch"] = "listReceived"
        return conf    