# -*- coding: utf-8 -*-
from django.conf import settings
from django.core.mail import send_mail, mail_admins, mail_managers
from rango.template import Context, get_template

__all__ = ['send', 'send_template', 'mail_admins', 'mail_managers']


def send(*args, **kwargs):
    return send_mail(*args, **kwargs)


def send_template(subject=None, template=None, recipient_list=[],
                  context={}, from_email=None, **kwargs):
    t = get_template(template)
    c = Context(context)
    message = t.render(c)
    from_email = from_email or settings.DEFAULT_FROM_EMAIL
    kk = kwargs
    return send_mail(subject, message, from_email, recipient_list, **kwargs)