from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from django.core.exceptions import ObjectDoesNotExist

@api_view(['POST'])
def register(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email already exists'}, status=400)

    user = User(email=email)
    user.set_password(password)
    user.save()
    return Response({'message': 'Registered successfully'}, status=201)

@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            return Response({'token': 'fake-jwt-token', 'user': {'id': user.id, 'email': user.email}}, status=200)
        else:
            return Response({'message': 'Invalid credentials'}, status=400)
    except ObjectDoesNotExist:
        return Response({'message': 'User not found'}, status=404)
    

@api_view(['GET'])
def get_users(request):
    users = User.objects.all().values('email')
    return Response({'users': list(users)})

