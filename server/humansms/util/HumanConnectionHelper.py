# coding=utf-8
from humansms.bean.Response import Response
from humansms.util.HumanHTTPHelper import HumanHTTPHelper
import httplib
import urllib

class HumanConnectionHelper:
    
    def getResponse(self, response):

        responses = []
        is_array = lambda var: isinstance(var, (list, tuple))
        
        if (is_array(response) == False):
            response = response.split("\n")
            
            
        for msg in response:
            parceMsg = self.parceResponse(msg)
            objResponse = Response()
            objResponse.setCode(parceMsg[0])
            objResponse.setDescription(parceMsg[2])
            
            if(parceMsg[0] != "") and (parceMsg[1] != ""): 
                responses.append(objResponse)                 
        return responses
        
    def parceResponse(self, response):
        
        response = response.replace("[", "")
        response = response.replace("]", "")
        response = response.replace("\n", "")
        response = response.replace("\r", "")
        response = response.replace(",", "")
        arResponse = response.partition(" - ")
        return arResponse
            
    
    def pathEncode(self, pathToFile):
        pathToFile = pathToFile.replace('\r', '/r')
        pathToFile = pathToFile.replace('\a', '/a')
        pathToFile = pathToFile.replace('\t', '/t')
        pathToFile = pathToFile.replace('\d', '/d')
        pathToFile = pathToFile.replace('\w', '/w')
        pathToFile = pathToFile.replace('\s', '/s')
        pathToFile = pathToFile.replace('\n', '/n')
        pathToFile = pathToFile.replace('\f', '/f')
        pathToFile = pathToFile.replace('\\', '/')
        return pathToFile    
    
    def csvDecode(self, csv):
        csv = csv.replace(",", ";")
        csv = csv.replace("[", "")
        csv = csv.replace("]", "")
        csv = csv.replace(" ", "")
        csv = csv.replace("'", "")
        return csv
    
    def sendRequest(self, params):
        
        help = HumanHTTPHelper()
        
        # Seta o cabeçalho http
        headers = {"Content-type": params["ContentType"], "Accept": params["Accept"]}

        # Abre uma conexão http
        conn = httplib.HTTPConnection(params["host"])
        
        param = urllib.urlencode(params["data"])
        # Envia os dados
        conn.request(params["sendMethod"], params["uri"], param, headers)

        
        # Coleta a resposta do Gateway
        response = conn.getresponse()
        
        data = response.read()
        
        conn.close()
        
        return data