import sys, os, glob
sys.path.append(os.getcwd()+"/freelabel")

from django.shortcuts import render

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.decorators import login_required

from django.shortcuts import render_to_response

# Import the Category model
from freelabel.models import Category, Page

from freelabel.forms import UserForm

import numpy as np
import json
import urllib.request as ur

from skimage.draw import line
from ourLib import startRGR, traceLine, cmpToGT, saveGTasImg, tracePolyline, readLocalImg

from random import shuffle

import scipy.io as sio

import datetime, math

from threading import Thread

# for local folder usage (https://stackoverflow.com/questions/39801718/how-to-run-a-http-server-which-serves-a-specific-path)
from http.server import HTTPServer as BaseHTTPServer, SimpleHTTPRequestHandler
# import SimpleHTTPServer

class HTTPHandler(SimpleHTTPRequestHandler):
    # def do_POST(self):
    #     print("here")
    #     if self.path.startswith('/kill_server'):
    #         print("Server is going down, run it again manually!")
    #         def kill_me_please(server):
    #             server.shutdown()
    #             server.server_close()
    #         # httpd = HTTPServer('', ("", 8889))
    #         t=Thread(target=kill_me_please,args=(self.server,))
    #         t.start()                
    #         self.send_error(500)   
    #     print("move on")
    #     return  

    """This handler uses server.base_path instead of always using os.getcwd()"""
    def translate_path(self, path):
        path = SimpleHTTPRequestHandler.translate_path(self, path)
        relpath = os.path.relpath(path, os.getcwd())
        fullpath = os.path.join(self.server.base_path, relpath)
        return fullpath  

class HTTPServer(BaseHTTPServer):
    """The main server, you pass in base_path which is the path you want to serve requests from"""
    def __init__(self, base_path, server_address, RequestHandlerClass=HTTPHandler):
        self.base_path = base_path
        BaseHTTPServer.__init__(self, server_address, RequestHandlerClass)

# used to return numpy arrays via AJAX to JS side
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

# defines which page (.html) is loaded first
def main(request):
    return render(request, 'freelabel/register.html')

# renders the main playing page
def play(request):    
    return render(request, 'freelabel/main.html')    

####
def playCustom(request):    
    return render(request, 'freelabel/customset.html')        
  
def threadfunction(web_dir):

    # you can pick any PORT that is convenient for you
    PORT = 8889
    httpd = HTTPServer(web_dir, ("", 0))   
    
    httpd.handle_request()

def setcustomfolder(httpd):
    httpd.serve_forever()

def loadcustom(request):
    
    localFolder = request.POST.get('folderpath')
    setname = request.POST.get('datasetname')

    httpd = HTTPServer(localFolder, ("", 0))
    sockinfo = httpd.socket.getsockname()
    print(sockinfo[1])
    PORT = sockinfo[1]

    t=Thread(target=setcustomfolder,args=[httpd])
    t.start()

    username = request.user.username

    # get list of files in folder of custom dataset( IT IS ASSUMING JPG HERE, CHANGE AS NEEDED)
    imgList = [os.path.basename(x) for x in glob.glob(localFolder+"*.jpg")]
    print(imgList)

    # load text file with list of categories in the dataset
    f = open(os.path.join(localFolder,'categories.txt'), 'r')
    catList = f.readlines()
    f.close()

    # check if there is already a sequence of images for this user.
    # If not, creates one
    filename = 'static/lists/imgs_' + setname + '_' + username + '.txt'

    if not os.path.exists(filename):
        shuffleList(filename,len(imgList))

    idsList = np.loadtxt(filename, delimiter=',')    

    idsList = list(idsList)

    # get current total score and next image to be labeled
    filename = 'static/lists/info'+ setname +'_' + username + '.txt'
    if not os.path.exists(filename):
        nextId = 0
    else:          
        info = np.loadtxt(filename)   
        nextId = int(info)
    print(nextId)
    print(localFolder)
    return HttpResponse(json.dumps({'PORT':PORT,'imgList': imgList,'catList':catList,'idsList': idsList,'username': username,'nextId':nextId,'localFolder':localFolder}), content_type="application/json")

