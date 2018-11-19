"""
Based on this tutorial: https://github.com/cython/cython/wiki/tutorials-NumpyPointerToC

To compile, run: python setup.py build_ext --inplace

"""

import cython

# import both numpy and the Cython declarations for numpy
import numpy as np
cimport numpy as np

# declare the interface to the C code
cdef extern void RGRmain(int* rin, int* gin, int* bin, int* kclass, int* roi, int width, int height, const int numk, double compactness, int* outlabels)

@cython.boundscheck(False)
@cython.wraparound(False)

def callRGR(int[:] img_r, int[:] img_g, int[:] img_b, int[:] preSeg, int[:] S, width, height, numSamples, m,
            int[:] output):
    
    RGRmain (&img_r[0],&img_g[0],&img_b[0],&preSeg[0],&S[0],width,height,numSamples,m,&output[0])    

    return output