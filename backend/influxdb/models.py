from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class UserDashboard(models.Model):
    user = models.ForeignKey(User, primary_key=True, unique=True, on_delete=models.CASCADE)
    folder_uid = models.CharField(max_length=128)
    datasource_uid = models.CharField(max_length=128)
    custom_dashboard_id = models.IntegerField()
    custom_dashboard_uid = models.CharField(max_length=128)
    default_dashboard_id = models.IntegerField()
    default_dashboard_uid = models.CharField(max_length=128)

class Graph(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dashboard_index = models.IntegerField()
    title = models.CharField(max_length=128)
    query = models.TextField()
    range_start = models.CharField(max_length=128)
    range_end = models.CharField(max_length=128)
    limit = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
