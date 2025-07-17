#!/usr/bin/env python3
"""
Test script for the Hybrid AI and Book Recommendation Service
Tests both AI responses and fallback book chapters
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BASE_URL = "https://lovemirror-ai-service.azurewebsites.net"  # Update with your Azure URL
# BASE_URL = "http://localhost:5000"  # For local testing

def test_health_endpoint():
    """Test the health endpoint"""
    print("🔍 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            print(f"   AI Enabled: {data.get('features', {}).get('ai_enabled')}")
            print(f"   Response Logic: {data.get('features', {}).get('response_logic')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("\n🔍 Testing Root Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint working")
            print(f"   Service: {data.get('service')}")
            print(f"   Endpoints: {list(data.get('endpoints', {}).keys())}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_hybrid_chat_endpoint():
    """Test the hybrid chat endpoint"""
    print("\n🔍 Testing Hybrid Chat Endpoint...")
    
    # Test payload
    payload = {
        "user_input": "How can I improve communication with my partner?",
        "user_context": {
            "profile": {
                "name": "Test User",
                "gender": "male",
                "region": "North America",
                "cultural_context": "western"
            },
            "assessment_scores": {
                "communication": 65,
                "trust": 70,
                "affection": 75
            },
            "delusional_score": 45,
            "compatibility_score": 78
        },
        "chat_history": []
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat endpoint working")
            print(f"   Response Type: {data.get('response_type')}")
            print(f"   Source: {data.get('source')}")
            print(f"   Response Length: {len(data.get('response', ''))} characters")
            
            # Show first 200 characters of response
            response_text = data.get('response', '')
            preview = response_text[:200] + "..." if len(response_text) > 200 else response_text
            print(f"   Response Preview: {preview}")
            
            return True
        else:
            print(f"❌ Chat endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
        return False

def test_fallback_recommendation_endpoint():
    """Test the fallback recommendation endpoint"""
    print("\n🔍 Testing Fallback Recommendation Endpoint...")
    
    payload = {
        "assessment_scores": {
            "communication": 60,
            "trust": 80,
            "affection": 70
        },
        "user_context": {
            "profile": {
                "name": "Test User",
                "gender": "female",
                "region": "Europe",
                "cultural_context": "western"
            }
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/recommendation",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Fallback recommendation working")
            print(f"   Chapter: {data.get('chapter_title')}")
            print(f"   Response Type: {data.get('response_type')}")
            print(f"   Source: {data.get('source')}")
            return True
        else:
            print(f"❌ Fallback recommendation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Fallback recommendation error: {e}")
        return False

def test_chapters_endpoint():
    """Test the chapters endpoint"""
    print("\n🔍 Testing Chapters Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/chapters", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chapters endpoint working")
            print(f"   Available Chapters: {len(data.get('chapters', []))}")
            for chapter in data.get('chapters', []):
                print(f"   - {chapter.get('chapter_title')}")
            return True
        else:
            print(f"❌ Chapters endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Chapters endpoint error: {e}")
        return False

def test_ai_failure_scenario():
    """Test what happens when AI fails (no API key)"""
    print("\n🔍 Testing AI Failure Scenario...")
    
    payload = {
        "user_input": "What is love?",
        "user_context": {
            "profile": {
                "name": "Test User",
                "gender": "male",
                "region": "Asia",
                "cultural_context": "eastern"
            },
            "assessment_scores": {
                "communication": 50,
                "trust": 60,
                "affection": 55
            }
        },
        "chat_history": []
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI failure handled gracefully")
            print(f"   Response Type: {data.get('response_type')}")
            print(f"   Source: {data.get('source')}")
            
            if data.get('response_type') == 'book_fallback':
                print(f"   ✅ Correctly fell back to book chapters")
            else:
                print(f"   ⚠️ Unexpected response type: {data.get('response_type')}")
            
            return True
        else:
            print(f"❌ AI failure test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ AI failure test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Hybrid AI and Book Recommendation Service")
    print("=" * 60)
    print(f"Target URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Root Endpoint", test_root_endpoint),
        ("Hybrid Chat", test_hybrid_chat_endpoint),
        ("Fallback Recommendation", test_fallback_recommendation_endpoint),
        ("Chapters Endpoint", test_chapters_endpoint),
        ("AI Failure Scenario", test_ai_failure_scenario),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The hybrid system is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the logs above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 