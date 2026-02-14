# DNS FIX GUIDE: Moving from Netlify to Cloudflare

## The Problem
Your domain (app.elitegbb.com) is still resolving to Netlify's servers.
This happens when DNS records or nameservers haven't been fully updated.

## Step 1: Check Your Current DNS Configuration

Run these commands on your LOCAL machine (not in this sandbox):

```bash
# Check what nameservers your domain uses
nslookup -type=NS elitegbb.com

# Check where app.elitegbb.com points
nslookup app.elitegbb.com

# Check CNAME record
dig CNAME app.elitegbb.com +short
```

## Step 2: Determine Your Setup

### SCENARIO A: Using Netlify DNS (Nameservers point to Netlify)
If `nslookup -type=NS elitegbb.com` shows:
- dns1.p02.nsone.net
- dns2.p02.nsone.net
- dns3.p04.nsone.net
- dns4.p04.nsone.net

**FIX:** Change nameservers at your DOMAIN REGISTRAR to Cloudflare:

1. Go to your domain registrar (where you bought elitegbb.com)
2. Find "Nameservers" or "DNS Management"
3. Replace Netlify nameservers with Cloudflare nameservers:
   - brad.ns.cloudflare.com
   - deborah.ns.cloudflare.com
   (or whatever Cloudflare gives you in your dashboard)
4. Save and wait 24-48 hours

### SCENARIO B: Using Cloudflare DNS (but wrong records)
If nameservers already show Cloudflare (brad.ns.cloudflare.com, etc.)

**FIX:** Update DNS records in Cloudflare Dashboard:

1. Go to Cloudflare Dashboard → elitegbb.com → DNS → Records
2. Find the record for "app" (app.elitegbb.com)
3. If it shows:
   - CNAME app → something.netlify.app ❌ DELETE THIS
   - A app → 104.248.140.144 ❌ DELETE THIS (Netlify IP)
   - A app → 75.2.60.5 ✅ KEEP THIS (Cloudflare Pages)
   - CNAME app → elitegbb.pages.dev ✅ KEEP THIS

4. Add correct record if missing:
   - Type: CNAME
   - Name: app
   - Target: elitegbb.pages.dev
   - Proxy status: 🟡 (proxied)

## Step 3: Force Refresh (After making changes)

### Flush Cloudflare Cache:
1. Cloudflare Dashboard → Caching → Configuration
2. Click "Purge Everything"

### Clear Local DNS Cache:
**Mac:**
```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

**Windows:**
```cmd
ipconfig /flushdns
```

**Linux:**
```bash
sudo systemd-resolve --flush-caches
```

## Step 4: Verify the Fix

After 5-10 minutes, test:

```bash
# Should return Cloudflare server, not Netlify
curl -sI https://app.elitegbb.com | grep server

# Should show elitegbb.pages.dev or Cloudflare IPs
nslookup app.elitegbb.com
```

## Common Issues

### Issue: "I changed it but it's still showing Netlify"
- DNS propagation takes time (up to 48 hours)
- Your ISP may have cached the old DNS
- Try using mobile data or a VPN to test
- Use https://www.whatsmydns.net/ to check global propagation

### Issue: "SSL certificate errors"
- Cloudflare will auto-generate SSL once DNS points correctly
- May take 10-30 minutes after DNS updates

### Issue: "Site works on some devices but not others"
- This is normal during DNS propagation
- Wait it out, it will resolve globally

## Quick Checks You Can Do Right Now

1. **Check global DNS propagation:**
   https://www.whatsmydns.net/#CNAME/app.elitegbb.com

2. **Check if it's a local cache issue:**
   - Try accessing on your phone using mobile data
   - Try using a VPN or different network

3. **Check what your computer sees:**
   ```bash
   scutil --dns | grep nameserver  # Mac
   cat /etc/resolv.conf            # Linux/Mac
   ```

## Need Help?

Tell me:
1. What does `nslookup -type=NS elitegbb.com` return?
2. What does `nslookup app.elitegbb.com` return?
3. Who is your domain registrar?

And I can give you exact steps for your specific setup.
