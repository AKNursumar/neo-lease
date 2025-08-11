import { supabase } from './supabase';
import { config } from './config';

export interface PaymentOrderRequest {
  amount: number;
  currency?: string;
  rental_order_id?: string;
  booking_id?: string;
  notes?: Record<string, any>;
}

export interface PaymentVerificationRequest {
  payment_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class PaymentService {
  private baseUrl: string;
  private debugMode: boolean;
  private debugPayments: boolean;

  constructor() {
    this.baseUrl = config.api.backend;
    this.debugMode = config.debug.enabled;
    this.debugPayments = config.debug.payments;
    
    if (this.debugPayments) {
      console.log('PaymentService initialized with base URL:', this.baseUrl);
    }
  }

  private log(message: string, data?: any) {
    if (this.debugPayments) {
      console.log(`[PaymentService] ${message}`, data || '');
    }
  }

  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      this.log('Authentication failed: No access token found');
      throw new Error('Authentication required');
    }
    
    this.log('Authentication successful');
    return accessToken;
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();
    
    this.log(`Making request to: ${endpoint}`, { method: options.method || 'GET' });
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    this.log(`Response status: ${response.status}`, { 
      ok: response.ok, 
      statusText: response.statusText 
    });

    return response;
  }

  async createPaymentOrder(orderData: PaymentOrderRequest): Promise<any> {
    this.log('Creating payment order', { amount: orderData.amount, currency: orderData.currency });
    
    const response = await this.makeAuthenticatedRequest('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      this.log('Payment order creation failed', error);
      throw new Error(error.message || 'Failed to create payment order');
    }

    const result = await response.json();
    this.log('Payment order created successfully', { orderId: result.data?.razorpay_order_id });
    return result;
  }

  async verifyPayment(verificationData: PaymentVerificationRequest): Promise<any> {
    this.log('Verifying payment', { 
      paymentId: verificationData.razorpay_payment_id,
      orderId: verificationData.razorpay_order_id 
    });
    
    const response = await this.makeAuthenticatedRequest('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });

    if (!response.ok) {
      const error = await response.json();
      this.log('Payment verification failed', error);
      throw new Error(error.message || 'Payment verification failed');
    }

    const result = await response.json();
    this.log('Payment verification successful');
    return result;
  }

  async getPaymentHistory(): Promise<any> {
    const response = await this.makeAuthenticatedRequest('/api/payments');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payment history');
    }

    return response.json();
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const existingScript = document.getElementById('razorpay-script');
      
      if (existingScript) {
        this.log('Razorpay script already loaded');
        resolve(true);
        return;
      }

      this.log('Loading Razorpay script...');
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.log('Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        this.log('Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  createRazorpayInstance(options: any): any {
    if (!(window as any).Razorpay) {
      this.log('Razorpay SDK not available');
      throw new Error('Razorpay SDK not loaded');
    }
    
    this.log('Creating Razorpay instance', { 
      amount: options.amount, 
      orderId: options.order_id,
      currency: options.currency 
    });
    
    return new (window as any).Razorpay(options);
  }

  getMethodPreferences(paymentMethod: string, selectedOption?: string): any {
    const preferences: any = {};

    switch (paymentMethod) {
      case 'upi':
        preferences.method = { upi: true };
        if (selectedOption && selectedOption !== 'custom_upi') {
          preferences.prefill = { method: 'upi' };
        }
        break;
      
      case 'netbanking':
        preferences.method = { netbanking: true };
        if (selectedOption) {
          preferences.prefill = { 
            method: 'netbanking',
            bank: selectedOption
          };
        }
        break;
      
      case 'wallets':
        preferences.method = { wallet: true };
        if (selectedOption) {
          preferences.prefill = { 
            method: 'wallet',
            wallet: selectedOption
          };
        }
        break;
      
      case 'card':
        preferences.method = { card: true };
        break;
      
      default:
        break;
    }

    return preferences;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  validateUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
  }

  validateCardNumber(cardNumber: string): boolean {
    const cleanCard = cardNumber.replace(/\s+/g, '');
    const cardRegex = /^\d{13,19}$/;
    
    if (!cardRegex.test(cleanCard)) {
      return false;
    }

    // Luhn algorithm check
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanCard.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanCard.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  validateExpiryDate(expiry: string): boolean {
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    
    if (!expiryRegex.test(expiry)) {
      return false;
    }
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);
    
    if (expiryYear < currentYear) {
      return false;
    }
    
    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return false;
    }
    
    return true;
  }

  validateCvv(cvv: string): boolean {
    const cvvRegex = /^\d{3,4}$/;
    return cvvRegex.test(cvv);
  }
}

export const paymentService = new PaymentService();
export default paymentService;
