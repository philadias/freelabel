import logging

debug_logger = logging.getLogger('debug')

def debug(*args, **kwargs):
	return debug_logger.debug(*args, **kwargs)