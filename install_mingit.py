import urllib.request
import zipfile
import sys
import os

url = 'https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip'
zip_path = 'mingit.zip'
extract_path = 'mingit'

print(f"Downloading MinGit from {url}...")
try:
    urllib.request.urlretrieve(url, zip_path)
except Exception as e:
    print(f"Error downloading: {e}")
    sys.exit(1)

print("Extracting MinGit...")
try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
except Exception as e:
    print(f"Error extracting: {e}")
    sys.exit(1)
print("Done")
