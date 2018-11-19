import sys, os, glob
sys.path.append(os.getcwd()+"/freelabel")

from django.shortcuts import render

from django.http import HttpResponseRedirect, HttpResponse

from django.shortcuts import render_to_response

import numpy as np
import json
import urllib.request as ur

from ourLib import saveGTasImg

import scipy.io as sio

import math

# used to return numpy arrays via AJAX to JS side
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


def startTrain(request):
    return render(request, 'freelabel/train.html')

def loadTraining(request):
    username = request.user.username

    # load text file with list of images
    f = open('static/imgListT.txt', 'r')
    imgList = f.readlines()
    f.close()

    # load text file with list of corresponding ground truths
    f = open('static/gtListT.txt', 'r')
    gtList = f.readlines()
    f.close()

    # load text file with list of categories in the dataset
    f = open('static/listCats.txt', 'r')
    catsList = f.readlines()
    f.close()

    # load bounding box 
    f = open('static/bboxListT.txt', 'r')
    bboxList = f.readlines()
    f.close()

    # load list of classes per image 
    f = open('static/classListT.txt', 'r')
    clsList = f.readlines()
    f.close()

    return HttpResponse(json.dumps({'imgList': imgList,'gtList': gtList,'catsList': catsList, \
                                    'bboxList': bboxList,'clsList': clsList,'username': username}), content_type="application/json")