def refineCustom(request): 
    # get array of user traces from json 
    jsonAnns = json.loads(request.session['userAnns'])
    # convert it to numpy
    userAnns = np.array(jsonAnns["userAnns"])

    # get coordinates of trace to be drawn
    traces = request.POST.getlist('trace[]')   

    userAnns = drawTrace(userAnns,traces)

    username = request.user.username

    # get URL of image
    url = request.POST.get('img')
    # get random ID that defines mask filename
    ID = request.POST.get('ID')
    # weight of traces, which defines the spacing between samples in RGR
    weight_ = int(request.POST.get('weight'))

    # theta_m: regulates weight of color-similarity vs spatial-proximity
    # divide by to adjust from [1,10] to [.1,1] 
    m = float(request.POST.get('m'))/10

    # remove older files
    for filename in glob.glob("static/"+username+"/refined*"):
        os.remove(filename) 

    # open image URL
    img = readLocalImg(url)
    # download image and convert to numpy array
    img = np.asarray(img, dtype="uint8")    

    # call RGR and get mask as return 
    im_color = startRGR(username,img,userAnns,ID,weight_,m,True)   

    request.session['userAnns'] = json.dumps({'userAnns': userAnns}, cls=NumpyEncoder)

    return render(request, 'freelabel/main.html')

def writeCustomLog(request):

    # get the username
    username = request.user.username

    jsonAnns = json.loads(request.session['userAnns'])
    anns = np.array(jsonAnns["userAnns"])

    # total score and next i in list of images to load
    next_i = int(request.POST.get('next_i'))  
    filename = 'static/lists/infoCustom_' + username + '.txt'
    np.savetxt(filename,[next_i], fmt='%d', delimiter=',')       

    #id of image
    img_file = request.POST.get('img_file')  

    # get newest ID of file once window reload  
    file_ID = username;
    # save .mat with final mask and annotations, just in case we need it afterwards
    finalMask = np.load('static/'+username+'/lastmask.npy')
    
    setname = request.POST.get('datasetname')

    directory = 'static/log/masks/' + file_ID + '/' + setname  

    if not os.path.exists(directory):
        os.makedirs(directory)

    filename = directory + '/' + os.path.basename(img_file) + '.mat';
    sio.savemat(filename, mdict={'finalMask': finalMask, 'anns': anns})       

    # compute percentage of how many pixels were annotated by the user
    total_anns = np.count_nonzero(anns)
    total_anns = 100*(total_anns/anns.size)

    # filename = 'static/log/Results_' + file_ID + '.txt'
    filename = 'static/log/Log'+setname+'_' + username + '.txt'

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
    str_ = str(os.path.basename(img_file)) + ';' +  str(time) + ';' + \
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

    return render(request, 'freelabel/main.html')    

