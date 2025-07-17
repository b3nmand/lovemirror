#!/usr/bin/env python3
"""
Test script for Azure AI Service deployment
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

def test_chat_endpoint():
    """Test the chat endpoint"""
    print("🔍 Testing chat endpoint...")
    test_payload = {
        "user_input": "How can I improve communication with my partner?",
        "user_context": {
            "profile": {
                "name": "Test User",
                "gender": "Not specified",
                "region": "Global",
                "cultural_context": "modern"
            },
            "assessment_scores": {
                "communication": 3,
                "trust": 4,
                "empathy": 2,
                "shared_goals": 5
            },
            "delusional_score": 6.5,
            "compatibility_score": 78
        },
        "chat_history": []
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        print(f"✅ Chat endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get('response', '')
            print(f"📊 Response received: {len(response_text)} characters")
            print(f"🤖 AI Response preview: {response_text[:200]}...")
            return True
        else:
            print(f"❌ Chat endpoint failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Chat endpoint error: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    print("🔍 Testing CORS configuration...")
    try:
        response = requests.options(
            f"{BASE_URL}/api/chat",
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
    print("🚀 Azure AI Service Deployment Test")
    print("=" * 50)
    print(f"📍 Testing URL: {BASE_URL}")
    print(f"⏰ Timestamp: {datetime.now().isoformat()}")
    print()
    
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Root Endpoint", test_root_endpoint),
        ("Chat Endpoint", test_chat_endpoint),
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
    print("\n" + "=" * 50)
    print("📋 Test Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your Azure deployment is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check your deployment configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 