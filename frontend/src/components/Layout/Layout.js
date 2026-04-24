import React from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import LiveChat from '../Features/LiveChat';
import ShoppingAssistant from '../ShoppingAssistant';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Footer />
      <LiveChat />
      <ShoppingAssistant />
    </Box>
  );
};

export default Layout;
