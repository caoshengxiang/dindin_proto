# coding=utf-8
from humansms.bean.MultipleMessage import MultipleMessage
from humansms.service.base.HumanBaseService import HumanBaseService
from humansms.util.HumanConnectionHelper import HumanConnectionHelper
import csv
 
# Classe de envio multiplo, classe filha de HumanBaseService
# responsavel por montar a requisição 
class MultipleMessageService(HumanBaseService):

    response = HumanConnectionHelper()    
    
    def __init__(self, accountPar, codePar):
        # Construtor que seta na classe pai HumanBaseService a conta e o código de acesso
        HumanBaseService.__init__(self, accountPar, codePar)
        
    # Metodo responsavel por decodificar o arquivo CSV enviado, espera-se o caminho do arquivo
    # que é convertido em string e repassado para o método sendMultipleList   
    def sendMultipleFileCSV(self, pathToFile, type = MultipleMessage.TYPE_C, callback = MultipleMessage.CALLBACK_INACTIVE):
        response = HumanConnectionHelper()
        # Substitui os caracteres reservados do caminho do arquivo
        pathToFile = response.pathEncode(pathToFile) 
        file = csv.reader(open(pathToFile, 'rb'))
        list = ""
        # Lê todo o arquivo e concatena em uma string
        for row in file:
            list += str(row) + "\n"
            
        # Decodifica a string retornada pelo arquivo e repassa a lista para o método sendMultipleList
        return self.sendMultipleListMsg(response.csvDecode(list), type, callback)
        
         
    def sendMultipleListMsg(self, list="", type = MultipleMessage.TYPE_C, callback = MultipleMessage.CALLBACK_INACTIVE):
        
        msg = MultipleMessage()
        msg.setAccount(self.getAccount())
        msg.setCode(self.getCode())
        msg.setList(list)
        msg.setCallBack(callback)
        msg.setType(type)
        
        # Trata a mensagem de erro e retorna a mensagem amigavel
        return self.response.getResponse(self.sendMultiple(msg));
    
        
    
    
        
    

        
        
        