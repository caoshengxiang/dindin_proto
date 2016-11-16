# coding=utf-8
# Classe responsável por formatar os parametros enviados por http
class HumanHTTPHelper:
    def formatRequest(self, params):
        
        urlEncoded = {
                      "dispatch":params["dispatch"], 
                      "account": params["account"],
                      "code":params["code"],
                      }
        for key,val in params["data"]:
            urlEncoded[key] = val

        return urlEncoded 