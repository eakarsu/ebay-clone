import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  ShoppingCart,
  Gavel,
  LocalShipping,
  Payment,
  Security,
  Help as HelpIcon,
  Sell,
  Store,
  AccountCircle,
  Receipt,
  SupportAgent,
} from '@mui/icons-material';

const helpTopics = {
  buying: {
    title: 'Buying Help',
    icon: <ShoppingCart />,
    description: 'Learn how to find items, place bids, and complete purchases',
    faqs: [
      {
        question: 'How do I place a bid?',
        answer: 'To place a bid, find an item you want, enter your maximum bid amount, and click "Place Bid". eBay will automatically bid on your behalf up to your maximum.',
      },
      {
        question: 'What is Buy It Now?',
        answer: 'Buy It Now allows you to purchase an item immediately at a fixed price without waiting for an auction to end.',
      },
      {
        question: 'How do I make an offer?',
        answer: 'If a listing shows "Make Offer", click the button and enter your proposed price. The seller can accept, decline, or counter your offer.',
      },
      {
        question: 'What is a proxy bid?',
        answer: 'Proxy bidding means you enter your maximum bid, and eBay automatically increases your bid incrementally to keep you in the lead, up to your maximum.',
      },
      {
        question: 'How do I track my order?',
        answer: 'Go to My Orders to see tracking information. Once the seller ships your item, tracking details will appear automatically.',
      },
      {
        question: 'What if I don\'t receive my item?',
        answer: 'Contact the seller first. If unresolved, open a case in the Resolution Center within 30 days of the estimated delivery date.',
      },
    ],
  },
  selling: {
    title: 'Selling Help',
    icon: <Sell />,
    description: 'Everything you need to know about listing and selling items',
    faqs: [
      {
        question: 'How do I create a listing?',
        answer: 'Click "Sell" in the top menu, fill in item details, add photos, set your price, and publish. You can choose auction-style or fixed price.',
      },
      {
        question: 'What are the listing options?',
        answer: 'You can list as Auction (buyers bid), Buy It Now (fixed price), or both. You can also enable Best Offer to negotiate prices.',
      },
      {
        question: 'How do I ship items?',
        answer: 'After a sale, print a shipping label from your sold items page. Pack securely and drop off at your carrier.',
      },
      {
        question: 'When do I get paid?',
        answer: 'Payments are processed through our secure system. Funds are typically available within 1-2 business days after delivery confirmation.',
      },
      {
        question: 'How do I handle returns?',
        answer: 'Set your return policy when listing. If a buyer requests a return, you\'ll receive a notification to approve or decline based on your policy.',
      },
      {
        question: 'What makes a good listing?',
        answer: 'Use clear photos, detailed descriptions, accurate item specifics, competitive pricing, and offer free shipping when possible.',
      },
    ],
  },
  fees: {
    title: 'Seller Fees',
    icon: <Receipt />,
    description: 'Understanding our fee structure',
    faqs: [
      {
        question: 'What fees does eBay charge?',
        answer: 'We charge a final value fee (percentage of total sale including shipping) and optional listing upgrade fees.',
      },
      {
        question: 'What is the final value fee?',
        answer: 'The final value fee is typically 12.9% of the total sale amount (item price + shipping), with a maximum of $750 per item for most categories.',
      },
      {
        question: 'Are there insertion fees?',
        answer: 'You get free listings each month. After that, a small insertion fee may apply depending on the starting price and category.',
      },
      {
        question: 'Do I pay fees if my item doesn\'t sell?',
        answer: 'If you used a free listing and the item doesn\'t sell, there\'s no fee. Insertion fees for paid listings are non-refundable.',
      },
      {
        question: 'How are fees calculated for offers?',
        answer: 'Fees are calculated based on the final accepted price, whether from auction, Buy It Now, or Best Offer.',
      },
      {
        question: 'When are fees charged?',
        answer: 'Fees are typically charged to your payment method on file at the beginning of each month for the previous month\'s sales.',
      },
    ],
  },
};

const quickLinks = [
  { icon: <ShoppingCart />, label: 'Buying', to: '/help/buying' },
  { icon: <Sell />, label: 'Selling', to: '/help/selling' },
  { icon: <Receipt />, label: 'Fees', to: '/help/fees' },
  { icon: <LocalShipping />, label: 'Shipping', to: '/help/shipping' },
  { icon: <Payment />, label: 'Payments', to: '/help/payments' },
  { icon: <Security />, label: 'Account Security', to: '/help/security' },
  { icon: <AccountCircle />, label: 'Account Settings', to: '/profile' },
  { icon: <SupportAgent />, label: 'Contact Us', to: '/contact' },
];

const Help = () => {
  const { topic } = useParams();
  const [searchQuery, setSearchQuery] = React.useState('');

  const currentTopic = topic ? helpTopics[topic] : null;

  if (currentTopic) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button component={Link} to="/help" sx={{ mb: 2 }}>
            ← Back to Help Center
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {currentTopic.icon}
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currentTopic.title}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {currentTopic.description}
          </Typography>
        </Box>

        <Box>
          {currentTopic.faqs.map((faq, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 600 }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.50' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Still need help?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" component={Link} to="/contact">
              Contact Us
            </Button>
            <Button variant="outlined" component={Link} to="/resolution">
              Resolution Center
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <HelpIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          How can we help you?
        </Typography>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: 'white' }}
          />
        </Box>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Browse Help Topics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {quickLinks.map((link) => (
          <Grid item xs={6} sm={4} md={3} key={link.label}>
            <Card
              component={Link}
              to={link.to}
              sx={{
                height: '100%',
                textDecoration: 'none',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 1 }}>{link.icon}</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {link.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Popular Questions
      </Typography>
      <Grid container spacing={3}>
        {Object.entries(helpTopics).map(([key, topic]) => (
          <Grid item xs={12} md={4} key={key}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {topic.icon}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {topic.title}
                </Typography>
              </Box>
              <List dense>
                {topic.faqs.slice(0, 3).map((faq, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemText
                      primary={faq.question}
                      primaryTypographyProps={{ variant: 'body2', color: 'primary.main' }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                component={Link}
                to={`/help/${key}`}
                size="small"
                sx={{ mt: 1 }}
              >
                View all →
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Help;