####
def loadlist(request):
    # load text file with list of images
    f = open('static/imgList2.txt', 'r')
    imgList = f.readlines()
    f.close()

    # load text file with list of corresponding ground truths
    f = open('static/gtList2.txt', 'r')
    gtList = f.readlines()
    f.close()

    # load text file with list of categories in the dataset
    f = open('static/listCats.txt', 'r')
    catsList = f.readlines()
    f.close()

    # load bounding box 
    f = open('static/bboxListCls.txt', 'r')
    bboxList = f.readlines()
    f.close()

    # load list of classes per image 
    f = open('static/classList.txt', 'r')
    clsList = f.readlines()
    f.close()

    # check if there is already a sequence of images for this user.
    # If not, creates one
    username = request.user.username
    filename = 'static/lists/imgs_' + username + '.txt'
    # print(username)

    if not os.path.exists(filename):
        shuffleList(filename,len(imgList))

    idsList = np.loadtxt(filename, delimiter=',')    
    idsList = list(idsList)
    
    # get current total score and next image to be labeled
    filename = 'static/lists/info_' + username + '.txt'
    if not os.path.exists(filename):
        nextId = 0
        total_ = 0
        
    else:  
        info = np.loadtxt(filename, delimiter=',')    
        nextId = info[0]
        total_ = info[1]

    # get list of top scorers
    filename = 'static/lists/ranking.npy'
    # if there is already a file with rankings, load its info that consists of:
    # username, average, total of images, score total
    if not os.path.exists(filename):
        if nextId > 0:
            ranking =  np.column_stack((username,total_/nextId,nextId, total_))
        else:
            ranking =  np.column_stack((username,0,0,0))
        np.save('static/lists/ranking.npy', ranking)            
    # create the file otherwise
    else:
        ranking = np.load(filename)

        usr_idx, = np.where(ranking[:,0] == username)

        if len(usr_idx) == 0:
            if nextId > 0:
                this_ = np.column_stack((username,total_/nextId,nextId, total_))
                ranking = np.append(ranking,this_,axis=0)        
            else:
                this_ = np.column_stack((username,0,0,0))
                ranking = np.append(ranking,this_,axis=0)   

        else:
            if nextId > 0:
                ranking[usr_idx,1] = total_/nextId
                ranking[usr_idx,2] = nextId
                ranking[usr_idx,3] = total_
            else:
                ranking[usr_idx,1] = 0
                ranking[usr_idx,2] = 0
                ranking[usr_idx,3] = 0

        # ugly piece of code that sorts ranking in descending order
        ranking = ranking[ranking[:,1].argsort()][::-1]      
        np.save('static/lists/ranking.npy', ranking)    

    rankusers_ = list(ranking[:,0])
    rankscores_ = list(ranking[:,1])
    rankimgs_ = list(ranking[:,2])
    ranktotal_ = list(ranking[:,3])

    return HttpResponse(json.dumps({'imgList': imgList,'gtList': gtList,'catsList': catsList, \
                                    'bboxList': bboxList,'clsList': clsList,'idsList': idsList,\
                                    'nextId':nextId,'scoreTotal': total_,'username': username,\
                                    'rankusers_':rankusers_,'rankscores_':rankscores_,'rankimgs_':rankimgs_, 'ranktotal_':ranktotal_}), \
                                    content_type="application/json")

def playVideo(request):
    return render(request, 'freelabel/video.html')

def shuffleList(filename,lst_length):
    str_ = '';

    shuffled_ = np.random.permutation(lst_length)
    np.savetxt(filename, shuffled_, fmt='%d', delimiter=',')     

def bboxCall(request):
    # download url as a local file
    urlBB = request.POST.get('BB')
    ur.urlretrieve(urlBB, "static/BB.txt")

    # read lines of this file
    f = open('static/BB.txt', 'r')
    bbList = f.readlines()
    f.close()

    # send back as json
    return HttpResponse(json.dumps({'bbList': bbList}), content_type="application/json")

