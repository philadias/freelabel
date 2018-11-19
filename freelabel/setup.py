#!/usr/bin/env python
import sys


from distutils.core import setup
from distutils.extension import Extension
from Cython.Distutils import build_ext

import numpy

setup(
    cmdclass = {'build_ext': build_ext},
    ext_modules = [Extension("callRGR",
                             sources=["callRGR.pyx", "RGRmain.cpp"],
                             include_dirs=[numpy.get_include()])],
)