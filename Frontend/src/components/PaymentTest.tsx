import React from 'react';
import { paymentService } from '@/lib/payments';

export const PaymentTest: React.FC = () => {
  const testValidation = () => {
    console.log('UPI Validation Tests:');
    console.log('user@paytm:', paymentService.validateUpiId('user@paytm')); // true
    console.log('invalid-upi:', paymentService.validateUpiId('invalid-upi')); // false
    console.log('user@', paymentService.validateUpiId('user@')); // false
    console.log('@paytm', paymentService.validateUpiId('@paytm')); // false
    
    console.log('\nAmount Formatting Tests:');
    console.log('1000:', paymentService.formatAmount(1000)); // ₹1,000
    console.log('50000:', paymentService.formatAmount(50000)); // ₹50,000
    console.log('123456:', paymentService.formatAmount(123456)); // ₹1,23,456
    
    console.log('\nCard Validation Tests:');
    console.log('4111111111111111:', paymentService.validateCardNumber('4111111111111111')); // true (test card)
    console.log('1234567890123456:', paymentService.validateCardNumber('1234567890123456')); // false
    
    console.log('\nExpiry Validation Tests:');
    console.log('12/25:', paymentService.validateExpiryDate('12/25')); // depends on current date
    console.log('13/25:', paymentService.validateExpiryDate('13/25')); // false (invalid month)
    console.log('12/20:', paymentService.validateExpiryDate('12/20')); // false (expired)
    
    console.log('\nCVV Validation Tests:');
    console.log('123:', paymentService.validateCvv('123')); // true
    console.log('1234:', paymentService.validateCvv('1234')); // true
    console.log('12:', paymentService.validateCvv('12')); // false
    console.log('abc:', paymentService.validateCvv('abc')); // false
  };

  const testMethodPreferences = () => {
    console.log('\nMethod Preferences Tests:');
    
    console.log('UPI with Google Pay:', paymentService.getMethodPreferences('upi', 'google_pay'));
    console.log('Net Banking with SBI:', paymentService.getMethodPreferences('netbanking', 'sbi'));
    console.log('Wallets with Paytm:', paymentService.getMethodPreferences('wallets', 'paytm'));
    console.log('Card:', paymentService.getMethodPreferences('card'));
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h3 className="text-lg font-bold mb-4">Payment Service Tests</h3>
      <div className="space-x-2">
        <button 
          onClick={testValidation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Validation
        </button>
        <button 
          onClick={testMethodPreferences}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Method Preferences
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">Check browser console for test results</p>
    </div>
  );
};

export default PaymentTest;
