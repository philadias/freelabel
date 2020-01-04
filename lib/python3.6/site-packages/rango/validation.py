import os
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ValidationError as ValidationError_
from django.core.validators import *

ValidationError = ValidationError_

def raise_error(message):
    raise ValidationError(message)


class FileTypeValidator(object):
    regex = ''
    message = _('File type should be one of these: %s')
    code = 'invalid'

    def __init__(self, extensions, message=None, code=None):
        self.extensions = extensions
        if message is not None:
            self.message = message
        if code is not None:
            self.code = code

    def __call__(self, value):
        """
        Validates that the file has allowed extension.
        """
        name, ext = os.path.splitext(unicode(value))
        if not ext.lower() in self.extensions:
            message = self.message % ' '.join(self.extensions)
            raise ValidationError(message, code=self.code)