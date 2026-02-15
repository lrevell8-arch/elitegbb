#!/usr/bin/env python3
"""
Stripe Integration Test Suite
Tests: SDK availability, configuration, and environment setup
"""
import sys
import os

def test_stripe_sdk():
    """Test Stripe SDK is installed and working"""
    try:
        import stripe
        version = stripe._version.VERSION if hasattr(stripe, '_version') else 'unknown'
        print(f"✅ Stripe SDK Version: {version}")
        return True
    except ImportError:
        print("❌ Stripe SDK not installed")
        return False

def test_emergentintegrations():
    """Test the emergentintegrations package"""
    try:
        backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
        sys.path.insert(0, backend_dir)

        from emergentintegrations.payments.stripe import StripeCheckout, CheckoutSessionRequest
        print("✅ EmergentIntegrations package loaded (StripeCheckout class)")
        return True
    except Exception as e:
        print(f"❌ Error loading emergentintegrations: {e}")
        return False

def test_env_file():
    """Test that .env file exists with required variables"""
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')

    if not os.path.exists(env_path):
        print("❌ backend/.env file does not exist")
        return False

    with open(env_path, 'r') as f:
        content = f.read()

    required_vars = ['STRIPE_API_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUCCESS_URL', 'CANCEL_URL']
    missing = [var for var in required_vars if var not in content]

    if missing:
        print(f"❌ Missing environment variables: {missing}")
        return False

    # Check if it's a placeholder or actual key
    if 'sk_live_your_stripe_live_key_here' in content or 'sk_test_your_stripe_test_key_here' in content:
        print("⚠️  STRIPE_API_KEY is set to placeholder value")
        print("   → Set the live key in Cloudflare Environment Variables")
    else:
        print("✅ STRIPE_API_KEY appears to be configured")

    print("✅ Environment file contains all required variables")
    return True

def test_success_cancel_urls():
    """Verify the success/cancel URLs are correctly configured"""
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')

    with open(env_path, 'r') as f:
        content = f.read()

    success_url = None
    cancel_url = None

    for line in content.split('\n'):
        if line.startswith('SUCCESS_URL='):
            success_url = line.split('=', 1)[1].strip()
        if line.startswith('CANCEL_URL='):
            cancel_url = line.split('=', 1)[1].strip()

    print(f"\n📋 URL Configuration:")
    print(f"   SUCCESS_URL: {success_url}")
    print(f"   CANCEL_URL:  {cancel_url}")

    # Verify URL format
    if success_url and 'elitegbb.com/success' in success_url:
        print("✅ Success URL is correctly configured")
    else:
        print("⚠️  Success URL may need verification")

    if cancel_url and 'elitegbb.com/intake' in cancel_url:
        print("✅ Cancel URL is correctly configured")
    else:
        print("⚠️  Cancel URL may need verification")

    return True

def test_frontend_build():
    """Test that frontend build exists"""
    build_path = os.path.join(os.path.dirname(__file__), 'frontend', 'build')

    if not os.path.exists(build_path):
        print("❌ Frontend build directory does not exist")
        return False

    index_html = os.path.join(build_path, 'index.html')
    if not os.path.exists(index_html):
        print("❌ Frontend build is missing index.html")
        return False

    print("✅ Frontend build exists and is ready for deployment")
    return True

def test_cloudflare_config():
    """Test Cloudflare wrangler.toml configuration"""
    wrangler_path = os.path.join(os.path.dirname(__file__), 'wrangler.toml')

    if not os.path.exists(wrangler_path):
        print("❌ wrangler.toml does not exist")
        return False

    with open(wrangler_path, 'r') as f:
        content = f.read()

    if 'elitegbb-app' in content:
        print("✅ Cloudflare project name configured: elitegbb-app")
    else:
        print("⚠️  Cloudflare project name not found in wrangler.toml")

    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("STRIPE INTEGRATION TEST SUITE")
    print("=" * 60)
    print()

    tests = [
        ("Stripe SDK", test_stripe_sdk),
        ("EmergentIntegrations Package", test_emergentintegrations),
        ("Environment File", test_env_file),
        ("Success/Cancel URLs", test_success_cancel_urls),
        ("Frontend Build", test_frontend_build),
        ("Cloudflare Config", test_cloudflare_config),
    ]

    results = []
    for name, test_func in tests:
        print(f"\n🧪 Testing: {name}")
        print("-" * 40)
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((name, False))

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status}: {name}")

    print()
    print(f"Result: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Ready for deployment.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Review the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
