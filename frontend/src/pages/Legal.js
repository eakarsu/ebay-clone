import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Gavel, ArrowBack } from '@mui/icons-material';

const legalPages = {
  'user-agreement': {
    title: 'User Agreement',
    lastUpdated: 'January 1, 2024',
    content: [
      {
        heading: '1. Introduction',
        text: 'Welcome to eBay. This User Agreement describes the terms and conditions applicable to your use of our sites and services. By using eBay, you agree to these terms.',
      },
      {
        heading: '2. Using eBay',
        text: 'In connection with using or accessing eBay, you will not: post, list or upload content or items that breach this User Agreement or any other policies; circumvent or manipulate our fee structure; distribute viruses or any other technologies that may harm eBay or the interests of users.',
      },
      {
        heading: '3. Fees and Payments',
        text: 'We charge fees for using our services. When you list an item or make a purchase, you agree to pay all applicable fees. Fees are non-refundable unless otherwise stated.',
      },
      {
        heading: '4. Listing Conditions',
        text: 'When listing an item, you agree to provide accurate information, honor your listing terms, and ship items within the stated handling time. You are responsible for the accuracy of your listings.',
      },
      {
        heading: '5. Purchase Conditions',
        text: 'When you buy an item, you enter into a binding contract to purchase. You agree to pay for items within the required timeframe and to resolve any issues through our Resolution Center.',
      },
      {
        heading: '6. Content',
        text: 'You grant us a non-exclusive, worldwide, perpetual, irrevocable, royalty-free license to use the content you upload to eBay. You represent that you have the right to grant this license.',
      },
      {
        heading: '7. Disclaimer of Warranties',
        text: 'WE PROVIDE OUR SERVICES "AS IS" WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES. WE DO NOT GUARANTEE THAT OUR SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE.',
      },
      {
        heading: '8. Limitation of Liability',
        text: 'We are not liable for any damages arising from your use of eBay, including but not limited to direct, indirect, incidental, punitive, and consequential damages.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'January 1, 2024',
    content: [
      {
        heading: '1. Information We Collect',
        text: 'We collect information you provide directly (name, email, payment info), information collected automatically (IP address, device info, browsing history), and information from third parties.',
      },
      {
        heading: '2. How We Use Information',
        text: 'We use your information to provide services, process transactions, send communications, personalize your experience, improve our services, and ensure security.',
      },
      {
        heading: '3. Information Sharing',
        text: 'We may share your information with service providers, other users (as needed for transactions), legal authorities when required, and affiliates within our corporate family.',
      },
      {
        heading: '4. Your Choices',
        text: 'You can access, update, or delete your personal information through account settings. You can opt out of marketing communications and manage cookie preferences.',
      },
      {
        heading: '5. Data Security',
        text: 'We implement technical and organizational measures to protect your data, including encryption, access controls, and regular security assessments.',
      },
      {
        heading: '6. Data Retention',
        text: 'We retain your information for as long as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.',
      },
      {
        heading: '7. International Transfers',
        text: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.',
      },
      {
        heading: '8. Contact Us',
        text: 'If you have questions about this Privacy Policy, please contact us through our Help Center or at privacy@ebay.com.',
      },
    ],
  },
  cookies: {
    title: 'Cookies Policy',
    lastUpdated: 'January 1, 2024',
    content: [
      {
        heading: '1. What Are Cookies',
        text: 'Cookies are small text files stored on your device when you visit websites. They help us provide a better experience by remembering your preferences.',
      },
      {
        heading: '2. Types of Cookies We Use',
        text: 'Essential cookies (required for site function), Performance cookies (analytics), Functional cookies (preferences), Advertising cookies (personalized ads).',
      },
      {
        heading: '3. Managing Cookies',
        text: 'You can manage cookies through your browser settings. Note that disabling certain cookies may affect site functionality.',
      },
      {
        heading: '4. Third-Party Cookies',
        text: 'We allow third parties to place cookies for analytics and advertising purposes. These parties have their own privacy policies.',
      },
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    lastUpdated: 'January 1, 2024',
    content: [
      {
        heading: '1. Our Commitment',
        text: 'eBay is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone.',
      },
      {
        heading: '2. Accessibility Features',
        text: 'Our site includes keyboard navigation, screen reader compatibility, alt text for images, color contrast compliance, and resizable text.',
      },
      {
        heading: '3. Standards',
        text: 'We aim to conform to WCAG 2.1 Level AA standards. We regularly test our site with assistive technologies.',
      },
      {
        heading: '4. Feedback',
        text: 'If you encounter accessibility barriers, please contact us. We welcome feedback to help us improve accessibility.',
      },
    ],
  },
  adchoice: {
    title: 'AdChoice & Advertising',
    lastUpdated: 'January 1, 2024',
    content: [
      {
        heading: '1. Interest-Based Advertising',
        text: 'We and our partners may use cookies to show you ads based on your interests and browsing history across different websites.',
      },
      {
        heading: '2. Your Choices',
        text: 'You can opt out of interest-based advertising through the Digital Advertising Alliance or Network Advertising Initiative opt-out pages.',
      },
      {
        heading: '3. Mobile Advertising',
        text: 'On mobile devices, you can limit ad tracking through your device settings (iOS: Settings > Privacy > Advertising, Android: Settings > Google > Ads).',
      },
      {
        heading: '4. Do Not Track',
        text: 'Some browsers have a "Do Not Track" feature. We currently do not respond to DNT signals, but you can manage tracking through cookie settings.',
      },
    ],
  },
};

const Legal = () => {
  const { page } = useParams();
  const pageData = legalPages[page];

  if (!pageData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Gavel sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 2 }}>
            Page Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            The legal page you're looking for doesn't exist.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(legalPages).map(([key, value]) => (
              <Button key={key} component={Link} to={`/legal/${key}`} variant="outlined">
                {value.title}
              </Button>
            ))}
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={Link}
        to="/policies"
        startIcon={<ArrowBack />}
        sx={{ mb: 3 }}
      >
        Back to Policies
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {pageData.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Last updated: {pageData.lastUpdated}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {pageData.content.map((section, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {section.heading}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {section.text}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 4 }} />

        <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Questions about this policy?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contact our legal team at legal@ebay.com or visit our{' '}
            <Link to="/help">Help Center</Link>.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Legal;
