# -*- coding: utf-8 -*-
from functools import wraps
from django.http import Http404
from django.shortcuts import render_to_response as render_to_response_
from django.shortcuts import render as render_
from django.shortcuts import redirect as redirect_
from django.shortcuts import get_object_or_404 as get_object_or_404_
from django.contrib.auth.decorators import login_required as login_required_
from rango.template import RequestContext
from rango.response import JsonResponse

__all__ = ['render_to', 'render_json', 'render_to_response',
		   'render', 'redirect', 'get_object_or_404', 'login_required']

render_to_response = render_to_response_
redirect = redirect_
render = render_
get_object_or_404 = get_object_or_404_
login_required = login_required_


def raise_404(message=None):
	raise Http404(message)


def render_to(template=None, mimetype="text/html"):
	"""
	Decorator for Django views that sends returned dict to render_to_response 
	function.

	Template name can be decorator parameter or TEMPLATE item in returned 
	dictionary.  RequestContext always added as context instance.
	If view doesn't return dict then decorator simply returns output.

	Parameters:
	 - template: template name to use
	 - mimetype: content type to send in response headers

	Examples:
	# 1. Template name in decorator parameters

	@render_to('template.html')
	def foo(request):
		bar = Bar.object.all()  
		return {'bar': bar}

	# equals to 
	def foo(request):
		bar = Bar.object.all()  
		return render_to_response('template.html', 'bar': bar}, context_instance=RequestContext(request))


	# 2. Template name as TEMPLATE item value in return dictionary.
		 if TEMPLATE is given then its value will have higher priority 
		 than render_to argument.

	@render_to()
	def foo(request, category):
		template_name = '%s.html' % category
		return {'bar': bar, 'TEMPLATE': template_name}
	
	#equals to
	def foo(request, category):
		template_name = '%s.html' % category
		return render_to_response(template_name, {'bar': bar}, context_instance=RequestContext(request))

	"""
	def renderer(function):
		@wraps(function)
		def wrapper(request, *args, **kwargs):
			output = function(request, *args, **kwargs)
			if not isinstance(output, dict):
				return output
			tmpl = output.pop('TEMPLATE', template)
			
			response = render_to_response(tmpl, output, context_instance=RequestContext(request), mimetype=mimetype)
			
			if mimetype=="text/html":
				response["Pragma"] = "no-cache"
				response["Cache-Control"] = "no-store, no-cache, must-revalidate, post-check=0, pre-check=0"
			
			return response
		return wrapper
	return renderer


def render_json(func):
	"""
	If view returned serializable dict, returns JsonResponse with this dict as content.

	example:
		
		@render_json
		def my_view(request):
			news = News.objects.all()
			news_titles = [entry.title for entry in news]
			return {'news_titles': news_titles}
	"""
	@wraps(func)
	def wrapper(request, *args, **kwargs):
		response = func(request, *args, **kwargs)
		if isinstance(response, dict):
			return JsonResponse(response)
		else:
			return response
	return wrapper

