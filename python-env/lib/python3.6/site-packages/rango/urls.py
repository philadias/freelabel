try:
	from django.conf.urls import url as url_,\
		include as include_, patterns as patterns_
except ImportError:
	from django.conf.urls.defaults import url as url_,\
		include as include_, patterns as patterns_

from django.core.urlresolvers import reverse as reverse_

url = url_
include = include_
patterns = patterns_
reverse_old = reverse_

def reverse(name, *args, **kwargs):
	return reverse_(name, args=args, kwargs=kwargs)