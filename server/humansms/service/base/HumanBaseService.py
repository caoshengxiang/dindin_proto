# coding=utf-8
from humansms.config.mainConfig import MainConfig
from humansms.util.HumanConnectionHelper import HumanConnectionHelper

# Principal classe de envio, por ela se monta a requisição http de acordo com as configurações
# setadas em mainConfig juntamente com a lista de mensagens setadas no HumanMultipleSend

class HumanBaseService:
	account = ""
	code = ""
	gateWayConfig = MainConfig()
	conHelper = HumanConnectionHelper()
	sendParams = gateWayConfig.gateWayConfigSend()
	
	def __init__(self, accountPar, codePar):
		self.setAccount(accountPar)
		self.setCode(codePar)
		
	def setAccount(self, account):
		self.account = account
	
	def getAccount(self):
		return self.account
	
	def setCode(self, code):
		self.code = code
	
	def getCode(self):
		return self.code			
		
	def sendMultiple(self, multipleMsg):
		self.sendParams["data"] = multipleMsg.getAsArray()
		return self.conHelper.sendRequest(self.sendParams)
	
	def sendSimple(self, singleMsg):
		self.sendParams["data"] = singleMsg.getAsArray() 
		return self.conHelper.sendRequest(self.sendParams)
		
	def queryMultiple(self, multipleQuery):
		self.sendParams["data"] = multipleQuery.getAsArray()
		return self.conHelper.sendRequest(self.sendParams).split("\n")
		
	def querySimple(self, simpleQuery):
		self.sendParams["data"] = simpleQuery.getAsArray()
		return self.conHelper.sendRequest(self.sendParams).split("\n")
	
	def cancelSimple(self, cancel):
		self.sendParams["data"] = cancel.getAsArray()
		return self.conHelper.sendRequest(self.sendParams)
	
	def listReceived(self, received):
		self.sendParams["data"] = received.getAsArray()
		return self.conHelper.sendRequest(self.sendParams)	
	
	
	
	
	