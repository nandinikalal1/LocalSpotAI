

from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()


MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/localspotai")


client = MongoClient(MONGO_URI)


database = client.localspotai

print("MongoDB connected successfully at:", MONGO_URI)
