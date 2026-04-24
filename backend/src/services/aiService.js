// OpenRouter AI Service
// Uses Claude Haiku for AI-powered features

const https = require('https');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    this.baseUrl = 'openrouter.ai';
  }

  async makeRequest(messages, options = {}) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.model,
        messages: messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      });

      const requestOptions = {
        hostname: this.baseUrl,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'eBay Clone AI Features',
        },
      };

      const req = https.request(requestOptions, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.error) {
              reject(new Error(parsed.error.message || 'AI API Error'));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error('Failed to parse AI response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  // Generate product description
  async generateProductDescription(productData) {
    const { title, category, condition, price, features } = productData;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert eBay listing copywriter. Create compelling, detailed product descriptions that highlight features, benefits, and value. Be professional and persuasive.',
      },
      {
        role: 'user',
        content: `Create a compelling product description for:
Title: ${title}
Category: ${category}
Condition: ${condition}
Price: $${price}
Features: ${features || 'Not specified'}

Please provide:
1. A catchy opening hook
2. Key features and benefits
3. Why buyers should purchase
4. Any relevant details about condition/quality`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        description: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        description: null,
      };
    }
  }

  // Suggest optimal price
  async suggestPrice(productData) {
    const { title, category, condition, description, comparableItems } = productData;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert eBay pricing analyst. Analyze products and suggest optimal pricing strategies based on market conditions, item condition, and demand.',
      },
      {
        role: 'user',
        content: `Analyze and suggest pricing for:
Title: ${title}
Category: ${category}
Condition: ${condition}
Description: ${description || 'Not provided'}
${comparableItems ? `Comparable items: ${JSON.stringify(comparableItems)}` : ''}

Please provide:
1. Suggested listing price
2. Suggested auction starting price
3. Buy It Now price recommendation
4. Price reasoning and market analysis
5. Tips for maximizing sale price`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        analysis: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        analysis: null,
      };
    }
  }

  // Get product recommendations
  async getRecommendations(userData) {
    const { viewHistory, purchaseHistory, preferences } = userData;

    const messages = [
      {
        role: 'system',
        content: 'You are an AI shopping assistant. Based on user behavior and preferences, suggest relevant products they might be interested in.',
      },
      {
        role: 'user',
        content: `Based on this user data, suggest product recommendations:
Recently Viewed: ${JSON.stringify(viewHistory || [])}
Purchase History: ${JSON.stringify(purchaseHistory || [])}
Preferences: ${JSON.stringify(preferences || {})}

Please provide:
1. Top 5 product category recommendations
2. Specific product type suggestions
3. Why these items match user interests
4. Related trending items they might like`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        recommendations: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recommendations: null,
      };
    }
  }

  // Answer product questions
  async answerQuestion(questionData) {
    const { productTitle, productDescription, question, sellerInfo } = questionData;

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful eBay customer service AI. Answer buyer questions about products based on available information. Be helpful, accurate, and professional.',
      },
      {
        role: 'user',
        content: `Answer this buyer question:
Product: ${productTitle}
Description: ${productDescription || 'Not provided'}
Seller Info: ${sellerInfo || 'Not provided'}

Question: ${question}

Please provide a helpful, accurate answer based on the available information. If you cannot answer definitively, suggest the buyer contact the seller directly.`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        answer: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        answer: null,
      };
    }
  }

  // Analyze listing quality
  async analyzeListingQuality(listingData) {
    const { title, description, images, price, category, condition } = listingData;

    const messages = [
      {
        role: 'system',
        content: 'You are an eBay listing optimization expert. Analyze listings and provide actionable feedback to improve visibility, conversion, and sales.',
      },
      {
        role: 'user',
        content: `Analyze this eBay listing:
Title: ${title}
Description: ${description || 'Not provided'}
Number of Images: ${images || 0}
Price: $${price}
Category: ${category}
Condition: ${condition}

Please provide:
1. Overall listing score (1-100)
2. Title optimization suggestions
3. Description improvements
4. Photo recommendations
5. Pricing feedback
6. SEO tips for better visibility`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        analysis: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        analysis: null,
      };
    }
  }

  // Generate item specifics
  async generateItemSpecifics(productData) {
    const { title, category, description } = productData;

    const messages = [
      {
        role: 'system',
        content: 'You are an eBay catalog expert. Generate comprehensive item specifics (attributes) for products based on their category and description.',
      },
      {
        role: 'user',
        content: `Generate item specifics for:
Title: ${title}
Category: ${category}
Description: ${description || 'Not provided'}

Please provide relevant item specifics in JSON format with common eBay attributes like:
- Brand
- Model
- Color
- Size/Dimensions
- Material
- Features
- And other category-specific attributes`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        specifics: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        specifics: null,
      };
    }
  }

  // Smart search suggestions
  async getSearchSuggestions(query, context = {}) {
    const messages = [
      {
        role: 'system',
        content: 'You are an eBay search assistant. Help users find what they are looking for by expanding and clarifying their search queries.',
      },
      {
        role: 'user',
        content: `User is searching for: "${query}"
${context.category ? `In category: ${context.category}` : ''}
${context.priceRange ? `Price range: ${context.priceRange}` : ''}

Please provide:
1. Related search terms (5-10)
2. Category suggestions
3. Filter recommendations
4. Did you mean corrections (if applicable)
5. Popular items matching this search`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        suggestions: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: null,
      };
    }
  }

  // Fraud detection analysis
  async analyzeFraudRisk(transactionData) {
    const { buyer, seller, product, price, shippingAddress, paymentMethod } = transactionData;

    const messages = [
      {
        role: 'system',
        content: 'You are a fraud detection analyst. Analyze transactions for potential fraud indicators while being fair and avoiding false positives.',
      },
      {
        role: 'user',
        content: `Analyze this transaction for fraud risk:
Buyer Account Age: ${buyer?.accountAge || 'Unknown'}
Seller Rating: ${seller?.rating || 'Unknown'}
Product: ${product?.title || 'Unknown'}
Price: $${price}
Shipping: ${shippingAddress?.country || 'Unknown'}
Payment: ${paymentMethod || 'Unknown'}

Please provide:
1. Risk score (low/medium/high)
2. Identified risk factors
3. Recommendations
4. Additional verification suggestions if needed`,
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        analysis: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        analysis: null,
      };
    }
  }

  // Generate message reply suggestion for sellers
  async generateMessageReply(messageData) {
    const {
      originalMessage,
      productTitle,
      productDescription,
      orderDetails,
      conversationHistory,
      sellerInfo
    } = messageData;

    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant helping an eBay seller respond to buyer messages.
Generate professional, helpful, and friendly reply suggestions.

Guidelines:
- Be polite and professional
- Address the buyer's specific questions or concerns
- Reference product details when relevant
- Keep responses concise but complete
- If there's an order, reference relevant order details
- Never make promises about shipping times or refunds without explicit authorization
- Suggest the buyer contact support for complex issues if needed`,
      },
      {
        role: 'user',
        content: `Generate a suggested reply for the seller to send to this buyer message:

Buyer's Message: "${originalMessage}"

Product Information:
- Title: ${productTitle || 'Not specified'}
- Description: ${productDescription ? productDescription.substring(0, 500) : 'Not provided'}

${orderDetails ? `Order Details:
- Order Number: ${orderDetails.orderNumber || 'N/A'}
- Status: ${orderDetails.status || 'N/A'}
- Tracking: ${orderDetails.trackingNumber || 'Not shipped yet'}` : ''}

${conversationHistory ? `Previous conversation context:
${conversationHistory.slice(-3).map(m => `${m.isOwn ? 'Seller' : 'Buyer'}: ${m.content}`).join('\n')}` : ''}

Please generate 2-3 professional reply options of varying length (short, medium, and detailed).
Format each option clearly.`,
      },
    ];

    try {
      const response = await this.makeRequest(messages, { maxTokens: 800 });
      return {
        success: true,
        suggestions: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: null,
      };
    }
  }

  // Analyze and suggest improvements for product photos
  async analyzeProductImage(imageData) {
    const { imageUrl, productTitle, productCategory } = imageData;

    const messages = [
      {
        role: 'system',
        content: `You are an expert eBay product photography consultant. Analyze product images and provide actionable suggestions to improve listing photos for better sales.

Focus on:
- Lighting quality and recommendations
- Background suggestions (clean white backgrounds sell better)
- Composition and framing
- Image clarity and focus
- Multiple angle suggestions
- Props and staging tips
- Common mistakes to avoid`,
      },
      {
        role: 'user',
        content: `Analyze this product listing photo and provide improvement suggestions:

Product: ${productTitle || 'Unknown product'}
Category: ${productCategory || 'General'}
Image URL: ${imageUrl}

Please provide:
1. Overall photo quality score (1-10)
2. Background analysis and suggestions
3. Lighting improvements
4. Composition tips
5. Recommended additional photos to take
6. Quick fixes that can improve the listing
7. Professional tips for this product category`,
      },
    ];

    try {
      const response = await this.makeRequest(messages, { maxTokens: 1000 });
      return {
        success: true,
        analysis: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        analysis: null,
      };
    }
  }

  // Generate background removal/enhancement suggestions
  async getBackgroundEnhancementSuggestions(imageData) {
    const { imageUrl, productType, currentBackground } = imageData;

    const messages = [
      {
        role: 'system',
        content: `You are an AI photo enhancement assistant for eBay sellers. Provide specific, actionable advice for improving product photo backgrounds.`,
      },
      {
        role: 'user',
        content: `Suggest background improvements for this product photo:

Product Type: ${productType || 'General product'}
Current Background: ${currentBackground || 'Unknown'}
Image URL: ${imageUrl}

Please provide:
1. Recommended background color/style for this product type
2. DIY background setup instructions
3. Free/low-cost tools for background removal
4. Best practices for this product category
5. Examples of effective backgrounds for similar products`,
      },
    ];

    try {
      const response = await this.makeRequest(messages, { maxTokens: 600 });
      return {
        success: true,
        suggestions: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: null,
      };
    }
  }

  // Chat support
  async chatSupport(conversation, userContext = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are a helpful eBay customer support AI assistant. Help users with:
- Order issues
- Returns and refunds
- Account questions
- Buying and selling help
- General marketplace questions

Be friendly, professional, and helpful. If you cannot resolve an issue, suggest contacting human support.`,
      },
      ...conversation,
    ];

    try {
      const response = await this.makeRequest(messages);
      return {
        success: true,
        response: response.choices[0].message.content,
        model: this.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: null,
      };
    }
  }
}

module.exports = new AIService();
