from django.urls import path

from freelabel import views, viewsTrain, viewsFl

urlpatterns = [
    path('', views.main, name='main'),

    path('register/', views.register, name='register'), 
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    path('initanns/', views.initanns, name='initanns'),
    path('refine/', views.refine, name='refine'),
    path('cmpGT/', views.cmpGT, name='cmpGT'),
    path('showFinalImg/', views.showFinalImg, name='showFinalImg'),
    path('writeLog/', views.writeLog, name='writeLog'),
    
    path('play/loadlist/', views.loadlist, name='loadlist'),

    path('play/', views.play, name='play'),
    path('playFlowers/', viewsFl.playFlowers, name='playFlowers'),
    path('playFlowers/loadBatches/', viewsFl.loadBatches, name='loadFlower'),
    path('playFlowers/writeFlLog/', viewsFl.writeFlLog, name='writeFlLog'),

    path('train/', viewsTrain.startTrain, name='play'),
    path('train/loadTraining/', viewsTrain.loadTraining, name='loadlist'),

    path('video/', views.playVideo, name='playVideo'),
]
