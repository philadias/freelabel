import sys, os, glob
sys.path.append(os.getcwd()+"/freelabel")

from django.shortcuts import render

from django.http import HttpResponseRedirect, HttpResponse

from django.shortcuts import render_to_response

import numpy as np
import json
import urllib.request as ur

from random import shuffle

import scipy.io as sio

import datetime, math

# used to return numpy arrays via AJAX to JS side
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

#### flowers functions
def playFlowers(request):
    # Render the response and send it back!
    return render(request, 'freelabel/flower.html')


def shuffleList(filename,lst_length):
    str_ = '';

    shuffled_ = np.random.permutation(lst_length)
    # shuffled_ = np.append(shuffled_,[0])
    np.savetxt(filename, shuffled_, fmt='%d', delimiter=',')     

def loadBatches(request):
    username = request.user.username
    print(username)
   
    # list of flower blocks
    f = open('static/FlListPilot2.txt', 'r')
    imgList = f.readlines()
    f.close()

    # list of flower GTs
    f = open('static/gtFlListPilot2.txt', 'r')
    gtList = f.readlines()
    f.close()

    # list of .mat GTs
    f = open('static/matFlListPilot2.txt', 'r')
    matList = f.readlines()
    f.close()


    # check if there is already a sequence of images for this user.
    # If not, creates one
    filename = 'static/lists/imgs_Fl_' + username + '.txt'

    if not os.path.exists(filename):
        shuffleList(filename,len(imgList))

    idsList = np.loadtxt(filename, delimiter=',')    

    # same for GT
    filename = 'static/lists/imgsGT_Fl_' + username + '.txt'

    if not os.path.exists(filename):
        shuffleList(filename,len(gtList))

    GTidsList = np.loadtxt(filename, delimiter=',')    

    mergeList = idsList
    gtCnt_ = 0
    # for cnt_ in range(0,len(idsList),3):
    #     mergeList = np.insert(mergeList,cnt_,GTidsList[gtCnt_])
    #     gtCnt_ = gtCnt_ + 1        
    mergeList = np.insert(mergeList,0,GTidsList[0])    
    mergeList = np.insert(mergeList,3,GTidsList[1])    
    mergeList = np.insert(mergeList,6,GTidsList[2])    

    idsList = list(idsList)
    GTidsList = list(GTidsList)
    mergeList = list(mergeList)

    # get current total score and next image to be labeled
    filename = 'static/lists/infoFl_' + username + '.txt'
    if not os.path.exists(filename):
        nextId = 0
    else:          
        info = np.loadtxt(filename, delimiter=',')   
        nextId = info

    return HttpResponse(json.dumps({'imgList': imgList,'username': username,'gtList':gtList,'matList':matList,\
                                    'idsList':mergeList,'GTidsList':GTidsList,'nextId':nextId},cls=NumpyEncoder), content_type="application/json")
def writeFlLog(request):

    # get the username
    username = request.user.username

    jsonAnns = json.loads(request.session['userAnns'])
    anns = np.array(jsonAnns["userAnns"])

    # total score and next i in list of images to load
    next_i = int(request.POST.get('next_i'))  
    filename = 'static/lists/infoFl_' + username + '.txt'
    np.savetxt(filename,[next_i], fmt='%d', delimiter=',')       

    #id of image
    id_image = request.POST.get('id_image')  

    # get newest ID of file once window reload  
    # file_ID = request.POST.get('fileID')    
    file_ID = username;
    # save .mat with final mask and annotations, just in case we need it afterwards
    finalMask = np.load('static/'+username+'/lastmask.npy')
    
    directory = 'static/log/masks/' + file_ID + '/flower'  

    if not os.path.exists(directory):
        os.makedirs(directory)

    filename = directory + '/' + id_image + '.mat';
    sio.savemat(filename, mdict={'finalMask': finalMask, 'anns': anns})       

    # compute percentage of how many pixels were annotated by the user
    total_anns = np.count_nonzero(anns)
    total_anns = 100*(total_anns/anns.size)

    # filename = 'static/log/Results_' + file_ID + '.txt'
    filename = 'static/log/LogFl_' + username + '.txt'

    # if file exists, only append data
    if not os.path.exists(filename):
        a = open(filename, 'w+')
        a.close()
    #append data here   

    #time spend
    time = request.POST.get('time')
    maxTime = request.POST.get('maxTime')

    #number of traces
    trace_number = request.POST.get('trace_number')

    #length of all traces

    #number of clicks on "refine"
    refine_number = request.POST.get('refine_number')

    #accuracies obtained   
    accuracies = request.POST.getlist('accuracies[]')

    # string containing all info for this image: 
    str_ = str(id_image) + ';' +  str(time) + ';' + \
           ';' + str(trace_number) + ';' +  '%.3f'%(float(total_anns)) + ';' + \
           str(refine_number)\

    if accuracies is None:
        accuracies = 0

    for acc_ in accuracies:
        str_ = str_ + ',' + '%.3f'%(float(acc_))

    # get array of accuracies for each class + average. If empty (i.e. no refinement performed yet)
    str_ = str_ + '\n'

    a=open(filename, "a+")
    a.write(str_)
    a.close()

     # remove older files
    for filename in glob.glob("static/"+username+"/GTimage*"):
        os.remove(filename) 

    return render(request, 'freelabel/flower.html')    