def writeLog(request):

    username = request.user.username

    jsonAnns = json.loads(request.session['userAnns'])
    anns = np.array(jsonAnns["userAnns"])

    # total score and next i in list of images to load
    next_i = int(request.POST.get('next_i'))  
    total_ = int(request.POST.get('scoreTotal'))
    
    # update file accordingly
    filename = 'static/lists/info_' + username + '.txt'
    np.savetxt(filename,[next_i,total_], fmt='%d', delimiter=',')     

    #id of image
    id_image = request.POST.get('id_image')  

    # get newest ID of file once window reload  
    file_ID = username;
    # save .mat with final mask and annotations, just in case we need it afterwards
    finalMask = np.load('static/'+username+'/lastmask.npy')
    
    directory = 'static/log/masks/' + file_ID  

    if not os.path.exists(directory):
        os.makedirs(directory)

    filename = directory + '/' + id_image + '.mat';
    sio.savemat(filename, mdict={'finalMask': finalMask, 'anns': anns})       

    # compute percentage of how many pixels were annotated by the user
    total_anns = np.count_nonzero(anns)
    total_anns = 100*(total_anns/anns.size)

    filename = 'static/log/Log_' + username + '.txt'

    # if file exists, only append data
    if not os.path.exists(filename):
        a = open(filename, 'w+')
        a.close()

    #time spend
    time = request.POST.get('time')
    maxTime = request.POST.get('maxTime')

    #number of traces
    trace_number = request.POST.get('trace_number')

    #number of clicks on "refine"
    refine_number = request.POST.get('refine_number')

    #accuracies obtained   
    accuracies = request.POST.getlist('accuracies[]')

    #scores obtained   
    scores = request.POST.getlist('scores[]')
    timeBonus = request.POST.get('timeBonus')
    finalScore = request.POST.get('finalScore')

    # string containing all info for this image: 
    str_ = str(id_image) + ';' +  str(time) + ';'+ str(maxTime) + \
           ';' + str(trace_number) + ';' +  '%.3f'%(float(total_anns)) + ';' + \
           str(refine_number) + ';' + str(finalScore) + ';' + str(timeBonus) + ';' \

    # get array of accuracies for each class + average. If empty (i.e. no refinement performed yet)
    if accuracies is None:
        accuracies = 0

    for acc_ in accuracies:
        str_ = str_ + ',' + '%.3f'%(float(acc_))

    str_ = str_ + ';'

    for score_ in scores:
        str_ = str_ + ',' + score_

    str_ = str_ + '\n'

    a=open(filename, "a+")
    a.write(str_)
    a.close()

    # remove older files
    for filename in glob.glob("static/"+username+"/GTimage*"):
        os.remove(filename) 

    # convert .mat GT into a .png image
    im_color = saveGTasImg(username,id_image);    

    training_ = request.POST.get('trainingFlag')

    # update ranking if the call is coming from "play" page
    # move on in case it's coming from "training"
    if training_ is None:
        # update ranking npy array
        filename = 'static/lists/ranking.npy'
        ranking = np.load(filename)

        usr_idx = np.where(ranking[:,0] == username)    

        if not usr_idx:
            this_ = np.column_stack((username,total_/next_i,next_i, total_))
            ranking = np.append(ranking,this_,axis=0)     
        else:
            usr_idx = usr_idx[0]
            ranking[usr_idx,1] = total_/next_i        
            ranking[usr_idx,2] = next_i
            ranking[usr_idx,3] = total_    

        # ugly piece of code that sorts ranking in descending order
        ranking = ranking[ranking[:,1].argsort()][::-1]      
        np.save('static/lists/ranking.npy', ranking)   

        # return render(request, 'freelabel/main.html')
        rankusers_ = list(ranking[:,0])
        rankscores_ = list(ranking[:,1])
        rankimgs_ = list(ranking[:,2])
        ranktotal_ = list(ranking[:,3])

        return HttpResponse(json.dumps({'rankusers_':rankusers_,'rankscores_':rankscores_,'rankimgs_':rankimgs_, 'ranktotal_':ranktotal_}),content_type="application/json") 
    else:
        return render(request, 'freelabel/train.html') 
        
