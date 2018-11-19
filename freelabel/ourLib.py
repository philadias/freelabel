#!/usr/bin/env python
import sys

from distutils.core import setup, Extension

import cv2 as cv
import numpy as np

import scipy.io as sio
import numpy.matlib as npm

import time
import json

# imports for calling C++ reg.growing code
import ctypes
import callRGR

# for parallelism
import multiprocessing

import pickle

#####

def regGrowing(area,numSamples,R_H,height,width,sz,preSeg,m,img_r,img_g,img_b,clsMap,numCls,return_dict,itSet):
    # h is the index o pixels p_h within R_H. We randomly sample seeds
    # according to h~U(1,|R_H|)
    # round down + Uniform distribution
    h = np.floor(area * np.random.random((area,)))
    h = h.astype(np.int64)
 
    # s is the index of each seed for current region growing step
    # sequence
    idSeeds = np.arange(0,numSamples) # IDs of random seeds
    idSeeds = idSeeds.astype(np.int64)

    posSeeds = h[idSeeds] # get the position of these seeds within R_H

    # S is the corresponding set of all seeds, mapped into
    # corresponding img-size matrix
    s = R_H[posSeeds]        
    S = np.zeros((height, width))
    S[np.unravel_index(s, S.shape, 'F')] = 1  

    # allocate memory for output returned by reg.growing C++ code
    RGRout = np.zeros((width*height), dtype=int)

    S = S.flatten(order='F')

    # call reg.growing code (adapted SNIC) in C++, using Cython (see callRGR.pyx and setup.py)
    # perform region growing. PsiMap is the output map of generated
    out_ = callRGR.callRGR(img_r, img_g, img_b, preSeg.astype(np.int32), S.astype(np.int32), width, height, numSamples, m,RGRout.astype(np.int32))
    PsiMap = np.asarray(out_)       

    # number of generated clusters.  We subtract 2 to disconsider the pixels pre-classified as background (indexes -1 and 0)
    N = np.amax(PsiMap)-2

    clsScores = clsMap.flatten(order='F')
    clsScores = clsScores.astype(np.double)

    # majority voting per cluster
    for k in range(0, N):       
        p_j_ = np.nonzero(PsiMap == k)
        p_j_ = np.asarray(p_j_)

        for itCls in range(0, numCls):
            idxOffset = sz*itCls;
            p_j_cls = p_j_ + idxOffset;

            noPositives =  (np.count_nonzero(clsScores[p_j_cls] > 0));
            clsScores[p_j_cls] = float(noPositives)/p_j_.size

    clsScores = np.reshape(clsScores,(height,width,numCls),order='F')    

    return_dict[itSet] = clsScores
########
def main(username,img,anns,weight_,m):
    # get image size, basically height and width
    height, width, channels = img.shape
    heightAnns, widthAnns = anns.shape

    if(widthAnns != width):
        img = cv.resize(img, (widthAnns, heightAnns)) 

    height, width, channels = img.shape

    # flattening (i.e. vectorizing) matrices to pass it to C++ function (** OPENCV LOADS BGR RATHER THAN RGB!)
    img_b = img[:,:,0].flatten() # R channel
    img_g = img[:,:,1].flatten() # G channel
    img_r = img[:,:,2].flatten() # B channel

    img_b = img_b.astype(np.int32)
    img_g = img_g.astype(np.int32)
    img_r = img_r.astype(np.int32)

    # image size 
    sz = width*height

    # load PASCAL colormap in CV format
    lut = np.load('static/images/PASCALlutW.npy')

    ## RGR parameters
    # fixed parameters
    # m = .1  # theta_m: balance between
    numSets = 8    # number of seeds sets (samplings)
    # cellSize = 10-int(weight_)   # average spacing between samples
    cellSize = 1.333   # average spacing between samples

    # Rectangular Kernel - equal to strel in matlab
    SE = cv.getStructuringElement(cv.MORPH_RECT, (80, 80))  # used for identifying far background

    # RGR - refine each class
    # list of annotated classes
    clsList = np.unique(anns)
    clsList = np.delete(clsList,0) # remove class 0 
    numCls = clsList.size # number of classes

    # annotations masks per class
    clsMap = np.zeros((height,width,numCls))
    for itCls in range(0, numCls):
        np.putmask(clsMap[:,:,itCls],anns == clsList[itCls],1) 

    # mask of annotated pixels: 
    # in this case, only annotated traces are high-confidence (index 2),
    # all others are uncertain (index 0)
    preSeg = np.int32(np.zeros((height,width)))
    np.putmask(preSeg,anns > 0,2)
    RoI = preSeg

    # identify all high confidence pixels composing the RoI
    area = np.count_nonzero(RoI)

    # R_H is the high confidence region, the union of R_nB and R_F
    R_H = np.nonzero(RoI.flatten('F') > 0)
    R_H = R_H[0]

    # number of seeds to be sampled is defined by the ratio between
    # |R_H| and desired spacing between seeds (cellSize)
    # round up
    numSamples = np.ceil(area / cellSize)

    preSeg = preSeg.flatten()

    # matrix that will contain the scoremaps for each iteration
    # ref_cls = np.zeros((height, width, numCls, numSets),dtype=float)    
    ref_cls = np.zeros((height*width*numCls, numSets),dtype=float)    
    
    num_cores = multiprocessing.cpu_count()

    manager = multiprocessing.Manager()
    return_dict = manager.dict()

    jobs = []
    for itSet in range(0, numSets):
        p = multiprocessing.Process(target=regGrowing, args=(area,numSamples,R_H,height,width,sz,preSeg,m,img_r,img_g,img_b,clsMap,numCls,return_dict,itSet))
        jobs.append(p)
        p.start()

    for proc in jobs:
        proc.join()

    outputPar = return_dict.values()    

    outputPar = np.asarray(outputPar)

    # swapping axes, because parallel returns (numSets,...)
    ref_cls = np.moveaxis(outputPar,0,3)

    # averaging scores obtained for each set of seeds
    ref_M = (np.sum(ref_cls,axis=3))/numSets        

    # maximum likelihood across refined classes scores ref_M
    maxScores = np.amax(ref_M,axis=2)
    maxClasses = np.argmax(ref_M,axis=2)

    detMask = np.uint8(maxClasses+1)

    finalMask = np.zeros((height,width),dtype=float);    
    for itCls in range(0, numCls):       
       np.putmask(finalMask,detMask == itCls+1,clsList[itCls]) 

    finalMask = np.uint8(finalMask-1)

    np.save('static/'+username+'/lastmask.npy', np.asarray(finalMask,dtype=float))
    # sio.savemat('intermediate.mat', mdict={'anns':anns,'ref_M': ref_M,'ref_cls':ref_cls,'finalMaskRGR':finalMask})  
    # apply colormap
    _,alpha = cv.threshold(finalMask,0,255,cv.THRESH_BINARY)

    finalMask = cv.cvtColor(np.uint8(finalMask), cv.COLOR_GRAY2RGB)    
    im_color = cv.LUT(finalMask, lut)    

    b, g, r = cv.split(im_color)
    rgba = [b,g,r, alpha]
    im_color = cv.merge(rgba,4) 

    return im_color

