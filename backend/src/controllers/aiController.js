// AI Controller - Handles all AI-powered features using OpenRouter

const aiService = require('../services/aiService');

// Generate product description
exports.generateDescription = async (req, res) => {
  try {
    const { title, category, condition, price, features } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Product title is required' });
    }

    const result = await aiService.generateProductDescription({
      title,
      category,
      condition,
      price,
      features,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          description: result.description,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate description',
      });
    }
  } catch (error) {
    console.error('AI Description Error:', error);
    res.status(500).json({ error: 'Failed to generate description' });
  }
};

// Get price suggestions
exports.suggestPrice = async (req, res) => {
  try {
    const { title, category, condition, description, comparableItems } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Product title is required' });
    }

    const result = await aiService.suggestPrice({
      title,
      category,
      condition,
      description,
      comparableItems,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          analysis: result.analysis,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to suggest price',
      });
    }
  } catch (error) {
    console.error('AI Price Suggestion Error:', error);
    res.status(500).json({ error: 'Failed to suggest price' });
  }
};

// Get product recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;

    // In a real app, fetch user's history from database
    const result = await aiService.getRecommendations({
      viewHistory: req.body.viewHistory || [],
      purchaseHistory: req.body.purchaseHistory || [],
      preferences: req.body.preferences || {},
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          recommendations: result.recommendations,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to get recommendations',
      });
    }
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

// Answer product question
exports.answerQuestion = async (req, res) => {
  try {
    const { productTitle, productDescription, question, sellerInfo } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const result = await aiService.answerQuestion({
      productTitle,
      productDescription,
      question,
      sellerInfo,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          answer: result.answer,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to answer question',
      });
    }
  } catch (error) {
    console.error('AI Answer Error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
};

// Analyze listing quality
exports.analyzeListingQuality = async (req, res) => {
  try {
    const { title, description, images, price, category, condition } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Listing title is required' });
    }

    const result = await aiService.analyzeListingQuality({
      title,
      description,
      images,
      price,
      category,
      condition,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          analysis: result.analysis,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to analyze listing',
      });
    }
  } catch (error) {
    console.error('AI Listing Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze listing' });
  }
};

// Generate item specifics
exports.generateItemSpecifics = async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Product title is required' });
    }

    const result = await aiService.generateItemSpecifics({
      title,
      category,
      description,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          specifics: result.specifics,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate specifics',
      });
    }
  } catch (error) {
    console.error('AI Item Specifics Error:', error);
    res.status(500).json({ error: 'Failed to generate item specifics' });
  }
};

// Get search suggestions
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query, category, priceRange } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const result = await aiService.getSearchSuggestions(query, {
      category,
      priceRange,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          suggestions: result.suggestions,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to get suggestions',
      });
    }
  } catch (error) {
    console.error('AI Search Suggestions Error:', error);
    res.status(500).json({ error: 'Failed to get search suggestions' });
  }
};

// Analyze fraud risk
exports.analyzeFraudRisk = async (req, res) => {
  try {
    const { buyer, seller, product, price, shippingAddress, paymentMethod } = req.body;

    const result = await aiService.analyzeFraudRisk({
      buyer,
      seller,
      product,
      price,
      shippingAddress,
      paymentMethod,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          analysis: result.analysis,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to analyze fraud risk',
      });
    }
  } catch (error) {
    console.error('AI Fraud Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze fraud risk' });
  }
};

// Generate message reply suggestions for sellers
exports.generateMessageReply = async (req, res) => {
  try {
    const {
      originalMessage,
      productTitle,
      productDescription,
      orderDetails,
      conversationHistory
    } = req.body;

    if (!originalMessage) {
      return res.status(400).json({ error: 'Original message is required' });
    }

    const result = await aiService.generateMessageReply({
      originalMessage,
      productTitle,
      productDescription,
      orderDetails,
      conversationHistory,
      sellerInfo: req.user,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          suggestions: result.suggestions,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate reply suggestions',
      });
    }
  } catch (error) {
    console.error('AI Message Reply Error:', error);
    res.status(500).json({ error: 'Failed to generate message reply' });
  }
};

// Analyze product image
exports.analyzeProductImage = async (req, res) => {
  try {
    const { imageUrl, productTitle, productCategory } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const result = await aiService.analyzeProductImage({
      imageUrl,
      productTitle,
      productCategory,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          analysis: result.analysis,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to analyze image',
      });
    }
  } catch (error) {
    console.error('AI Image Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
};

// Get background enhancement suggestions
exports.getBackgroundSuggestions = async (req, res) => {
  try {
    const { imageUrl, productType, currentBackground } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const result = await aiService.getBackgroundEnhancementSuggestions({
      imageUrl,
      productType,
      currentBackground,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          suggestions: result.suggestions,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to get background suggestions',
      });
    }
  } catch (error) {
    console.error('AI Background Suggestions Error:', error);
    res.status(500).json({ error: 'Failed to get background suggestions' });
  }
};

// AI Chat Support
exports.chatSupport = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const result = await aiService.chatSupport(messages, userContext);

    if (result.success) {
      res.json({
        success: true,
        data: {
          response: result.response,
          model: result.model,
          tokens: result.usage,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to get chat response',
      });
    }
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};
