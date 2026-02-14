#!/usr/bin/env python3
"""
Direct upload script for Cloudflare Pages
Uploads pre-built files directly without using Cloudflare's build system
"""
import os
import sys
import json
import hashlib
import base64
import requests
from pathlib import Path

# Configuration
ACCOUNT_ID = "817fcb0dc27d526b1e3b4c9a9dd14179"
PROJECT_NAME = "elitegbb"
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN")
BUILD_DIR = "/home/user/webapp/frontend/build"

def get_file_hash(filepath):
    """Get SHA-256 hash of file content"""
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

def create_deployment():
    """Create a new deployment and get upload URLs"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments"

    # Collect all files with their hashes
    files = {}
    build_path = Path(BUILD_DIR)

    for filepath in build_path.rglob('*'):
        if filepath.is_file():
            relative_path = str(filepath.relative_to(build_path))
            if relative_path.startswith('./'):
                relative_path = relative_path[2:]

            file_hash = get_file_hash(filepath)
            files[relative_path] = {
                "hash": file_hash,
                "size": filepath.stat().st_size
            }

    print(f"Found {len(files)} files to upload")

    # Create deployment
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "branch": "main",
        "files": files
    }

    response = requests.post(url, headers=headers, json=payload)
    result = response.json()

    if not result.get('success'):
        print(f"Failed to create deployment: {result.get('errors', 'Unknown error')}")
        sys.exit(1)

    return result['result']

def upload_files(deployment):
    """Upload files to the deployment"""
    upload_urls = deployment.get('upload_urls', [])
    build_path = Path(BUILD_DIR)

    print(f"Uploading {len(upload_urls)} files...")

    for upload_info in upload_urls:
        filepath = upload_info['path']
        upload_url = upload_info['url']

        full_path = build_path / filepath
        if not full_path.exists():
            print(f"  ⚠️  File not found: {filepath}")
            continue

        with open(full_path, 'rb') as f:
            content = f.read()

        # Upload to the presigned URL
        upload_response = requests.put(upload_url, data=content)

        if upload_response.status_code in [200, 201]:
            print(f"  ✓ Uploaded: {filepath}")
        else:
            print(f"  ✗ Failed: {filepath} (status: {upload_response.status_code})")

def finalize_deployment(deployment_id):
    """Finalize the deployment"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments/{deployment_id}/finalize"

    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers)
    result = response.json()

    if result.get('success'):
        print(f"✅ Deployment finalized successfully!")
        print(f"   URL: {result.get('result', {}).get('url', 'N/A')}")
    else:
        print(f"⚠️  Finalize warning: {result.get('errors', 'Unknown')}")

if __name__ == "__main__":
    if not API_TOKEN:
        print("❌ CLOUDFLARE_API_TOKEN environment variable not set")
        sys.exit(1)

    print("🚀 Starting direct upload to Cloudflare Pages...")
    print(f"   Account: {ACCOUNT_ID}")
    print(f"   Project: {PROJECT_NAME}")
    print(f"   Build directory: {BUILD_DIR}")
    print()

    # Create deployment
    deployment = create_deployment()
    deployment_id = deployment.get('id')
    print(f"✅ Deployment created: {deployment_id}")
    print()

    # Upload files
    upload_files(deployment)
    print()

    # Finalize
    finalize_deployment(deployment_id)