# initialize array with user traces for this iamge
def initanns(request):

    username = request.user.username

    # delete pre-existent mask .npy file
    if os.path.exists('static/'+username+'/lastmask.npy',):
        os.remove('static/'+username+'/lastmask.npy',) 

    img_size = request.POST.getlist('img_size[]')    
    
    height = int(img_size[0])
    width = int(img_size[1])

    # create array with users annotations (same dimensions as image)
    userAnns = np.zeros((height,width),dtype=int)

    np.save('static/'+username+'/lastmask.npy', userAnns)

    # using sessions allow us to keep updating and accessing this same variable back and forth here in the views.py
    request.session['userAnns'] = json.dumps({'userAnns': userAnns}, cls=NumpyEncoder)  
    request.session.save()
    # get bounding boxes
    # download url as a local file
    urlBB = request.POST.get('BB')

    if urlBB is None:
        return render(request, 'freelabel/flower.html') 
    else:
        ur.urlretrieve(urlBB, "static/BB.txt")

        # read lines of this file
        f = open('static/BB.txt', 'r')
        bbList = f.readlines()
        f.close()

        # send back as js
        return HttpResponse(json.dumps({'bbList': bbList}), content_type="application/json")            
  

def refine(request): 
    # get array of user traces from json 
    jsonAnns = json.loads(request.session['userAnns'])
    # convert it to numpy
    userAnns = np.array(jsonAnns["userAnns"])

    # get coordinates of trace to be drawn
    traces = request.POST.getlist('trace[]')   

    userAnns = drawTrace(userAnns,traces)

    username = request.user.username

    # get URL of image
    url = request.POST.get('img')
    # get random ID that defines mask filename
    ID = request.POST.get('ID')
    # weight of traces, which defines the spacing between samples in RGR
    weight_ = int(request.POST.get('weight'))

    # theta_m: regulates weight of color-similarity vs spatial-proximity
    # divide by to adjust from [1,10] to [.1,1] 
    m = float(request.POST.get('m'))/10

    # remove older files
    for filename in glob.glob("static/"+username+"/refined*"):
        os.remove(filename) 

    # open image URL
    resp = ur.urlopen(url)
    # download image and convert to numpy array
    img = np.asarray(bytearray(resp.read()), dtype="uint8")    

    # call RGR and get mask as return 
    im_color = startRGR(username,img,userAnns,ID,weight_,m,False)   

    request.session['userAnns'] = json.dumps({'userAnns': userAnns}, cls=NumpyEncoder)

    return render(request, 'freelabel/main.html')


def cmpGT(request):
    username = request.user.username

    # get URL of ground truth file
    urlGT = request.POST.get('GT')
    # download this URL as local file GT.mat
    ur.urlretrieve(urlGT, "static/"+username+"/GT.mat")

    # call function that computes accuracies
    acc = cmpToGT(username)

    return HttpResponse(json.dumps({'acc': acc}, cls=NumpyEncoder), content_type="application/json")

def showFinalImg(request):
    username = request.user.username

    # get random ID that defines mask filename
    ID = int(request.POST.get('ID'))

    # remove older files
    for filename in glob.glob("static/"+username+"/GTimage*"):
        os.remove(filename) 

    # call asImg and get image  
    im_color = saveGTasImg(username,ID);

    return render(request, 'freelabel/main.html')

def drawTrace(userAnns,traces):

    img = np.uint8(userAnns)

    for itline in range(0,len(traces)):
        traceStr = traces[itline]
        trace = [x.strip() for x in traceStr.split(',')]

        # each trace "coordinate" contains: x,y,thickness,category,
        # so a line is defined by (trace[i],trace[i+1])--(trace[i+4],trace[i+5]), 
        # with thickness=trace[i+2] (or trace[i+6]) and category=trace[i+3](or trace[i+7])               
        pts = np.empty(shape=[0, 2]);
        for i in range(0,len(trace)-5,4):            
            
            # trace line between coordinates
            c0 = int(trace[i]) # i.e. x0
            r0 = int(trace[i+1]) # i.e. y0
            
            c1 = int(trace[i+4])
            r1 = int(trace[i+5])

            pts = np.append(pts,[[c0,r0]],axis=0)
            pts = np.append(pts,[[c1,r1]],axis=0)

            thick = int(trace[i+2])
            catId = int(trace[i+3])
        userAnns = tracePolyline(img,pts,catId,thick)    

    return userAnns 

