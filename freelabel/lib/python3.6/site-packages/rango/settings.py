from django.conf import settings

globals().update(settings._wrapped.__dict__)

def has_setting(key):
	return hasattr(settings, key)

def get_setting(key, default=None):
    return getattr(settings, key, default)