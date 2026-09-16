import hashlib

def hash_pwd(pwd):
    return hashlib.sha256(pwd.encode('utf-8')).hexdigest()
