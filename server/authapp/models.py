
# Create your models here.
from django.db import models

from bcrypt import hashpw, gensalt, checkpw

class User(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    def set_password(self, raw_password):
        self.password = hashpw(raw_password.encode('utf-8'), gensalt()).decode('utf-8')

    def check_password(self, raw_password):
        return checkpw(raw_password.encode('utf-8'), self.password.encode('utf-8'))
