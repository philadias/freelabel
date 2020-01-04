from django.template import *
from django.template import TemplateSyntaxError as TemplateSyntaxError_
from django.template.loader import get_template as get_template_
from django.template.loader import select_template as select_template_
from django.template import Library as Library_
# from django.template import Context as Context_
# from django.template import RequestContext as RequestContext_
from django.utils.safestring import mark_safe as mark_safe_

# Context = Context_
# RequestContext = RequestContext_
Library = Library_
get_template = get_template_
select_template = select_template_
TemplateSyntaxError = TemplateSyntaxError_
mark_safe = mark_safe_


def render(template_name, context_data, request=None):
	template = get_template(template_name)
	if request:
		context = RequestContext(request)
	else:
		context = Context()
	context.update(context_data)
	return template.render(context)
