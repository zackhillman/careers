class Zack:
	def __init__(self,name):
		self.__name = name
	def output(self):
		print(self.__name)

obj = Zack("zack")
obj.output()
print(obj.__name)

class Simon:
	def output2(self,other):
		print(other.__name)

obj2 = Simon()
obj2.output2(obj)
