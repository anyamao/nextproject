# core/encryption.py
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
... ваш приватный ключ ...
-----END RSA PRIVATE KEY-----"""


def decrypt_password(encrypted: str) -> str:
    """Расшифровка пароля"""
    key = RSA.importKey(PRIVATE_KEY)
    cipher = PKCS1_v1_5.new(key)
    encrypted_bytes = base64.b64decode(encrypted)
    return cipher.decrypt(encrypted_bytes, None).decode("utf-8")
