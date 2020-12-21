import hashlib
import base64
import os
import re

def random_bytes(size):
	try:
		return os.urandom(size)
	except NotImplementedError:
		return ''.join('%c' % randint(0, 255) for i in range(size))

def random_token(size):
	token = base64.urlsafe_b64encode(random_bytes(size))
	return token.replace('=', '')[:size]

# def md5(value):
# 	return hashlib.md5(value).hexdigest()

# def sha1(value):
# 	return hashlib.sha1(value).hexdigest()