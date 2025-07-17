#!/usr/bin/env python3
"""
Test script for Simplified LoveMirror Book Recommendation Service
Run this script to verify your Azure deployment is working correctly.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BASE_URL = "https://lovemirror-ai-service-gzasfnbbbpcaf7ff.ukwest-01.azurewebsites.net"
TIMEOUT = 30

def test_health_endpoint():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        print(f"✅ Health check status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Health data: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Health check failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check error: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("🔍 Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        print(f"✅ Root endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Service info: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_chapters_endpoint():
    """Test the chapters endpoint"""
    print("🔍 Testing chapters endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/chapters", timeout=TIMEOUT)
        print(f"✅ Chapters endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            chapters = data.get('chapters', [])
            print(f"📊 Found {len(chapters)} chapters:")
            for chapter in chapters:
                print(f"  - {chapter['category']}: {chapter['chapter_title']}")
            return True
        else:
            print(f"❌ Chapters endpoint failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Chapters endpoint error: {e}")
        return False

def test_recommendation_endpoint():
    """Test the recommendation endpoint"""
    print("🔍 Testing recommendation endpoint...")
    test_payload = {
        "assessment_scores": {
            "communication": 3,
            "trust": 4,
            "affection": 2,
            "empathy": 5,
            "shared_goals": 4
        },
        "user_context": {
            "profile": {
                "name": "Test User",
                "gender": "Not specified",
                "region": "Global",
                "cultural_context": "modern"
            }
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/recommendation",
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        print(f"✅ Recommendation endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            chapter_title = data.get('chapter_title', '')
            recommendation_reason = data.get('recommendation_reason', '')
            print(f"📊 Recommended chapter: {chapter_title}")
            print(f"📊 Reason: {recommendation_reason}")
            return True
        else:
            print(f"❌ Recommendation endpoint failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Recommendation endpoint error: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    print("🔍 Testing CORS configuration...")
    try:
        response = requests.options(
            f"{BASE_URL}/api/recommendation",
            headers={
                "Origin": "https://lovemirror.co.uk",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=TIMEOUT
        )
        
        cors_headers = response.headers.get("Access-Control-Allow-Origin", "")
        print(f"✅ CORS headers: {cors_headers}")
        
        if "lovemirror.co.uk" in cors_headers or "*" in cors_headers:
            print("✅ CORS properly configured")
            return True
        else:
            print("❌ CORS not properly configured")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ CORS test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Simplified LoveMirror Book Recommendation Service Test")
    print("=" * 60)
    print(f"📍 Testing URL: {BASE_URL}")
    print(f"⏰ Timestamp: {datetime.now().isoformat()}")
    print()
    
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Root Endpoint", test_root_endpoint),
        ("Chapters Endpoint", test_chapters_endpoint),
        ("Recommendation Endpoint", test_recommendation_endpoint),
        ("CORS Configuration", test_cors)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Summary")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your simplified service is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check your deployment configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 