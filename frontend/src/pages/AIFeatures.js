import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  AutoAwesome,
  Description,
  AttachMoney,
  Recommend,
  QuestionAnswer,
  Assessment,
  Category,
  Search,
  Security,
  Chat,
  ExpandMore,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Info,
  Star,
} from '@mui/icons-material';
import { aiService } from '../services/api';

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// Beautiful AI Response Display Component
const AIResponseDisplay = ({ response, title, icon }) => {
  if (!response) return null;

  // Parse the response and display beautifully
  const formatResponse = (text) => {
    if (!text) return null;

    // Split by numbered items or bullet points
    const sections = text.split(/\n(?=\d+\.|[-*]|\*\*)/);

    return sections.map((section, idx) => {
      // Check if it's a header (starts with **)
      if (section.startsWith('**') && section.includes('**')) {
        const headerMatch = section.match(/\*\*(.+?)\*\*/);
        const headerText = headerMatch ? headerMatch[1] : '';
        const restText = section.replace(/\*\*(.+?)\*\*/, '').trim();

        return (
          <Box key={idx} sx={{ mb: 2 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
              {headerText}
            </Typography>
            {restText && (
              <Typography variant="body1" sx={{ pl: 2, color: 'text.secondary' }}>
                {restText}
              </Typography>
            )}
          </Box>
        );
      }

      // Check if it's a numbered item
      if (/^\d+\./.test(section.trim())) {
        const numMatch = section.match(/^(\d+)\.\s*(.+)/s);
        if (numMatch) {
          return (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Chip
                label={numMatch[1]}
                size="small"
                color="primary"
                sx={{ mr: 2, mt: 0.5, minWidth: 32 }}
              />
              <Typography variant="body1">{numMatch[2].trim()}</Typography>
            </Box>
          );
        }
      }

      // Check if it's a bullet point
      if (/^[-*]/.test(section.trim())) {
        return (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, pl: 2 }}>
            <CheckCircle sx={{ fontSize: 18, color: 'success.main', mr: 1, mt: 0.3 }} />
            <Typography variant="body2">{section.replace(/^[-*]\s*/, '').trim()}</Typography>
          </Box>
        );
      }

      // Regular paragraph
      if (section.trim()) {
        return (
          <Typography key={idx} variant="body1" sx={{ mb: 2 }}>
            {section.trim()}
          </Typography>
        );
      }

      return null;
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mt: 3,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
          {title}
        </Typography>
        <Chip
          label="AI Generated"
          size="small"
          icon={<AutoAwesome sx={{ fontSize: 14 }} />}
          sx={{ ml: 'auto' }}
          color="secondary"
        />
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>{formatResponse(response)}</Box>
    </Paper>
  );
};

// Score Display Component
const ScoreDisplay = ({ score, label }) => (
  <Box sx={{ textAlign: 'center', p: 2 }}>
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={score}
        size={100}
        thickness={4}
        sx={{
          color: score >= 80 ? 'success.main' : score >= 60 ? 'warning.main' : 'error.main',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {score}
        </Typography>
      </Box>
    </Box>
    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 500 }}>
      {label}
    </Typography>
  </Box>
);

const AIFeatures = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);

  // Form states
  const [descriptionForm, setDescriptionForm] = useState({
    title: '',
    category: '',
    condition: 'new',
    price: '',
    features: '',
  });

  const [priceForm, setPriceForm] = useState({
    title: '',
    category: '',
    condition: 'new',
    description: '',
  });

  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    images: 0,
    price: '',
    category: '',
    condition: 'new',
  });

  const [questionForm, setQuestionForm] = useState({
    productTitle: '',
    productDescription: '',
    question: '',
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const handleGenerateDescription = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await aiService.generateDescription(descriptionForm);
      setResponse({
        type: 'description',
        data: result.data.data,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate description');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestPrice = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await aiService.suggestPrice(priceForm);
      setResponse({
        type: 'price',
        data: result.data.data,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to suggest price');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeListing = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await aiService.analyzeListingQuality(listingForm);
      setResponse({
        type: 'listing',
        data: result.data.data,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze listing');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await aiService.answerQuestion(questionForm);
      setResponse({
        type: 'question',
        data: result.data.data,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to answer question');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const newMessage = { role: 'user', content: chatInput };
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setLoading(true);
    setError('');

    try {
      const result = await aiService.chat({ messages: updatedMessages });
      setChatMessages([
        ...updatedMessages,
        { role: 'assistant', content: result.data.data.response },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      icon: <Description sx={{ fontSize: 40 }} />,
      title: 'AI Description Generator',
      description: 'Generate compelling product descriptions that sell',
      color: '#3665f3',
    },
    {
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      title: 'Smart Price Suggestions',
      description: 'Get AI-powered pricing recommendations',
      color: '#4caf50',
    },
    {
      icon: <Assessment sx={{ fontSize: 40 }} />,
      title: 'Listing Quality Analyzer',
      description: 'Optimize your listings for better visibility',
      color: '#ff9800',
    },
    {
      icon: <QuestionAnswer sx={{ fontSize: 40 }} />,
      title: 'Q&A Assistant',
      description: 'AI answers buyer questions automatically',
      color: '#9c27b0',
    },
    {
      icon: <Chat sx={{ fontSize: 40 }} />,
      title: 'AI Support Chat',
      description: '24/7 intelligent customer support',
      color: '#00bcd4',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Fraud Detection',
      description: 'AI-powered transaction safety analysis',
      color: '#f44336',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #3665f3 0%, #5c8ff5 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoAwesome sx={{ fontSize: 48, mr: 2 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              AI-Powered Features
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Powered by Claude Haiku via OpenRouter
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
          Leverage cutting-edge AI to create better listings, optimize pricing, and provide
          exceptional customer service. Our AI features help you sell smarter and faster.
        </Typography>
      </Paper>

      {/* Feature Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {featureCards.map((feature, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => setActiveTab(idx)}
            >
              <CardContent>
                <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" sx={{ color: feature.color }}>
                  Try Now
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Description />} label="Description" />
          <Tab icon={<AttachMoney />} label="Pricing" />
          <Tab icon={<Assessment />} label="Analyze" />
          <Tab icon={<QuestionAnswer />} label="Q&A" />
          <Tab icon={<Chat />} label="Chat" />
          <Tab icon={<Security />} label="Fraud" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Description Generator */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Generate Product Description
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Title"
                  value={descriptionForm.title}
                  onChange={(e) => setDescriptionForm({ ...descriptionForm, title: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Category"
                  value={descriptionForm.category}
                  onChange={(e) =>
                    setDescriptionForm({ ...descriptionForm, category: e.target.value })
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Condition"
                  value={descriptionForm.condition}
                  onChange={(e) =>
                    setDescriptionForm({ ...descriptionForm, condition: e.target.value })
                  }
                  margin="normal"
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </TextField>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={descriptionForm.price}
                  onChange={(e) => setDescriptionForm({ ...descriptionForm, price: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Key Features"
                  value={descriptionForm.features}
                  onChange={(e) =>
                    setDescriptionForm({ ...descriptionForm, features: e.target.value })
                  }
                  margin="normal"
                  multiline
                  rows={3}
                />
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                  onClick={handleGenerateDescription}
                  disabled={loading || !descriptionForm.title}
                  sx={{ mt: 2 }}
                  fullWidth
                  size="large"
                >
                  Generate Description
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                {response?.type === 'description' && (
                  <AIResponseDisplay
                    response={response.data.description}
                    title="Generated Description"
                    icon={<Description color="primary" />}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Price Suggestions */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Get Smart Price Suggestions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Title"
                  value={priceForm.title}
                  onChange={(e) => setPriceForm({ ...priceForm, title: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Category"
                  value={priceForm.category}
                  onChange={(e) => setPriceForm({ ...priceForm, category: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Condition"
                  value={priceForm.condition}
                  onChange={(e) => setPriceForm({ ...priceForm, condition: e.target.value })}
                  margin="normal"
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </TextField>
                <TextField
                  fullWidth
                  label="Description"
                  value={priceForm.description}
                  onChange={(e) => setPriceForm({ ...priceForm, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={4}
                />
                <Button
                  variant="contained"
                  color="success"
                  startIcon={loading ? <CircularProgress size={20} /> : <AttachMoney />}
                  onClick={handleSuggestPrice}
                  disabled={loading || !priceForm.title}
                  sx={{ mt: 2 }}
                  fullWidth
                  size="large"
                >
                  Get Price Suggestions
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                {response?.type === 'price' && (
                  <AIResponseDisplay
                    response={response.data.analysis}
                    title="Pricing Analysis"
                    icon={<TrendingUp color="success" />}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Listing Analyzer */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Analyze Listing Quality
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Listing Title"
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="Number of Images"
                  type="number"
                  value={listingForm.images}
                  onChange={(e) => setListingForm({ ...listingForm, images: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={listingForm.price}
                  onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Category"
                  value={listingForm.category}
                  onChange={(e) => setListingForm({ ...listingForm, category: e.target.value })}
                  margin="normal"
                />
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
                  onClick={handleAnalyzeListing}
                  disabled={loading || !listingForm.title}
                  sx={{ mt: 2 }}
                  fullWidth
                  size="large"
                >
                  Analyze Listing
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                {response?.type === 'listing' && (
                  <AIResponseDisplay
                    response={response.data.analysis}
                    title="Listing Analysis"
                    icon={<Lightbulb sx={{ color: '#ff9800' }} />}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Q&A Assistant */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              AI Q&A Assistant
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Title"
                  value={questionForm.productTitle}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, productTitle: e.target.value })
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Product Description"
                  value={questionForm.productDescription}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, productDescription: e.target.value })
                  }
                  margin="normal"
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="Buyer Question"
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="e.g., Does this come with a warranty?"
                />
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={loading ? <CircularProgress size={20} /> : <QuestionAnswer />}
                  onClick={handleAnswerQuestion}
                  disabled={loading || !questionForm.question}
                  sx={{ mt: 2 }}
                  fullWidth
                  size="large"
                >
                  Get AI Answer
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                {response?.type === 'question' && (
                  <AIResponseDisplay
                    response={response.data.answer}
                    title="AI Answer"
                    icon={<QuestionAnswer color="secondary" />}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Chat Support */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              AI Support Chat
            </Typography>
            <Paper
              sx={{
                height: 400,
                overflow: 'auto',
                p: 2,
                bgcolor: 'grey.50',
                mb: 2,
                borderRadius: 2,
              }}
            >
              {chatMessages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Chat sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography color="text.secondary">
                    Start a conversation with our AI support assistant
                  </Typography>
                </Box>
              ) : (
                chatMessages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2">{msg.content}</Typography>
                    </Paper>
                  </Box>
                ))
              )}
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    AI is typing...
                  </Typography>
                </Box>
              )}
            </Paper>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Ask a question about orders, returns, selling, etc."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
              />
              <Button
                variant="contained"
                onClick={handleChat}
                disabled={loading || !chatInput.trim()}
              >
                Send
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Fraud Detection */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Security sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              AI Fraud Detection
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Our AI continuously monitors transactions for suspicious activity. This feature runs
              automatically in the background to protect buyers and sellers.
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto' }}>
              Fraud detection is an automated system feature. All transactions are analyzed in
              real-time to ensure marketplace safety.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>

      {/* Model Info */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Info color="primary" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              AI Model: Claude Haiku via OpenRouter
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fast, intelligent responses powered by Anthropic's Claude AI for reliable marketplace
              assistance
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIFeatures;
