import { AppBar, Toolbar, Typography } from '@mui/material';
import React from 'react';

// Define the SVG icon as a React component
const AppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="256" 
    height="256" 
    viewBox="0 0 256 256" fill="none"
    style={{ marginRight: '10px' }}
    {...props}
  >
    <rect width="256" height="256" fill="#F0F4F8"/>
    <path d="M71 96C71 85.5033 79.5033 77 90 77H156L186 107M71 160V96M71 160H90C100.497 160 109 151.497 109 141V128" stroke="#007BFF" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="150" cy="120" r="35" stroke="#343A40" strokeWidth="14"/>
    <line x1="178" y1="148" x2="205" y2="175" stroke="#343A40" strokeWidth="18" strokeLinecap="round"/>
    <circle cx="150" cy="120" r="24" fill="#E7F5FF"/>
  </svg>
);

const HeaderBanner = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: '#F0F4F8' }}>
      <Toolbar>
        <AppIcon 
          width="64"
          height="64"
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1, color: "#007BFF"}} component="div">
          Personal Redirect Inspector
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBanner;