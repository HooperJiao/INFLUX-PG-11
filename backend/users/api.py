from ninja import Router, Schema
from django.contrib import auth
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django import forms
from django.http import HttpResponseBadRequest
from django.shortcuts import get_list_or_404, get_object_or_404

from django.contrib.auth.models import User
from ninja import ModelSchema
from typing import List

router = Router()

class RegisterForm(forms.Form):
    username = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput())

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('Email have exists.')
        return username

class RegisterInput(Schema):
    username: str
    password: str

@router.post('/register', auth=None)
def register(request, payload: RegisterInput):
    formData = {
        'username': payload.username,
        'password': payload.password
    }

    form = RegisterForm(formData)
    if form.is_valid():
        user = User.objects.create_user(
            username=payload.username,
            password=payload.password,
            email=payload.username
        )
        return {"message": "create user success!"}
    else:
        return HttpResponseBadRequest(form.errors.as_json())


class UserInfo(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
@router.get('/info', response=UserInfo)
def user_info(request):
    user = User.objects.filter(username=request.auth).first()
    return user
