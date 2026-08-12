import urllib.request
import zipfile
import sys

url = 'https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip'
zip_path = 'node.zip'

print(f"Downloading Node.js from {url}...")
try:
    urllib.request.urlretrieve(url, zip_path)
    print("Download complete.")
except Exception as e:
    print(f"Error downloading: {e}")
    sys.exit(1)

print("Extracting Node.js...")
try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall('.')
    print("Extraction complete.")
except Exception as e:
    print(f"Error extracting: {e}")
    sys.exit(1)

print("Done. Node.js is at node-v20.12.2-win-x64")
