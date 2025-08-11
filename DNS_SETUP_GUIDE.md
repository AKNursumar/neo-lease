# 🌐 Custom Domain Setup for Clerk

## DNS Configuration for neolease.com

### Required DNS Records

Add these DNS records to your domain provider (where you bought neolease.com):

#### 1. CNAME Record for Clerk Subdomain
```
Type: CNAME
Name: clerk
Value: frontend-api.clerk.services
TTL: 3600 (or Auto)
```

This will make `clerk.neolease.com` point to Clerk's frontend API servers.

#### 2. CNAME Record for Account Portal
```
Type: CNAME
Name: accounts
Value: accounts.clerk.services
TTL: 3600 (or Auto)
```

This will make `accounts.neolease.com` point to Clerk's account portal servers.

#### 3. CNAME Record for Email Service
```
Type: CNAME
Name: clkmail
Value: mail.832w3ibw902w.clerk.services
TTL: 3600 (or Auto)
```

This will make `clkmail.neolease.com` point to Clerk's email service servers.

#### 4. CNAME Record for DKIM Authentication (Key 1)
```
Type: CNAME
Name: clk._domainkey
Value: dkim1.832w3ibw902w.clerk.services
TTL: 3600 (or Auto)
```

This will make `clk._domainkey.neolease.com` point to Clerk's first DKIM key server.

#### 5. CNAME Record for DKIM Authentication (Key 2)
```
Type: CNAME
Name: clk2._domainkey
Value: dkim2.832w3ibw902w.clerk.services
TTL: 3600 (or Auto)
```

This will make `clk2._domainkey.neolease.com` point to Clerk's second DKIM key server.

#### 6. Optional: Root Domain Setup
If you want your main app to work on `neolease.com`:
```
Type: A
Name: @ (or root)
Value: Your hosting server IP
TTL: 3600
```

#### 7. Optional: WWW Subdomain
```
Type: CNAME
Name: www
Value: neolease.com
TTL: 3600
```

### DNS Provider Instructions

#### **Namecheap**
1. Go to Domain List → Manage → Advanced DNS
2. Add new record: Type: CNAME, Host: clerk, Value: frontend-api.clerk.services
3. Add new record: Type: CNAME, Host: accounts, Value: accounts.clerk.services
4. Add new record: Type: CNAME, Host: clkmail, Value: mail.832w3ibw902w.clerk.services
5. Add new record: Type: CNAME, Host: clk._domainkey, Value: dkim1.832w3ibw902w.clerk.services
6. Add new record: Type: CNAME, Host: clk2._domainkey, Value: dkim2.832w3ibw902w.clerk.services

#### **GoDaddy**
1. Go to DNS Management
2. Add Record → CNAME → Name: clerk, Points to: frontend-api.clerk.services
3. Add Record → CNAME → Name: accounts, Points to: accounts.clerk.services
4. Add Record → CNAME → Name: clkmail, Points to: mail.832w3ibw902w.clerk.services
5. Add Record → CNAME → Name: clk._domainkey, Points to: dkim1.832w3ibw902w.clerk.services
6. Add Record → CNAME → Name: clk2._domainkey, Points to: dkim2.832w3ibw902w.clerk.services

#### **Cloudflare**
1. Go to DNS → Records
2. Add record → CNAME → Name: clerk, Target: frontend-api.clerk.services
3. Add record → CNAME → Name: accounts, Target: accounts.clerk.services
4. Add record → CNAME → Name: clkmail, Target: mail.832w3ibw902w.clerk.services
5. Add record → CNAME → Name: clk._domainkey, Target: dkim1.832w3ibw902w.clerk.services
6. Add record → CNAME → Name: clk2._domainkey, Target: dkim2.832w3ibw902w.clerk.services

#### **Google Domains**
1. Go to DNS
2. Custom records → CNAME → clerk → frontend-api.clerk.services
3. Custom records → CNAME → accounts → accounts.clerk.services
4. Custom records → CNAME → clkmail → mail.832w3ibw902w.clerk.services
5. Custom records → CNAME → clk._domainkey → dkim1.832w3ibw902w.clerk.services
6. Custom records → CNAME → clk2._domainkey → dkim2.832w3ibw902w.clerk.services

### Clerk Dashboard Configuration

After setting up DNS:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to**: Settings → Domains
3. **Add Domain**: Enter `neolease.com`
4. **Add Subdomains**: 
   - Enter `clerk.neolease.com` (for frontend API)
   - Enter `accounts.neolease.com` (for account portal)
   - Enter `clkmail.neolease.com` (for email service)
   - Add DKIM records for email authentication
5. **Verify Domain**: Follow Clerk's verification steps

### Verification Commands

Test your DNS setup:

#### Windows (Command Prompt)
```cmd
nslookup clerk.neolease.com
nslookup accounts.neolease.com
nslookup clkmail.neolease.com
nslookup clk._domainkey.neolease.com
nslookup clk2._domainkey.neolease.com
ping clerk.neolease.com
ping accounts.neolease.com
```

#### Mac/Linux (Terminal)
```bash
dig clerk.neolease.com
dig accounts.neolease.com
dig clkmail.neolease.com
dig clk._domainkey.neolease.com
dig clk2._domainkey.neolease.com
nslookup clerk.neolease.com
nslookup accounts.neolease.com
ping clerk.neolease.com
ping accounts.neolease.com
```

### Expected Results
Once configured correctly:
- `clerk.neolease.com` should resolve to Clerk's frontend API servers
- `accounts.neolease.com` should resolve to Clerk's account portal servers
- `clkmail.neolease.com` should resolve to Clerk's email service servers
- DKIM records should resolve properly for email authentication
- Your app should load without DNS errors
- Clerk authentication, account management, and email services will work on your custom domains

### Timing
- DNS changes can take 1-48 hours to propagate globally
- Most changes are visible within 1-4 hours
- Use `nslookup` to check if changes have propagated

### Troubleshooting
If it doesn't work:
1. Check DNS propagation: https://dnschecker.org
2. Verify DNS records are correct
3. Clear browser cache
4. Wait for full DNS propagation
5. Check Clerk dashboard for domain verification status
