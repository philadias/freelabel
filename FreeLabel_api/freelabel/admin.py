from django.contrib import admin

# Register your models here.
from django.contrib import admin

from freelabel.models import Category, Page

admin.site.register(Category)
admin.site.register(Page)
# admin.site.register(UserProfile)
