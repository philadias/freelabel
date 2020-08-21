#!/usr/bin/env python
import sys

from distutils.core import setup, Extension

import cv2 as cv
import numpy as np

import os
import scipy.io as sio
import numpy.matlib as npm

import time
import json

# imports for calling C++ reg.growing code
import ctypes
import callRGR
import pandas as pd

# for parallelism
import multiprocessing

import pickle

#####

def regGrowing(rng,area,numSamples,R_H,height,width,sz,preSeg,m,img_r,img_g,img_b,clsMap,numCls,return_dict,itSet):
    # h is the index o pixels p_h within R_H. We randomly sample seeds
    # according to h~U(1,|R_H|)
    # round down + Uniform distribution
    np.random.seed(itSet)
    h = np.floor(area * rng.random(size=area))
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

    # new version
    d = PsiMap.ravel()
    df = pd.DataFrame({'clusterIdx': d})

    clsArrays = np.split(clsMap,numCls,axis=2)
    for it, array_ in enumerate(clsArrays):
        # print(array_.shape)
        df.insert(it + 1, "cls%d" % it, array_.ravel('F'), True)

    dfMeans = df.groupby('clusterIdx').mean()
    means_ = np.asarray(dfMeans.iloc[d])
    clsScores = np.hsplit(means_,numCls)
    # np.save('PsiMap%d.npy'%itSet,PsiMap)
    # sio.savemat('clsMap%d.mat' % itSet, mdict={'clsScores':clsScores,'means_':means_})
    clsScores = np.reshape(clsScores,(numCls,height,width),order='C')
    clsScores = np.swapaxes(clsScores,0,2)
 

    return_dict[itSet] = clsScores
########
def main(username,img,anns,weight_,m,url,mergePreSeg):

    # get image size, basically height and width
    t1 = time.time()
    
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
    numSets = 4    # number of seeds sets (samplings)
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

    rng = np.random.default_rng()

    jobs = []
    for itSet in range(0, numSets):
        p = multiprocessing.Process(target=regGrowing, args=(rng,area,numSamples,R_H,height,width,sz,preSeg,m,img_r,img_g,img_b,clsMap,numCls,return_dict,itSet))
        jobs.append(p)
        p.start()

    for proc in jobs:
        proc.join()

    t2 = time.time()
    print("### TIME: %.2f" % (t2-t1))
    outputPar = return_dict.values()    

    outputPar = np.asarray(outputPar)

    # swapping axes, because parallel returns (numSets,...)
    ref_cls = np.moveaxis(outputPar,0,3)

    # averaging scores obtained for each set of seeds
    ref_M = (np.sum(ref_cls,axis=3))/numSets        

    # **INCORPORATING PRE-SEGMENTATIONS
    # scoremaps =
    # sio.savemat('pairs%d.mat' % itSet, mdict={'ref_M':ref_M,'scoremaps':scoremaps,'uncMap':uncMap})
    if mergePreSeg == True:
        w_ = 50

        urlGT,_ = os.path.splitext(url)
        # load .mat info from URL
        scoremaps,uncMap = loadLocalGT(urlGT+'.mat')
        heightS, widthS, _ = scoremaps.shape
        if (widthAnns != widthS):
            scoremaps = cv.resize(scoremaps, (widthAnns, heightAnns))
            uncMap = cv.resize(uncMap, (widthAnns, heightAnns))

        adjAnns = 1-(1/np.exp(ref_M*w_*5))
        weightAnns = np.repeat(np.max(adjAnns,axis=2)[:, :, np.newaxis],2,axis=2)

        adjUncMap = np.divide(1,np.exp(uncMap*w_*0.5))
        weightMap = np.repeat(adjUncMap[:, :, np.newaxis],2,axis=2)

        avgMap = np.divide(np.multiply(scoremaps,weightMap)+np.multiply(adjAnns,weightAnns),weightAnns+weightMap)
        # sio.savemat('pairs%d.mat' % itSet, mdict={'adjUncMap':adjUncMap,'adjAnns':adjAnns,'weightAnns':weightAnns,'ref_M':ref_M,'scoremaps':scoremaps,'uncMap':uncMap,'avgMap':avgMap,'weightMap':weightMap})
        # maximum likelihood across refined classes scores ref_M
    else:
        avgMap = ref_M
    maxScores = np.amax(avgMap,axis=2)
    maxClasses = np.argmax(avgMap,axis=2)

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
    print("### DONE HERE ###")

    return im_color

def startRGR(username,img,userAnns,cnt,weight_,m,url,mergePreSeg):

    # img = cv.imdecode(imgnp, cv.IMREAD_COLOR)
    im_color = main(username,img,userAnns,weight_,m,url,mergePreSeg)
    print("### SAVING ###")

    cv.imwrite('static/'+username+'/refined'+str(cnt)+'.png', im_color)
    print("### DONE ###")

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

def readLocalImg(filename):
    img = cv.imread(filename)

    return img


def loadLocalGT(filename):
    print(filename)
    matvar = sio.loadmat(filename)
    softScores = np.asarray(matvar['softScores'],dtype=float)
    uncMap = np.asarray(matvar['detUncMap'], dtype=float)

    # adjust range
    uncMap = (uncMap-0.5)/5
    uncMap[uncMap > 1] = 1

    # maxScores = np.max(softScores,dim=2)
    # cnnMask = np.amax(softScores, dim=2)
    print("loaded fine")
    return softScores,uncMap

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