def startRGR(username,imgnp,userAnns,cnt,weight_,m):

    img = cv.imdecode(imgnp, cv.IMREAD_COLOR)
    im_color = main(username,img,userAnns,weight_,m)

    cv.imwrite('static/'+username+'/refined'+str(cnt)+'.png', im_color)

def traceLine(img,r0,c0,r1,c1,catId,thick):
    cv.line(img,(c0,r0),(c1,r1),catId,thick)

    return img

def tracePolyline(img,pts,catId,thick):    
    pts = pts.reshape((-1,1,2))
    cv.polylines(img,np.int32([pts]),False,catId,thick)
   
    return img

def saveGTasImg(username,id_):
    # load PASCAL colormap in CV format
    lut = np.load('static/images/PASCALlutW.npy')

    GTfile = 'static/'+username+'/GT.mat';
    # load ground truth (GT)
    matvar = sio.loadmat(GTfile)
    gtim =  np.asarray(matvar['mtx'],dtype=float)

    # apply colormap
    _,alpha = cv.threshold(np.uint8(gtim),0,255,cv.THRESH_BINARY)

    gtim = cv.cvtColor(np.uint8(gtim), cv.COLOR_GRAY2RGB)    
    im_color = cv.LUT(gtim, lut)    

    b, g, r = cv.split(im_color)
    rgba = [b,g,r, alpha]
    im_color = cv.merge(rgba,4) 

    cv.imwrite('static/'+username+'/GTimage'+ str(id_) +'.png', im_color)


def cmpToGT(username):
    # load current mask generated by the user
    resim = np.load('static/'+username+'/lastmask.npy')

    GTfile = 'static/'+username+'/GT.mat';
    # load ground truth (GT)
    matvar = sio.loadmat(GTfile)
    gtim =  np.asarray(matvar['mtx'],dtype=float)

    # get image size, basically height and width
    height, width = gtim.shape
    heightAnns, widthAnns = resim.shape

    if(widthAnns != width):
        resim = cv.resize(resim, (width, height)) 

    # number of categories
    num = 21

    # pixel locations to include in computation
    locs = np.nonzero(gtim.flatten('F') < 255)
    locs = locs[0]

    # joint histogram
    sumim0 = 1+gtim+(resim*num)
    sumim = sumim0.flatten('F')
    sumim = sumim[locs]
    hs = np.histogram(sumim,range(1, num*num +2))

    count = len(locs)
    confcounts = np.reshape(hs[0],(num,num),'F')

    # confusion matrix - first index is true label, second is inferred label
    sumconf = np.reshape(np.sum(confcounts,1),(num,1))
    denom = npm.repmat(1E-20+sumconf, 1, num)

    conf = 100*confcounts/denom
    rawcounts = confcounts

    accuracies = np.zeros((num,1),dtype=float)

    gtj = np.zeros((num,1),dtype=float)
    resj = np.zeros((num,1),dtype=float)
    gtjresj = np.zeros((num,1),dtype=float)

    for j in range(0, num):
        gtj[j] = np.sum(confcounts[j,:]) + 1E-20
        resj[j] = np.sum(confcounts[:,j]) + 1E-20
        gtjresj[j] = np.sum(confcounts[j,j]) 

        accuracies[j] = 100*gtjresj[j]/float(gtj[j]+resj[j]-gtjresj[j])         

    meanacc = 100*np.sum(gtjresj[1:])/float(np.sum(gtj[1:])+np.sum(resj[1:])-np.sum(gtjresj[1:]))

    return np.append(accuracies,meanacc)

if __name__== "__main__":
    main()

