from django.http import *
from django.utils import simplejson

class JsonResponse(HttpResponse):
	"""
	HttpResponse descendant, which return response with ``application/json`` mimetype.
	"""
	def __init__(self, data):
		super(JsonResponse, self).__init__(content=simplejson.dumps(data, ensure_ascii=False), mimetype='application/json')
