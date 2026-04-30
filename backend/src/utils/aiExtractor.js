const axios = require('axios');

/**
 * Extract product name from inquiry text using AI API
 * Falls back to regex-based extraction if API fails
 */
async function extractProductName(text) {
  if (!text || typeof text !== 'string') return null;

  const cleanText = text.trim();
  if (!cleanText) return null;

  // Try AI API first
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

  if (apiKey) {
    try {
      const response = await axios.post(
        apiUrl,
        {
          model: process.env.AI_MODEL || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Extract only the chemical product name from the given inquiry text. Return only the product name. If no chemical product is found, return "Unknown".'
            },
            {
              role: 'user',
              content: cleanText
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const productName = response.data.choices[0].message.content.trim();
      return productName === 'Unknown' ? null : productName;
    } catch (error) {
      console.warn('AI API failed, falling back to regex:', error.message);
    }
  }

  // Fallback: Rule-based extraction for common chemical patterns
  return extractProductNameFallback(cleanText);
}

/**
 * Fallback regex-based extraction for chemical product names
 */
function extractProductNameFallback(text) {
  // Pattern: "New Inquiry for [Product Name] from [Person]"
  const inquiryPattern = /New Inquiry for\s+([^\s].*?)\s+from\s/i;
  const match = text.match(inquiryPattern);
  if (match) {
    return match[1].trim();
  }

  // Pattern: "[Product Name] Inquiry from [Person]"
  const altPattern = /([^\s].*?)\s+Inquiry from\s/i;
  const altMatch = text.match(altPattern);
  if (altMatch) {
    return altMatch[1].trim();
  }

  // Generic: extract after "for"
  const forMatch = text.match(/(?:for|about)\s+([A-Z][a-zA-Z\s]+?)(?:\s+from|\s+inquiry|$)/i);
  if (forMatch) {
    return forMatch[1].trim();
  }

  return null;
}

/**
 * Extract person name from requirement text
 */
function extractPersonName(text) {
  if (!text) return null;

  // Pattern: "from Mr/Ms/Mrs/Dr [Name]"
  const patterns = [
    /(?:from|by)\s+(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Shri\.?|Smt\.?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+in|\s+at|\s+from|$)/i,
    /(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Shri\.?|Smt\.?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+in|\s+at|\s+from|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract city/state from text
 */
function extractLocation(text) {
  if (!text) return { city: null, state: null };

  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 
    'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
    'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
    'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
    'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
    'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli'
  ];

  const states = [
    'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat', 'Rajasthan',
    'West Bengal', 'Madhya Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana',
    'Bihar', 'Odisha', 'Jharkhand', 'Assam', 'Chhattisgarh', 'Uttarakhand',
    'Himachal Pradesh', 'Goa', 'Jammu and Kashmir', 'Delhi'
  ];

  let city = null;
  let state = null;

  const lowerText = text.toLowerCase();

  for (const c of cities) {
    if (lowerText.includes(c.toLowerCase())) {
      city = c;
      break;
    }
  }

  for (const s of states) {
    if (lowerText.includes(s.toLowerCase())) {
      state = s;
      break;
    }
  }

  return { city, state };
}

module.exports = {
  extractProductName,
  extractPersonName,
  extractLocation
};
