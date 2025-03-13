
import QRCode from 'qrcode';

// UPI Payment Type
export interface UPIPayment {
  payeeName: string;
  payeeVpa: string; // UPI Virtual Payment Address
  amount?: number;
  transactionNote?: string;
  merchantCode?: string;
}

/**
 * Generates a UPI payment URL according to UPI specification
 * This will work with any UPI payment app in India
 */
export const generateUPIUrl = (payment: UPIPayment): string => {
  // Create the URL with required parameters
  const upiUrl = new URL('upi://pay');
  
  // Required parameters
  upiUrl.searchParams.append('pa', payment.payeeVpa); // payee address (VPA)
  upiUrl.searchParams.append('pn', payment.payeeName); // payee name
  
  // Optional parameters
  if (payment.amount) {
    upiUrl.searchParams.append('am', payment.amount.toString());
  }
  
  if (payment.transactionNote) {
    upiUrl.searchParams.append('tn', payment.transactionNote);
  }
  
  if (payment.merchantCode) {
    upiUrl.searchParams.append('mc', payment.merchantCode);
  }
  
  // Set currency as INR
  upiUrl.searchParams.append('cu', 'INR');
  
  return upiUrl.toString();
};

/**
 * Generates a QR code as a data URL for the UPI payment
 */
export const generateUPIQRCode = async (payment: UPIPayment): Promise<string> => {
  try {
    const upiUrl = generateUPIUrl(payment);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating UPI QR code:', error);
    throw new Error('Failed to generate UPI QR code');
  }
};

/**
 * Validate a UPI ID format
 */
export const isValidUpiId = (upiId: string): boolean => {
  // UPI ID format is typically: username@provider
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upiId);
};
