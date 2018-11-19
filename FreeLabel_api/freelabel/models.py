from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=128, unique=True)
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    def __str__(self):  # use __str__ on Python 3
        return self.name

class Page(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE,)
    

    title = models.CharField(max_length=128)
    url = models.URLField()
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)

    def __str__(self):      # use __str__ on Python 3
        return self.title

# class UserProfile(models.Model):
#     # This line is required. Links UserProfile to a User model instance.
#     user = models.OneToOneField(User, on_delete=models.CASCADE)

#     # The additional attributes we wish to include.
#     website = models.URLField(blank=True)
#     picture = models.ImageField(upload_to='profile_images', blank=True)
#     lastImgID = models.IntegerField(default=0)


    # Override the __unicode__() method to return out something meaningful!
    def __str__(self): 
        return self.user.username