def register(request):

    # A boolean value for telling the template whether the registration was successful.
    # Set to False initially. Code changes value to True when registration succeeds.
    registered = False

    # If it's a HTTP POST, we're interested in processing form data.
    if request.method == 'POST':
        # Attempt to grab information from the raw form information.
        # Note that we make use of both UserForm and UserProfileForm.
        user_form = UserForm(data=request.POST)
        # profile_form = UserProfileForm(data=request.POST)

        # If the two forms are valid...
        if user_form.is_valid():
            # Save the user's form data to the database.
            user = user_form.save()

            # Now we hash the password with the set_password method.
            # Once hashed, we can update the user object.
            user.set_password(user.password)
            user.save()
    
            # Update our variable to tell the template registration was successful.
            registered = True

        # Invalid form or forms - mistakes or something else?
        # Print problems to the terminal.
        # They'll also be shown to the user.
        else:
            print (user_form.errors)

    # Not a HTTP POST, so we render our form using two ModelForm instances.
    # These forms will be blank, ready for user input.
    else:
        user_form = UserForm()
    
    # Render the template depending on the context.
    return render(request,
            'freelabel/register.html',
            {'user_form': user_form, 'registered': registered} )    

def user_login(request):

    # If the request is a HTTP POST, try to pull out the relevant information.
    if request.method == 'POST':
        # Gather the username and password provided by the user.
        # This information is obtained from the login form.
                # We use request.POST.get('<variable>') as opposed to request.POST['<variable>'],
                # because the request.POST.get('<variable>') returns None, if the value does not exist,
                # while the request.POST['<variable>'] will raise key error exception
        username = request.POST.get('username')
        password = request.POST.get('password')

        # Use Django's machinery to attempt to see if the username/password
        # combination is valid - a User object is returned if it is.
        user = authenticate(username=username, password=password)

        # If we have a User object, the details are correct.
        # If None (Python's way of representing the absence of a value), no user
        # with matching credentials was found.
        if user:
            # Is the account active? It could have been disabled.
            if user.is_active:
                # If the account is valid and active, we can log the user in.
                # We'll send the user back to the homepage.
                login(request, user)

                # show log in time 
                username = request.user.username
                filename = 'static/log/Log_' + username + '.txt'

                # if file exists, only append data
                if not os.path.exists(filename):
                    a = open(filename, 'w+')
                    a.close()

                login_time = datetime.datetime.now()

                print(login_time)

                str_ = "#" + str(login_time) + '\n'

                a=open(filename, "a+")
                a.write(str_)
                a.close()

                directory = 'static/'+username

                if not os.path.exists(directory):
                    os.makedirs(directory)

                return HttpResponseRedirect('/freelabel/')
                # return render(request, 'freelabel/login.html', {})
            else:
                # An inactive account was used - no logging in!
                return HttpResponse("Your freelabel account is disabled.")
        else:
            # Bad login details were provided. So we can't log the user in.
            print ("Invalid login details: {0}, {1}".format(username, password))
            return HttpResponse("Invalid login details supplied.")

    # The request is not a HTTP POST, so display the login form.
    # This scenario would most likely be a HTTP GET.
    else:
        # No context variables to pass to the template system, hence the
        # blank dictionary object...
        return render(request, 'freelabel/login.html', {})

# Use the login_required() decorator to ensure only those logged in can access the view.
@login_required
def user_logout(request):
    # show log in time 
    username = request.user.username

    filename = 'static/log/Log_' + username + '.txt'

     # if file exists, only append data
    if not os.path.exists(filename):
        a = open(filename, 'w+')
        a.close()

    logout_time = datetime.datetime.now()


    print(logout_time)


    str_ = "!" + str(logout_time) + '\n'

    a=open(filename, "a+")
    a.write(str_)
    a.close()


    # Since we know the user is logged in, we can now just log them out.
    logout(request)

    # Take the user back to the homepage.
    return HttpResponseRedirect('/freelabel/register')           