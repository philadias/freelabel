#!/usr/bin/env python
import sys

import cv2 as cv
import numpy as np


def lut2index_refactor(color_image, lut):
    height = np.size(color_image, 0)
    width = np.size(color_image, 1)

    labels_image = np.zeros((height, width), np.uint8)

    bi, gi, ri = cv.split(color_image)
    lut = np.uint8(lut)

    # enumerate is a nice function, when you need both element and index:
    for i, color in enumerate(lut[:-1]):
        b, g, r = color.flatten()  # split the lut into 3 vars
        mask = (bi == b) & (ri == r) & (gi == g)  # evaluate whether image is == lut at i
        labels_image[mask] = i  # labels_image = class index @ mask
    return labels_image


lut = np.load('static/images/PASCALlut.npy')

color_image = cv.imread(sys.argv[1])

label_img = lut2index_refactor(color_image, lut)

cv.imwrite("labels_image.png", label_img)


