// GST Verification Service
// Integrates with GST verification API

export interface GSTDetails {
  legalBusinessName: string;
  tradeName: string;
  businessAddress: string;
  gstStatus: 'Active' | 'Inactive';
  registrationDate: string;
  businessType: string;
  constitution: string;
}

export async function verifyGST(gstNumber: string): Promise<GSTDetails | null> {
  try {
    // In production, this would call the actual GST verification API
    // For now, we'll simulate the verification process

    // Validate GST format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
      throw new Error('Invalid GST number format');
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock response based on GST number
    // In production, this would be the actual API response
    const mockResponse: GSTDetails = {
      legalBusinessName: 'Sample Business Private Limited',
      tradeName: 'Sample Business',
      businessAddress: '123, Business Park, Mumbai, Maharashtra - 400001',
      gstStatus: 'Active',
      registrationDate: '2020-01-15',
      businessType: 'Private Limited Company',
      constitution: 'Private Limited Company',
    };

    return mockResponse;
  } catch (error) {
    console.error('GST verification error:', error);
    return null;
  }
}

// Validate GST checksum
export function validateGSTChecksum(gstNumber: string): boolean {
  if (!gstNumber || gstNumber.length !== 15) return false;

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gstNumber)) return false;

  // Additional checksum validation logic can be added here
  // For now, we'll just validate the format
  return true;
}

// Get state code from GST number
export function getStateFromGST(gstNumber: string): string {
  const stateCode = gstNumber.substring(0, 2);
  const stateMap: { [key: string]: string } = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli and Daman and Diu',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh (New)',
    '38': 'Ladakh',
  };

  return stateMap[stateCode] || 'Unknown';
}
